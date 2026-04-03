import type { Product } from '../types/api';
import { getFixtureProductsByType } from './products';

export function getFixtureBuildCandidates(componentType: string): Product[] {
  const components = getFixtureProductsByType('component');

  if (components.length > 0) {
    return components;
  }

  return [
    {
      id: '20000000-0000-4000-8000-000000000001',
      sku: `FIX-${componentType.toUpperCase()}-001`,
      slug: `fixture-${componentType}-part`,
      title: `Fixture ${componentType} Part`,
      product_type: 'component',
      brand: 'YS Fixture',
      model_name: `${componentType}-model`,
      condition: 'new',
      stock_status: 'in_stock',
      estimated_price_tzs: 250000,
      short_description: 'Fallback fixture component for local testing.',
      long_description: 'This fixture appears only when VITE_ENABLE_DEV_FIXTURES=true and backend is unavailable.',
      warranty_text: null,
      is_visible: true,
      is_featured: false,
      featured_tag: null,
      created_by_admin_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
}
