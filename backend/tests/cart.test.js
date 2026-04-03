import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('cart rejects invalid product add payload', async () => {
  const res = await request(app)
    .post('/api/cart/items')
    .send({ item_type: 'product', quantity: 1 });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error_code, 'validation_error');
});
