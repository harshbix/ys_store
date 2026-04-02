import {
  findProducts,
  findProductBySlug,
  findProductSpecs,
  findProductMedia,
  findFilterOptions,
  findCompareProducts,
  findSpecsForProducts,
  findProductIdsBySpecText,
  findProductIdsBySpecNumberMin
} from './repository.js';

function intersectSets(sets) {
  if (!sets.length) return null;
  let result = new Set(sets[0]);
  for (let i = 1; i < sets.length; i += 1) {
    result = new Set([...result].filter((id) => sets[i].has(id)));
  }
  return result;
}

async function getSpecFilteredProductIds(filters) {
  const checks = [];

  if (filters.cpu) checks.push(findProductIdsBySpecText('cpu_model', filters.cpu));
  if (filters.gpu) checks.push(findProductIdsBySpecText('gpu_model', filters.gpu));
  if (filters.ram_gb !== undefined) checks.push(findProductIdsBySpecNumberMin('ram_gb', filters.ram_gb));
  if (filters.storage_gb !== undefined) checks.push(findProductIdsBySpecNumberMin('storage_gb', filters.storage_gb));
  if (filters.screen_size !== undefined) checks.push(findProductIdsBySpecNumberMin('screen_size_in', filters.screen_size));
  if (filters.refresh_rate !== undefined) checks.push(findProductIdsBySpecNumberMin('refresh_rate_hz', filters.refresh_rate));

  if (!checks.length) return null;

  const results = await Promise.all(checks);
  for (const r of results) {
    if (r.error) {
      throw { status: 500, code: 'spec_filter_query_failed', message: r.error.message };
    }
  }

  const sets = results.map((r) => new Set((r.data || []).map((row) => row.product_id)));
  const intersected = intersectSets(sets);
  return intersected ? [...intersected] : null;
}

export async function searchProducts(filters) {
  const specFilteredIds = await getSpecFilteredProductIds(filters);
  const { data, error, count } = await findProducts(filters, specFilteredIds);
  if (error) throw { status: 500, code: 'products_query_failed', message: error.message };
  return { items: data || [], total: count || 0 };
}

export async function getProductDetail(slug) {
  const productResult = await findProductBySlug(slug);
  if (productResult.error) throw { status: 500, code: 'product_lookup_failed', message: productResult.error.message };
  if (!productResult.data) throw { status: 404, code: 'product_not_found', message: 'Product not found' };

  const [specsRes, mediaRes] = await Promise.all([
    findProductSpecs(productResult.data.id),
    findProductMedia(productResult.data.id)
  ]);

  if (specsRes.error) throw { status: 500, code: 'specs_lookup_failed', message: specsRes.error.message };
  if (mediaRes.error) throw { status: 500, code: 'media_lookup_failed', message: mediaRes.error.message };

  return {
    ...productResult.data,
    specs: specsRes.data || [],
    media: mediaRes.data || []
  };
}

export async function getFilterOptions(productType) {
  const { data, error } = await findFilterOptions(productType);
  if (error) throw { status: 500, code: 'filter_options_failed', message: error.message };
  return data || [];
}

export async function compareProducts(productIds) {
  const { data, error } = await findCompareProducts(productIds);
  if (error) throw { status: 500, code: 'compare_failed', message: error.message };

  const products = data || [];
  if (!products.length) return [];

  const specRes = await findSpecsForProducts(products.map((p) => p.id));
  if (specRes.error) throw { status: 500, code: 'compare_specs_failed', message: specRes.error.message };

  const specsByProduct = (specRes.data || []).reduce((acc, row) => {
    if (!acc[row.product_id]) acc[row.product_id] = [];
    acc[row.product_id].push(row);
    return acc;
  }, {});

  return products.map((p) => ({
    ...p,
    specs: specsByProduct[p.id] || []
  }));
}
