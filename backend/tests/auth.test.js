import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { adminLoginToken } from './_helpers.js';

test('admin login failure returns 401', async () => {
  const res = await request(app)
    .post('/api/admin/login')
    .send({ email: 'wrong@example.com', password: 'wrongpass123' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error_code, 'invalid_credentials');
});

test('admin login success returns token', async () => {
  const token = await adminLoginToken();
  assert.ok(token);
});
