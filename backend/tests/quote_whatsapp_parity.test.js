import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

function assertSuccessEnvelope(body) {
  assert.equal(typeof body, 'object');
  assert.equal(body.success, true);
  assert.equal(typeof body.message, 'string');
  assert.ok(Object.hasOwn(body, 'data'));
}

function assertErrorEnvelope(body) {
  assert.equal(typeof body, 'object');
  assert.equal(body.success, false);
  assert.equal(typeof body.error_code, 'string');
  assert.equal(typeof body.message, 'string');
}

async function prepareCartWithOneProduct(agent) {
  const productList = await agent
    .get('/api/products')
    .query({ page: 1, limit: 1, sort: 'newest' });

  assert.equal(productList.status, 200);
  const productId = productList.body?.data?.items?.[0]?.id;
  assert.ok(productId);

  const added = await agent.post('/api/cart/items').send({
    item_type: 'product',
    product_id: productId,
    quantity: 1
  });

  assert.equal(added.status, 201);

  const cart = await agent.get('/api/cart');
  assert.equal(cart.status, 200);
  return cart.body.data.cart.id;
}

test('phase 6 parity: quote_code prefix format remains stable by quote_type', async () => {
  const prefixByType = {
    laptop: 'LAP',
    desktop: 'DESK',
    build: 'BUILD',
    upgrade: 'UPG',
    warranty: 'WAR',
    general: 'QUOTE'
  };

  const types = Object.keys(prefixByType);

  for (const quoteType of types) {
    const agent = request.agent(app);
    const cartId = await prepareCartWithOneProduct(agent);

    const created = await agent.post('/api/quotes').send({
      customer_name: `Type ${quoteType}`,
      source_type: 'cart',
      source_id: cartId,
      quote_type: quoteType,
      idempotency_key: `type-${quoteType}-${Date.now()}-${Math.random().toString(16).slice(2)}`
    });

    assert.equal(created.status, 201);
    assertSuccessEnvelope(created.body);

    const quoteCode = created.body.data.quote_code;
    assert.match(quoteCode, new RegExp(`^${prefixByType[quoteType]}-[A-Z2-9]{5}$`));
  }
});

test('phase 6 parity: quote create returns wa.me URL with encoded message contract', async () => {
  const agent = request.agent(app);
  const cartId = await prepareCartWithOneProduct(agent);

  const created = await agent.post('/api/quotes').send({
    customer_name: 'WhatsApp Format User',
    source_type: 'cart',
    source_id: cartId,
    quote_type: 'general',
    idempotency_key: `wa-format-${Date.now()}`
  });

  assert.equal(created.status, 201);
  assertSuccessEnvelope(created.body);

  const record = created.body.data;
  assert.equal(typeof record.whatsapp_url, 'string');
  assert.equal(typeof record.whatsapp_message, 'string');
  assert.equal(typeof record.whatsapp_meta, 'object');

  const waUrl = new URL(record.whatsapp_url);
  assert.equal(waUrl.hostname, 'wa.me');
  assert.equal(waUrl.protocol, 'https:');
  assert.ok(waUrl.searchParams.has('text'));

  const decodedText = decodeURIComponent(waUrl.searchParams.get('text') || '');
  if (!record.whatsapp_meta.usedFallback) {
    assert.equal(decodedText, record.whatsapp_message);
  }
});

test('phase 6 parity: deterministic idempotency fallback returns same quote for same payload', async () => {
  const agent = request.agent(app);
  const cartId = await prepareCartWithOneProduct(agent);

  const payload = {
    customer_name: 'Fallback Idem User',
    source_type: 'cart',
    source_id: cartId,
    quote_type: 'desktop',
    notes: 'same payload should hash to same idempotency key'
  };

  const first = await agent.post('/api/quotes').send(payload);
  const second = await agent.post('/api/quotes').send(payload);

  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assertSuccessEnvelope(first.body);
  assertSuccessEnvelope(second.body);

  assert.equal(first.body.data.id, second.body.data.id);
  assert.equal(first.body.data.quote_code, second.body.data.quote_code);
});

test('phase 6 parity: whatsapp-click denies cross-session ownership', async () => {
  const owner = request.agent(app);
  const attacker = request.agent(app);

  const cartId = await prepareCartWithOneProduct(owner);
  const created = await owner.post('/api/quotes').send({
    customer_name: 'Owner User',
    source_type: 'cart',
    source_id: cartId,
    idempotency_key: `cross-wa-${Date.now()}`
  });

  assert.equal(created.status, 201);

  const quoteCode = created.body.data.quote_code;

  const blocked = await attacker.post(`/api/quotes/${quoteCode}/whatsapp-click`).send({});
  assert.equal(blocked.status, 404);
  assertErrorEnvelope(blocked.body);
  assert.equal(blocked.body.error_code, 'quote_not_found');
});