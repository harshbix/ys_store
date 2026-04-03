import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import request from 'supertest';
import app from '../src/app.js';
import { createClient } from '@supabase/supabase-js';

export function loadEnv() {
  const raw = fs.readFileSync('.env', 'utf8');
  return dotenv.parse(raw);
}

export function createAdminClient() {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function ensureAdminBootstrap() {
  const env = loadEnv();
  const client = createAdminClient();
  const email = (env.ADMIN_EMAIL || '').trim();
  if (!email) throw new Error('ADMIN_EMAIL missing in .env');

  const existing = await client.from('admin_users').select('id').eq('email', email).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (!existing.data) {
    const inserted = await client.from('admin_users').insert({
      id: crypto.randomUUID(),
      email,
      full_name: 'Owner',
      role: 'owner',
      is_active: true
    });
    if (inserted.error) throw new Error(inserted.error.message);
  }

  return { email, password: (env.ADMIN_PASSWORD || '').trim() };
}

export async function adminLoginToken() {
  const creds = await ensureAdminBootstrap();
  const res = await request(app)
    .post('/api/admin/login')
    .send({ email: creds.email, password: creds.password });

  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error('admin login failed in tests');
  }

  return res.body.data.token;
}
