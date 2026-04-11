import { env } from '../../config/env.js';
import {
  findVisibleBuildPresetByIdentifier,
  findVisibleProductByIdentifier,
  listProductSpecsForMarkdown,
  listVisibleBuildPresetsForSitemap,
  listVisibleProductsForSitemap
} from './repository.js';

const MAX_SITEMAP_URLS = 5000;
const SITEMAP_CACHE_TTL_MS = 5 * 60 * 1000;
const MARKDOWN_CACHE_TTL_MS = 5 * 60 * 1000;

const staticSitemapEntries = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
  { path: '/builds', changefreq: 'daily', priority: '0.9' },
  { path: '/shop', changefreq: 'daily', priority: '0.8' },
  { path: '/builder', changefreq: 'weekly', priority: '0.7' }
];

const sitemapCache = {
  xml: '',
  expiresAt: 0,
  generatedAt: 0
};

const markdownCache = new Map();

function normalizeOriginCandidate(value) {
  if (!value) return null;

  try {
    const parsed = new URL(String(value).trim());
    if (!/^https?:$/i.test(parsed.protocol)) return null;
    return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function isLoopbackOrigin(origin) {
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function resolvePublicSiteOrigin() {
  const frontendOrigins = String(env.frontendUrl || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(normalizeOriginCandidate)
    .filter(Boolean);

  const candidates = [
    normalizeOriginCandidate(process.env.SEO_BASE_URL),
    normalizeOriginCandidate(process.env.PUBLIC_SITE_URL),
    ...frontendOrigins,
    normalizeOriginCandidate(env.appBaseUrl)
  ].filter(Boolean);

  if (!candidates.length) return 'https://ysstore.co.tz';

  if (env.nodeEnv === 'production') {
    const publicCandidate = candidates.find((candidate) => !isLoopbackOrigin(candidate));
    if (publicCandidate) return publicCandidate;
  }

  return candidates[0];
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function joinUrl(origin, pathname) {
  const normalizedOrigin = String(origin).replace(/\/+$/, '');
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${normalizedOrigin}${normalizedPath}`;
}

function toIsoTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function formatTzs(value) {
  const amount = Number(value || 0);
  return `TSh ${new Intl.NumberFormat('en-US').format(Number.isFinite(amount) ? amount : 0)}`;
}

function formatSpecLabel(key) {
  const normalized = String(key || '').replace(/[_-]+/g, ' ').trim();
  if (!normalized) return 'Specification';
  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatSpecValue(spec) {
  if (spec?.value_text) return String(spec.value_text);
  if (typeof spec?.value_number === 'number') {
    return spec.unit ? `${spec.value_number} ${spec.unit}` : String(spec.value_number);
  }
  if (typeof spec?.value_bool === 'boolean') {
    return spec.value_bool ? 'Yes' : 'No';
  }
  return 'N/A';
}

function getFromMarkdownCache(cacheKey) {
  const cached = markdownCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() >= cached.expiresAt) {
    markdownCache.delete(cacheKey);
    return null;
  }
  return cached.markdown;
}

function setMarkdownCache(cacheKey, markdown) {
  markdownCache.set(cacheKey, {
    markdown,
    expiresAt: Date.now() + MARKDOWN_CACHE_TTL_MS
  });
}

function buildSitemapUrlNode(entry) {
  const lines = [
    '  <url>',
    `    <loc>${xmlEscape(entry.loc)}</loc>`,
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`
  ];

  if (entry.lastmod) {
    lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  }

  lines.push('  </url>');
  return lines.join('\n');
}

function createSitemapXml(entries) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(buildSitemapUrlNode),
    '</urlset>'
  ].join('\n');
}

export async function getSitemapXmlPayload() {
  const now = Date.now();

  if (sitemapCache.xml && now < sitemapCache.expiresAt) {
    return {
      xml: sitemapCache.xml,
      cacheStatus: 'hit',
      generatedAt: sitemapCache.generatedAt
    };
  }

  const siteOrigin = resolvePublicSiteOrigin();
  const staticBudget = staticSitemapEntries.length;
  const dynamicBudget = Math.max(0, MAX_SITEMAP_URLS - staticBudget);
  const productLimit = Math.floor(dynamicBudget / 2);
  const buildLimit = dynamicBudget - productLimit;

  try {
    const [productsResult, buildsResult] = await Promise.all([
      listVisibleProductsForSitemap(productLimit),
      listVisibleBuildPresetsForSitemap(buildLimit)
    ]);

    if (productsResult.error) {
      throw { status: 500, code: 'seo_sitemap_products_failed', message: productsResult.error.message };
    }

    if (buildsResult.error) {
      throw { status: 500, code: 'seo_sitemap_builds_failed', message: buildsResult.error.message };
    }

    const staticEntries = staticSitemapEntries.map((entry) => ({
      loc: joinUrl(siteOrigin, entry.path),
      changefreq: entry.changefreq,
      priority: entry.priority,
      lastmod: null
    }));

    const productEntries = (productsResult.data || []).map((row) => {
      const slugOrId = row.slug ? encodeURIComponent(row.slug) : encodeURIComponent(row.id);
      return {
        loc: joinUrl(siteOrigin, `/products/${slugOrId}`),
        changefreq: 'daily',
        priority: '0.8',
        lastmod: toIsoTimestamp(row.updated_at || row.created_at)
      };
    });

    const buildEntries = (buildsResult.data || []).map((row) => ({
      loc: joinUrl(siteOrigin, `/builds/${encodeURIComponent(row.id)}`),
      changefreq: 'weekly',
      priority: '0.7',
      lastmod: toIsoTimestamp(row.updated_at || row.created_at)
    }));

    const entries = [...staticEntries, ...productEntries, ...buildEntries].slice(0, MAX_SITEMAP_URLS);
    const xml = createSitemapXml(entries);

    sitemapCache.xml = xml;
    sitemapCache.expiresAt = now + SITEMAP_CACHE_TTL_MS;
    sitemapCache.generatedAt = now;

    return {
      xml,
      cacheStatus: 'miss',
      generatedAt: now,
      counts: {
        static: staticEntries.length,
        products: productEntries.length,
        builds: buildEntries.length,
        total: entries.length
      }
    };
  } catch (error) {
    if (sitemapCache.xml) {
      return {
        xml: sitemapCache.xml,
        cacheStatus: 'stale',
        generatedAt: sitemapCache.generatedAt
      };
    }
    throw error;
  }
}

export async function getProductMarkdown(identifier) {
  const cacheKey = `product:${identifier}`;
  const cached = getFromMarkdownCache(cacheKey);
  if (cached) return cached;

  const productResult = await findVisibleProductByIdentifier(identifier);
  if (productResult.error) {
    throw { status: 500, code: 'seo_product_lookup_failed', message: productResult.error.message };
  }

  if (!productResult.data) {
    throw { status: 404, code: 'seo_product_not_found', message: 'Product not found' };
  }

  const product = productResult.data;
  const specsResult = await listProductSpecsForMarkdown(product.id);
  if (specsResult.error) {
    throw { status: 500, code: 'seo_product_specs_failed', message: specsResult.error.message };
  }

  const specs = specsResult.data || [];
  const siteOrigin = resolvePublicSiteOrigin();
  const productPathSegment = product.slug ? encodeURIComponent(product.slug) : encodeURIComponent(product.id);
  const publicUrl = joinUrl(siteOrigin, `/products/${productPathSegment}`);

  const lines = [
    `# ${product.title}`,
    '',
    `Price: ${formatTzs(product.estimated_price_tzs)}`,
    '',
    `Type: ${product.product_type}`,
    `Brand: ${product.brand || 'N/A'}`,
    `Model: ${product.model_name || 'N/A'}`,
    `Condition: ${product.condition}`,
    `Stock: ${product.stock_status}`,
    `Updated: ${toIsoTimestamp(product.updated_at || product.created_at) || 'N/A'}`,
    `Public URL: ${publicUrl}`,
    '',
    '## Specifications'
  ];

  if (!specs.length) {
    lines.push('- No detailed specifications available yet.');
  } else {
    for (const spec of specs.slice(0, 120)) {
      lines.push(`- ${formatSpecLabel(spec.spec_key)}: ${formatSpecValue(spec)}`);
    }
  }

  lines.push('');
  lines.push('## Description');
  lines.push(product.long_description || product.short_description || 'No additional description provided.');

  const markdown = lines.join('\n');
  setMarkdownCache(cacheKey, markdown);
  return markdown;
}

export async function getBuildMarkdown(identifier) {
  const cacheKey = `build:${identifier}`;
  const cached = getFromMarkdownCache(cacheKey);
  if (cached) return cached;

  const buildResult = await findVisibleBuildPresetByIdentifier(identifier);
  if (buildResult.error) {
    throw { status: 500, code: 'seo_build_lookup_failed', message: buildResult.error.message };
  }

  if (!buildResult.data) {
    throw { status: 404, code: 'seo_build_not_found', message: 'Build not found' };
  }

  const build = buildResult.data;
  const siteOrigin = resolvePublicSiteOrigin();
  const publicUrl = joinUrl(siteOrigin, `/builds/${encodeURIComponent(build.id)}`);
  const items = Array.isArray(build.pc_build_preset_items)
    ? [...build.pc_build_preset_items].sort((a, b) => Number(a.slot_order || 0) - Number(b.slot_order || 0))
    : [];

  const lines = [
    `# ${build.name}`,
    '',
    `Price: ${formatTzs(build.total_tzs)}`,
    '',
    `CPU Family: ${build.cpu_family || 'N/A'}`,
    `Status: ${build.status}`,
    `Compatibility: ${build.compatibility_status || 'unknown'}`,
    `Estimated System Wattage: ${build.estimated_system_wattage || 'N/A'}`,
    `Required PSU Wattage: ${build.required_psu_wattage || 'N/A'}`,
    `Updated: ${toIsoTimestamp(build.updated_at || build.created_at) || 'N/A'}`,
    `Public URL: ${publicUrl}`,
    '',
    '## Components'
  ];

  if (!items.length) {
    lines.push('- No component breakdown available.');
  } else {
    for (const item of items) {
      const componentName = item.pc_components?.name || item.component_id || 'Unknown component';
      const qty = Number(item.quantity || 1);
      const lineTotal = Number(item.line_total_tzs || item.unit_price_tzs || 0);
      const componentType = formatSpecLabel(item.component_type || 'component');
      lines.push(`- ${componentType}: ${componentName} (x${qty}) - ${formatTzs(lineTotal)}`);
    }
  }

  lines.push('');
  lines.push('## Description');
  lines.push('Prebuilt PC configuration from YS Store with curated compatibility and component pricing.');

  const markdown = lines.join('\n');
  setMarkdownCache(cacheKey, markdown);
  return markdown;
}
