import type { CartPayload } from '../types/api';

/**
 * Format a number as TZS currency.
 */
function formatTzs(amount: number): string {
  return new Intl.NumberFormat('en-TZ', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Maps custom build specs_snapshot into readable parts.
 */
function extractBuildParts(specs: Record<string, unknown> | null): Record<string, string> {
  if (!specs) return {};

  const parts: Record<string, string> = {};
  
  // Extract parts robustly checking standard structures or flat keys
  const mapPart = (key: string, label: string) => {
    let value = specs[key] || specs[key.toLowerCase()] || specs[key.toUpperCase()];
    
    // If it's nested (e.g. { title: '...', price: ... })
    if (value && typeof value === 'object') {
      const v = value as Record<string, any>;
      value = v.title || v.name || v.title_snapshot || v.product_name;
    }
    
    if (value && typeof value === 'string') {
      parts[label] = value;
    }
  };

  mapPart('cpu', 'CPU');
  mapPart('gpu', 'GPU');
  mapPart('motherboard', 'Motherboard');
  mapPart('ram', 'RAM');
  mapPart('storage', 'Storage');
  mapPart('psu', 'Power Supply');
  mapPart('power_supply', 'Power Supply');
  mapPart('case', 'Case');
  mapPart('cooler', 'Cooling');
  mapPart('cooling', 'Cooling');
  mapPart('monitor', 'Monitor');
  mapPart('keyboard_mouse', 'Accessories');
  mapPart('accessories', 'Accessories');
  mapPart('windows_license', 'OS');

  // Fallback for flat structure if they don't match the specific keys above
  for (const [k, v] of Object.entries(specs)) {
    if (typeof v === 'string' && !Object.values(parts).includes(v)) {
      // Ignore keys that are obviously not parts
      if (!k.includes('price') && !k.includes('id') && !k.includes('type')) {
        const prettyKey = k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' ');
        // only add if not already mapped
        if (!parts[prettyKey]) {
           parts[prettyKey] = v;
        }
      }
    }
  }

  return parts;
}

/**
 * Generates an appropriate WhatsApp message based on the Cart payload.
 */
export function generateWhatsAppMessage(cartPayload: CartPayload, customerName: string): string {
  const items = cartPayload.items || [];
  const total = cartPayload.estimated_total_tzs || 0;
  const name = customerName.trim();

  // 1. Empty cart (should not happen, but safe)
  if (items.length === 0) {
    return `Hello, my name is ${name}.\n\nI would like to place an order, please assist me.`;
  }

  // 2. Custom build
  if (items.length === 1 && items[0].item_type === 'custom_build') {
    const build = items[0];
    const parts = extractBuildParts(build.specs_snapshot);
    const partsText = Object.entries(parts)
      .map(([label, value]) => `${label}: ${value}`)
      .join('\n');

    return `Hello, my name is ${name}.\n\nI would like to order this custom PC build:\n\n${partsText}\n\nEstimated Total: TZS ${formatTzs(total)}\n\nPlease assist me with confirmation, availability, and next steps.`;
  }

  // 3. Single simple product
  if (items.length === 1) {
    const item = items[0];
    return `Hello, my name is ${name}.\n\nI would like to order:\n\n${item.title_snapshot} (x${item.quantity})\nPrice: TZS ${formatTzs(item.unit_estimated_price_tzs * item.quantity)}\n\nPlease assist me with availability and next steps.`;
  }

  // 4. Multiple cart items
  const itemsList = items.map((item, index) => {
    return `${index + 1}. ${item.title_snapshot} (x${item.quantity}) — TZS ${formatTzs(item.unit_estimated_price_tzs * item.quantity)}`;
  }).join('\n');

  return `Hello, my name is ${name}.\n\nI would like to order the following items:\n\n${itemsList}\n\nTotal: TZS ${formatTzs(total)}\n\nPlease assist me with availability and delivery.`;
}
