import type { Product, ProductMedia, ProductType } from '../types/api';

const fallbackMap: Record<ProductType, string> = {
  desktop: '/placeholders/desktop.svg',
  laptop: '/placeholders/laptop.svg',
  component: '/placeholders/component.svg',
  accessory: '/placeholders/accessory.svg'
};

const componentFallbacks: Array<{ keywords: string[]; image: string }> = [
  { keywords: ['rtx', 'radeon', 'gpu', 'graphics'], image: '/placeholders/gpu.svg' },
  { keywords: ['intel', 'ryzen', 'cpu', 'processor'], image: '/placeholders/cpu.svg' },
  { keywords: ['motherboard', 'b650', 'z790', 'mainboard'], image: '/placeholders/motherboard.svg' },
  { keywords: ['ram', 'memory', 'ddr4', 'ddr5'], image: '/placeholders/ram.svg' },
  { keywords: ['ssd', 'nvme', 'storage'], image: '/placeholders/ssd.svg' },
  { keywords: ['psu', 'power supply'], image: '/placeholders/psu.svg' },
  { keywords: ['monitor', 'display'], image: '/placeholders/monitor.svg' }
];

type ProductImageSource = Pick<Product, 'product_type'> &
  Partial<Pick<Product, 'title' | 'slug' | 'model_name'>> & {
    primary_image_url?: string | null;
    thumb_url?: string | null;
    full_url?: string | null;
    original_url?: string | null;
    media?: Array<
      Pick<ProductMedia, 'thumb_url' | 'full_url' | 'original_url'> & {
        is_primary?: boolean;
      }
    >;
  };

export function placeholderForType(type: ProductType): string {
  return fallbackMap[type] || '/placeholders/component.svg';
}

export function placeholderForProduct(product: ProductImageSource): string {
  if (product.product_type !== 'component') {
    return placeholderForType(product.product_type);
  }

  const searchable = `${product.title || ''} ${product.slug || ''} ${product.model_name || ''}`.toLowerCase();
  const matched = componentFallbacks.find((entry) => entry.keywords.some((keyword) => searchable.includes(keyword)));

  return matched?.image || fallbackMap.component;
}

function firstMediaUrl(media: ProductImageSource['media']): string | null {
  if (!media || media.length === 0) return null;
  const primary = media.find((entry) => entry.is_primary);
  const candidate = primary || media[0];
  return candidate.thumb_url || candidate.full_url || candidate.original_url || null;
}

export function getProductImage(product: ProductImageSource): string {
  const preferred =
    product.primary_image_url || product.thumb_url || product.full_url || product.original_url || firstMediaUrl(product.media);

  return resolveProductImage(product, preferred);
}

export function resolveProductImage(product: ProductImageSource, preferred?: string | null): string {
  if (preferred && preferred.trim().length > 0) {
    return preferred;
  }

  return placeholderForProduct(product);
}
