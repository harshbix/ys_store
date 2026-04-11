import { getBuildMarkdown, getProductMarkdown, getSitemapXmlPayload } from './service.js';

export async function getSitemapXmlController(req, res, next) {
  try {
    const payload = await getSitemapXmlPayload();

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
    res.setHeader('X-SEO-Sitemap-Cache', payload.cacheStatus);

    return res.status(200).send(payload.xml);
  } catch (error) {
    return next(error);
  }
}

export async function getProductMarkdownController(req, res, next) {
  try {
    const markdown = await getProductMarkdown(req.params.id);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    return res.status(200).send(markdown);
  } catch (error) {
    return next(error);
  }
}

export async function getBuildMarkdownController(req, res, next) {
  try {
    const markdown = await getBuildMarkdown(req.params.id);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    return res.status(200).send(markdown);
  } catch (error) {
    return next(error);
  }
}
