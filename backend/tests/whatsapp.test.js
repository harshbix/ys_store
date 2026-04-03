import test from 'node:test';
import assert from 'node:assert/strict';
import { formatWhatsAppMessage, generateWhatsAppUrl } from '../src/utils/whatsapp.js';

test('whatsapp url generation returns encoded wa.me link', () => {
  const message = formatWhatsAppMessage({
    quoteCode: 'QUOTE-12345',
    customerName: 'Alice',
    items: [{ title_snapshot: 'Gaming PC', quantity: 1 }],
    estimatedTotalTzs: 1500000,
    notes: 'Call me'
  });

  const out = generateWhatsAppUrl(message);

  assert.ok(out.url.includes('https://wa.me/'));
  assert.equal(typeof out.encodedLength, 'number');
  assert.equal(typeof out.usedFallback, 'boolean');
});
