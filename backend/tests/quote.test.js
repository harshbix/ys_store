import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('quote generation from build cart is idempotent and returns whatsapp url', async () => {
  const agent = request.agent(app);

  const build = await agent.post('/api/builds').send({});
  assert.equal(build.status, 201);
  const buildId = build.body.data.id;

  const addToCart = await agent.post(`/api/builds/${buildId}/add-to-cart`).send();
  assert.equal(addToCart.status, 200);

  const cart = await agent.get('/api/cart');
  assert.equal(cart.status, 200);
  const cartId = cart.body.data.cart.id;

  const idempotencyKey = `idem-test-${Date.now()}`;
  const payload = {
    customer_name: 'Test User',
    source_type: 'cart',
    source_id: cartId,
    idempotency_key: idempotencyKey
  };

  const q1 = await agent.post('/api/quotes').send(payload);
  const q2 = await agent.post('/api/quotes').send(payload);

  assert.equal(q1.status, 201);
  assert.equal(q2.status, 201);
  assert.equal(q1.body.data.id, q2.body.data.id);
  assert.ok(q1.body.data.whatsapp_url);
});
