import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/app.js';
import { adminLoginToken } from './_helpers.js';

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

test('read parity: GET /api/products returns envelope and list payload shape', async () => {
  const res = await request(app)
    .get('/api/products')
    .query({ page: 1, limit: 20, sort: 'newest' });

  assert.equal(res.status, 200);
  assertSuccessEnvelope(res.body);
  assert.equal(Array.isArray(res.body.data.items), true);
  assert.equal(typeof res.body.data.total, 'number');
});

test('read parity: GET /api/products rejects invalid query with validation_error', async () => {
  const res = await request(app)
    .get('/api/products')
    .query({ page: 0, limit: 0, sort: 'bad_sort' });

  assert.equal(res.status, 400);
  assertErrorEnvelope(res.body);
  assert.equal(res.body.error_code, 'validation_error');
});

test('read parity: GET /api/products/:slug returns product detail for a real slug', async (t) => {
  const list = await request(app)
    .get('/api/products')
    .query({ page: 1, limit: 1, sort: 'newest' });

  assert.equal(list.status, 200);
  assertSuccessEnvelope(list.body);

  const item = list.body.data.items[0];
  if (!item?.slug) {
    t.skip('No visible products available to validate slug detail parity');
    return;
  }

  const detail = await request(app).get(`/api/products/${item.slug}`);
  assert.equal(detail.status, 200);
  assertSuccessEnvelope(detail.body);
  assert.equal(detail.body.data.slug, item.slug);
  assert.equal(Array.isArray(detail.body.data.specs), true);
  assert.equal(Array.isArray(detail.body.data.media), true);
});

test('read parity: GET /api/products/:slug returns 404 for missing slug', async () => {
  const slug = `missing-${Date.now()}`;
  const res = await request(app).get(`/api/products/${slug}`);

  assert.equal(res.status, 404);
  assertErrorEnvelope(res.body);
  assert.equal(res.body.error_code, 'product_not_found');
});

test('read parity: GET /api/cart returns cart payload envelope', async () => {
  const agent = request.agent(app);
  const res = await agent.get('/api/cart');

  assert.equal(res.status, 200);
  assertSuccessEnvelope(res.body);
  assert.equal(typeof res.body.data.cart.id, 'string');
  assert.equal(Array.isArray(res.body.data.items), true);
  assert.equal(typeof res.body.data.estimated_total_tzs, 'number');
});

test('read parity: GET /api/builds/:id returns build payload after create', async () => {
  const agent = request.agent(app);

  const created = await agent.post('/api/builds').send({ name: 'Parity Build' });
  assert.equal(created.status, 201);
  assertSuccessEnvelope(created.body);

  const buildId = created.body.data.id;
  const fetched = await agent.get(`/api/builds/${buildId}`);

  assert.equal(fetched.status, 200);
  assertSuccessEnvelope(fetched.body);
  assert.equal(fetched.body.data.id, buildId);
  assert.equal(Array.isArray(fetched.body.data.items), true);
});

test('read parity: GET /api/builds/:id returns 404 for missing build', async () => {
  const missingBuildId = crypto.randomUUID();
  const res = await request(app).get(`/api/builds/${missingBuildId}`);

  assert.equal(res.status, 404);
  assertErrorEnvelope(res.body);
  assert.equal(res.body.error_code, 'build_not_found');
});

test('read parity: GET /api/quotes/:quoteCode returns quote detail for created quote', async () => {
  const agent = request.agent(app);

  const build = await agent.post('/api/builds').send({ name: 'Quote Read Parity Build' });
  assert.equal(build.status, 201);

  const addToCart = await agent.post(`/api/builds/${build.body.data.id}/add-to-cart`).send({});
  assert.equal(addToCart.status, 200);

  const cart = await agent.get('/api/cart');
  assert.equal(cart.status, 200);

  const quoteCreate = await agent.post('/api/quotes').send({
    customer_name: 'Read Parity User',
    source_type: 'cart',
    source_id: cart.body.data.cart.id,
    idempotency_key: `read-parity-${Date.now()}`
  });

  assert.equal(quoteCreate.status, 201);
  assertSuccessEnvelope(quoteCreate.body);

  const quoteCode = quoteCreate.body.data.quote_code;
  const quoteGet = await agent.get(`/api/quotes/${quoteCode}`);

  assert.equal(quoteGet.status, 200);
  assertSuccessEnvelope(quoteGet.body);
  assert.equal(quoteGet.body.data.quote_code, quoteCode);
  assert.equal(Array.isArray(quoteGet.body.data.items), true);
});

test('read parity: GET /api/admin/products requires admin token and returns list with token', async () => {
  const unauth = await request(app).get('/api/admin/products');
  assert.equal(unauth.status, 401);
  assertErrorEnvelope(unauth.body);

  const token = await adminLoginToken();
  const auth = await request(app)
    .get('/api/admin/products')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(auth.status, 200);
  assertSuccessEnvelope(auth.body);
  assert.equal(Array.isArray(auth.body.data), true);
});