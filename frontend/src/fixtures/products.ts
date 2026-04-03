import type { Product, ProductDetail, ProductMedia, ProductSpec } from '../types/api';

const now = new Date().toISOString();

const fixtureProducts: Product[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    sku: 'YS-DESK-4070-001',
    slug: 'ys-gaming-desktop-rtx4070',
    title: 'YS Gaming Desktop RTX 4070',
    product_type: 'desktop',
    brand: 'YS Custom',
    model_name: 'Titan 4070',
    condition: 'new',
    stock_status: 'in_stock',
    estimated_price_tzs: 3450000,
    short_description: 'High-performance desktop for gaming and content workloads.',
    long_description: 'Custom tuned desktop build with modern airflow and stable thermals.',
    warranty_text: '12 months warranty',
    is_visible: true,
    is_featured: true,
    featured_tag: 'recommended',
    created_by_admin_id: null,
    created_at: now,
    updated_at: now
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    sku: 'YS-LAP-4060-001',
    slug: 'ys-gaming-laptop-4060',
    title: 'YS Gaming Laptop RTX 4060',
    product_type: 'laptop',
    brand: 'Aorus',
    model_name: 'A16 4060',
    condition: 'new',
    stock_status: 'in_stock',
    estimated_price_tzs: 2890000,
    short_description: 'Portable high-refresh gaming laptop with modern GPU acceleration.',
    long_description: 'Balanced laptop for gaming, streaming, and creative editing.',
    warranty_text: '12 months warranty',
    is_visible: true,
    is_featured: true,
    featured_tag: 'best_seller',
    created_by_admin_id: null,
    created_at: now,
    updated_at: now
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    sku: 'YS-COMP-GPU-001',
    slug: 'nvidia-rtx-4070-super',
    title: 'NVIDIA RTX 4070 Super',
    product_type: 'component',
    brand: 'NVIDIA',
    model_name: 'RTX 4070 Super',
    condition: 'new',
    stock_status: 'low_stock',
    estimated_price_tzs: 1850000,
    short_description: 'Powerful GPU for high fps gaming and creator pipelines.',
    long_description: 'Efficient next-gen graphics card for premium 1440p performance.',
    warranty_text: '12 months warranty',
    is_visible: true,
    is_featured: true,
    featured_tag: 'hot_deal',
    created_by_admin_id: null,
    created_at: now,
    updated_at: now
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    sku: 'YS-ACC-MON-001',
    slug: 'ys-27in-165hz-monitor',
    title: 'YS 27 inch 165Hz Monitor',
    product_type: 'accessory',
    brand: 'YS Select',
    model_name: 'Vision 27 165',
    condition: 'new',
    stock_status: 'in_stock',
    estimated_price_tzs: 520000,
    short_description: 'Fast refresh QHD monitor with accurate color profile.',
    long_description: 'Premium monitor tuned for both gaming and daily productivity.',
    warranty_text: '6 months warranty',
    is_visible: true,
    is_featured: false,
    featured_tag: null,
    created_by_admin_id: null,
    created_at: now,
    updated_at: now
  }
];

function specsFor(product: Product): ProductSpec[] {
  if (product.product_type === 'desktop') {
    return [
      {
        id: 1,
        product_id: product.id,
        spec_key: 'cpu_model',
        value_text: 'Intel Core i7-13700F',
        value_number: null,
        value_bool: null,
        value_json: null,
        unit: null,
        sort_order: 10,
        created_at: now
      },
      {
        id: 2,
        product_id: product.id,
        spec_key: 'gpu_model',
        value_text: 'RTX 4070',
        value_number: null,
        value_bool: null,
        value_json: null,
        unit: null,
        sort_order: 20,
        created_at: now
      }
    ];
  }

  if (product.product_type === 'laptop') {
    return [
      {
        id: 3,
        product_id: product.id,
        spec_key: 'screen_size_in',
        value_text: null,
        value_number: 16,
        value_bool: null,
        value_json: null,
        unit: 'in',
        sort_order: 10,
        created_at: now
      },
      {
        id: 4,
        product_id: product.id,
        spec_key: 'refresh_rate_hz',
        value_text: null,
        value_number: 165,
        value_bool: null,
        value_json: null,
        unit: 'Hz',
        sort_order: 20,
        created_at: now
      }
    ];
  }

  return [
    {
      id: 5,
      product_id: product.id,
      spec_key: 'ram_gb',
      value_text: null,
      value_number: 16,
      value_bool: null,
      value_json: null,
      unit: 'GB',
      sort_order: 10,
      created_at: now
    }
  ];
}

function mediaFor(product: Product): ProductMedia[] {
  const image = `/placeholders/${product.product_type}.svg`;

  return [
    {
      id: `media-${product.id}`,
      product_id: product.id,
      original_url: image,
      thumb_url: image,
      full_url: image,
      width: 1200,
      height: 900,
      size_bytes: null,
      alt_text: product.title,
      is_primary: true,
      sort_order: 0,
      created_at: now
    }
  ];
}

export function getFixtureProducts() {
  return fixtureProducts;
}

export function getFixtureProductDetail(slug: string): ProductDetail | null {
  const product = fixtureProducts.find((entry) => entry.slug === slug);
  if (!product) return null;

  return {
    ...product,
    specs: specsFor(product),
    media: mediaFor(product)
  };
}

export function getFixtureProductsByType(type?: Product['product_type']) {
  if (!type) return fixtureProducts;
  return fixtureProducts.filter((product) => product.product_type === type);
}
