import {
  findProducts,
  findProductBySlug,
  findProductSpecs,
  findProductMedia,
  findFilterOptions,
  findCompareProducts
} from './repository.js';

export async function searchProducts(filters) {
  const { data, error, count } = await findProducts(filters);
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
  return data || [];
}
