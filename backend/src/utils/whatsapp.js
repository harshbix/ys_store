import { env } from '../config/env.js';

export function formatWhatsAppMessage({ quoteCode, customerName, items, estimatedTotalTzs, notes }) {
  const lines = [];
  lines.push(`Quote ID: ${quoteCode}`);
  lines.push(`Name: ${customerName}`);
  lines.push('Items:');

  items.forEach((item, idx) => {
    lines.push(`${idx + 1}) ${item.title_snapshot} x${item.quantity}`);
  });

  lines.push(`Estimated Total: TZS ${estimatedTotalTzs.toLocaleString('en-US')}`);
  if (notes && notes.trim()) {
    lines.push(`Notes: ${notes.trim()}`);
  }

  return lines.join('\n');
}

export function generateWhatsAppUrl(message) {
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${env.whatsappPhoneE164}?text=${encoded}`;

  // Safe MVP fallback for very long URLs.
  if (url.length > 1800) {
    return {
      url: `https://wa.me/${env.whatsappPhoneE164}?text=${encodeURIComponent('Please see full quote details in system using your Quote ID.')}`,
      encodedLength: url.length,
      usedFallback: true
    };
  }

  return {
    url,
    encodedLength: url.length,
    usedFallback: false
  };
}
