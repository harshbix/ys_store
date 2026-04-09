import type { CartPayload } from '../types/api';
import { supabase } from '../lib/supabase';

/**
 * Format a number as TZS currency.
 */
function formatPrice(value: number) {
  return new Intl.NumberFormat("en-TZ").format(value);
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
  
  // Power supply
  mapPart('psu', 'Power Supply');
  mapPart('power_supply', 'Power Supply');
  
  // Case
  mapPart('case', 'Case');
  
  // Cooling
  mapPart('cooler', 'Cooling');
  mapPart('cooling', 'Cooling');

  return parts;
}

/**
 * Generates an appropriate WhatsApp message based on the Cart payload.
 */
export async function generateWhatsAppMessage(cartPayload: CartPayload, customerName: string): Promise<string> {
  const items = cartPayload.items || [];
  const total = cartPayload.estimated_total_tzs || 0;
  const name = customerName.trim();

  // 1. Empty cart (should not happen, but safe)
  if (items.length === 0) {
    return `Hello, my name is ${name}.\n\nI would like to place an order, please assist me.`;
  }

  const isCustomBuild = items.length === 1 && items[0].item_type === 'custom_build';

  // 2. Custom build
  if (isCustomBuild) {
    const build = items[0];
    const customBuildId = build.custom_build_id;

    // Fetch the actual build components to get full names & prices.
    let fetchedParts: Record<string, { name: string; price: number }> = {};
    if (customBuildId) {
      try {
        const { data: buildItems } = await supabase
          .from('custom_build_items')
          .select('component_type, pc_components(name, price_tzs)')
          .eq('custom_build_id', customBuildId);
        
        if (buildItems) {
          buildItems.forEach((bItem: any) => {
            if (bItem.pc_components) {
              fetchedParts[bItem.component_type.toLowerCase()] = {
                name: bItem.pc_components.name,
                price: bItem.pc_components.price_tzs || 0
              };
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch custom build items for WhatsApp message', err);
      }
    }

    // Fallback if network fails: try to extract from snapshot but without price
    const fallbackParts = extractBuildParts(build.specs_snapshot);
    const buildingCost = 50000;
    const buildTotal = total + buildingCost;
    
    const lines: string[] = [];
    lines.push(`Hello, my name is ${name}.`);
    lines.push('');
    lines.push('I would like to order a custom PC build with the following specifications:');
    lines.push('');
    
    // Ordered as specified
    const orderedLabels = [
      { key: 'cpu', label: 'CPU' },
      { key: 'gpu', label: 'GPU' },
      { key: 'motherboard', label: 'Motherboard' },
      { key: 'ram', label: 'RAM' },
      { key: 'storage', label: 'Storage' },
      { key: 'psu', label: 'Power Supply' },
      { key: 'case', label: 'Case' },
      { key: 'cooler', label: 'Cooling' }
    ];

    for (const { key, label } of orderedLabels) {
      if (fetchedParts[key]) {
        lines.push(`- *${label}*: ${fetchedParts[key].name} _(TZS ${formatPrice(fetchedParts[key].price)})_`);
      } else if (fallbackParts[label] || fallbackParts[key]) {
        const val = fallbackParts[label] || fallbackParts[key];
        lines.push(`- *${label}*: ${val}`);
      }
    }
    
    lines.push('');
    lines.push(`- *Build Fee*: _TZS ${formatPrice(buildingCost)}_`);
    lines.push('----------------------------------');
    lines.push(`*Estimated Total*: *TZS ${formatPrice(buildTotal)}*`);
    lines.push('----------------------------------');
    lines.push('');
    lines.push('Please assist me with confirmation and availability.');

    return lines.join('\n');
  }

  // 3. Single normal product
  if (items.length === 1 && !isCustomBuild) {
    const item = items[0];
    const lines: string[] = [];
    lines.push(`Hello, my name is ${name}.`);
    lines.push('');
    lines.push('I would like to order:');
    lines.push('');
    lines.push(`${item.title_snapshot} — TZS ${formatPrice(item.unit_estimated_price_tzs * item.quantity)}`);
    lines.push('');
    lines.push('Please assist me with availability and delivery.');

    return lines.join('\n');
  }

  // 4. Multi-item cart
  const lines: string[] = [];
  lines.push(`Hello, my name is ${name}.`);
  lines.push('');
  lines.push('I would like to order the following items:');
  lines.push('');
  
  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.title_snapshot} — TZS ${formatPrice(item.unit_estimated_price_tzs * item.quantity)}`);
  });
  
  lines.push('');
  lines.push(`Total: TZS ${formatPrice(total)}`);
  lines.push('');
  lines.push('Please assist me with availability and delivery.');

  return lines.join('\n');
}
