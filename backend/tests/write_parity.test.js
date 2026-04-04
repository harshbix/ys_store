import test from 'node:test';
import assert from 'node:assert/strict';
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

async function getOneVisibleProductId(agent, t, query = {}) {
  const list = await agent
    .get('/api/products')
    .query({ page: 1, limit: 1, sort: 'newest', ...query });

  assert.equal(list.status, 200);
  const productId = list.body?.data?.items?.[0]?.id;
  if (!productId) {
    t.skip('No visible product found for write parity test');
    return null;
  }

  return productId;
}

test('write parity: cart item lifecycle add/update/delete', async (t) => {
  const agent = request.agent(app);
  const productId = await getOneVisibleProductId(agent, t);
  if (!productId) return;

  const added = await agent.post('/api/cart/items').send({
    item_type: 'product',
    product_id: productId,
    quantity: 1
  });

  assert.equal(added.status, 201);
  assertSuccessEnvelope(added.body);

  const createdItem = (added.body.data.items || []).find((i) => i.product_id === productId);
  assert.ok(createdItem?.id);

  const updated = await agent.patch(`/api/cart/items/${createdItem.id}`).send({ quantity: 3 });
  assert.equal(updated.status, 200);
  assertSuccessEnvelope(updated.body);

  const updatedItem = (updated.body.data.items || []).find((i) => i.id === createdItem.id);
  assert.equal(updatedItem?.quantity, 3);

  const removed = await agent.delete(`/api/cart/items/${createdItem.id}`);
  assert.equal(removed.status, 200);
  assertSuccessEnvelope(removed.body);

  const removedItem = (removed.body.data.items || []).find((i) => i.id === createdItem.id);
  assert.equal(removedItem, undefined);
});

test('write parity: x-guest-session header seeds cookie session identity when cookie missing', async () => {
  const sessionToken = `guest_live_test_${Date.now()}`;
  const res = await request(app)
    .get('/api/cart')
    .set('x-guest-session', sessionToken);

  assert.equal(res.status, 200);
  assertSuccessEnvelope(res.body);
  assert.equal(res.body.data.cart.session_token, sessionToken);
});

test('write parity: build lifecycle upsert/validate/add-to-cart/delete', async (t) => {
  const agent = request.agent(app);

  const create = await agent.post('/api/builds').send({ name: 'Write Parity Build' });
  assert.equal(create.status, 201);
  assertSuccessEnvelope(create.body);

  const buildId = create.body.data.id;
  const componentProductId = await getOneVisibleProductId(agent, t, { type: 'component' });
  if (!componentProductId) return;

  const upsert = await agent.patch(`/api/builds/${buildId}/items`).send({
    component_type: 'cpu',
    product_id: componentProductId
  });

  assert.equal(upsert.status, 200);
  assertSuccessEnvelope(upsert.body);

  const buildItem = (upsert.body.data.items || []).find((i) => i.component_type === 'cpu');
  assert.ok(buildItem?.id);

  const validate = await agent.post(`/api/builds/${buildId}/validate`).send({ auto_replace: true });
  assert.equal(validate.status, 200);
  assertSuccessEnvelope(validate.body);
  assert.equal(typeof validate.body.data.compatibility_status, 'string');
  assert.equal(Array.isArray(validate.body.data.normalized_items), true);

  const addToCart = await agent.post(`/api/builds/${buildId}/add-to-cart`).send({});
  assert.equal(addToCart.status, 200);
  assertSuccessEnvelope(addToCart.body);
  assert.equal(addToCart.body.data.build_id, buildId);

  const remove = await agent.delete(`/api/builds/${buildId}/items/${buildItem.id}`);
  assert.equal(remove.status, 200);
  assertSuccessEnvelope(remove.body);
});

test('write parity: quote creation supports Idempotency-Key header alias', async (t) => {
  const agent = request.agent(app);
  const productId = await getOneVisibleProductId(agent, t);
  if (!productId) return;

  const add = await agent.post('/api/cart/items').send({ item_type: 'product', product_id: productId, quantity: 1 });
  assert.equal(add.status, 201);

  const cart = await agent.get('/api/cart');
  assert.equal(cart.status, 200);

  const key = `idem-header-${Date.now()}`;
  const payload = {
    customer_name: 'Header Idempotency User',
    source_type: 'cart',
    source_id: cart.body.data.cart.id
  };

  const q1 = await agent
    .post('/api/quotes')
    .set('Idempotency-Key', key)
    .send(payload);

  const q2 = await agent
    .post('/api/quotes')
    .set('Idempotency-Key', key)
    .send(payload);

  assert.equal(q1.status, 201);
  assert.equal(q2.status, 201);
  assertSuccessEnvelope(q1.body);
  assertSuccessEnvelope(q2.body);
  assert.equal(q1.body.data.id, q2.body.data.id);
});

test('write parity: quote whatsapp-click tracks status transition', async (t) => {
  const agent = request.agent(app);
  const productId = await getOneVisibleProductId(agent, t);
  if (!productId) return;

  await agent.post('/api/cart/items').send({ item_type: 'product', product_id: productId, quantity: 1 });
  const cart = await agent.get('/api/cart');

  const created = await agent.post('/api/quotes').send({
    customer_name: 'WhatsApp Flow User',
    source_type: 'cart',
    source_id: cart.body.data.cart.id,
    idempotency_key: `wa-click-${Date.now()}`
  });

  assert.equal(created.status, 201);
  assertSuccessEnvelope(created.body);

  const code = created.body.data.quote_code;
  const click = await agent.post(`/api/quotes/${code}/whatsapp-click`).send({});

  assert.equal(click.status, 200);
  assertSuccessEnvelope(click.body);
  assert.equal(click.body.data.status, 'whatsapp_sent');
  assert.equal(typeof click.body.data.whatsapp_clicked_at, 'string');
});

test('write parity: quote creation denies cross-session cart ownership', async (t) => {
  const owner = request.agent(app);
  const attacker = request.agent(app);

  const productId = await getOneVisibleProductId(owner, t);
  if (!productId) return;

  await owner.post('/api/cart/items').send({ item_type: 'product', product_id: productId, quantity: 1 });
  const ownerCart = await owner.get('/api/cart');

  const blocked = await attacker.post('/api/quotes').send({
    customer_name: 'Cross Session User',
    source_type: 'cart',
    source_id: ownerCart.body.data.cart.id,
    idempotency_key: `cross-cart-${Date.now()}`
  });

  assert.equal(blocked.status, 404);
  assertErrorEnvelope(blocked.body);
  assert.equal(blocked.body.error_code, 'cart_not_found');
});

test('write parity: build read denies cross-session ownership', async () => {
  const owner = request.agent(app);
  const attacker = request.agent(app);

  const created = await owner.post('/api/builds').send({ name: 'Owner Build' });
  assert.equal(created.status, 201);

  const blocked = await attacker.get(`/api/builds/${created.body.data.id}`);
  assert.equal(blocked.status, 404);
  assertErrorEnvelope(blocked.body);
  assert.equal(blocked.body.error_code, 'build_not_found');
});

test('write parity: admin product create/update/visibility lifecycle', async () => {
  const token = await adminLoginToken();

  const suffix = Date.now();
  const createPayload = {
    sku: `YS-ADMIN-${suffix}`,
    slug: `ys-admin-${suffix}`,
    title: `YS Admin Product ${suffix}`,
    product_type: 'accessory',
    brand: 'YS',
    model_name: `Admin-${suffix}`,
    condition: 'new',
    stock_status: 'in_stock',
    estimated_price_tzs: 100000,
    short_description: 'Admin create test',
    long_description: 'Admin create test long description',
    warranty_text: 'Test warranty',
    is_visible: true,
    is_featured: false,
    specs: []
  };

  const created = await request(app)
    .post('/api/admin/products')
    .set('Authorization', `Bearer ${token}`)
    .send(createPayload);

  assert.equal(created.status, 201);
  assertSuccessEnvelope(created.body);

  const productId = created.body.data.id;

  const updated = await request(app)
    .patch(`/api/admin/products/${productId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ ...createPayload, estimated_price_tzs: 120000 });

  assert.equal(updated.status, 200);
  assertSuccessEnvelope(updated.body);
  assert.equal(updated.body.data.estimated_price_tzs, 120000);

  const hidden = await request(app)
    .patch(`/api/admin/products/${productId}/visibility`)
    .set('Authorization', `Bearer ${token}`)
    .send({ is_visible: false });

  assert.equal(hidden.status, 200);
  assertSuccessEnvelope(hidden.body);
  assert.equal(hidden.body.data.is_visible, false);
});

test('write parity: media upload-url requires auth and succeeds for admin', async () => {
  const unauth = await request(app)
    .post('/api/media/admin/upload-url')
    .send({
      owner_type: 'shop',
      file_name: 'test-image.png',
      content_type: 'image/png',
      variant: 'original'
    });

  assert.equal(unauth.status, 401);
  assertErrorEnvelope(unauth.body);

  const token = await adminLoginToken();
  const auth = await request(app)
    .post('/api/media/admin/upload-url')
    .set('Authorization', `Bearer ${token}`)
    .send({
      owner_type: 'shop',
      file_name: 'test-image.png',
      content_type: 'image/png',
      variant: 'original'
    });

  assert.equal(auth.status, 200);
  assertSuccessEnvelope(auth.body);
  assert.equal(typeof auth.body.data.path, 'string');
  assert.equal(typeof auth.body.data.signed_url, 'string');
});

test('write parity: customer wishlist endpoints require customer auth', async () => {
  const getRes = await request(app).get('/api/auth/wishlist');
  assert.equal(getRes.status, 401);
  assertErrorEnvelope(getRes.body);

  const postRes = await request(app)
    .post('/api/auth/wishlist/items')
    .send({ product_id: '00000000-0000-0000-0000-000000000000' });

  assert.equal(postRes.status, 401);
  assertErrorEnvelope(postRes.body);
});