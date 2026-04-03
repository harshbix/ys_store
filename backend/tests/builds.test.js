import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/app.js';

test('build item upsert returns 404 when build does not exist', async () => {
  const missingBuildId = crypto.randomUUID();

  const res = await request(app)
    .patch(`/api/builds/${missingBuildId}/items`)
    .send({
      component_type: 'cpu',
      product_id: crypto.randomUUID()
    });

  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error_code, 'build_not_found');
});
