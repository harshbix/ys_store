import jwt from 'jsonwebtoken';
import { fail } from '../utils/apiResponse.js';
import { env } from '../config/env.js';
import { supabase } from '../lib/supabase.js';

export async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return fail(res, 401, 'unauthorized', 'Missing admin token');
  }

  try {
    // 1. Verify the backend JWT
    const decoded = jwt.verify(token, env.adminJwtSecret);
    
    if (!decoded.sub || !decoded.email) {
      console.warn('[Admin Auth] JWT decoded but missing required fields');
      return fail(res, 401, 'unauthorized', 'Invalid admin token payload');
    }

    const adminId = decoded.sub;
    const email = decoded.email.toLowerCase();
    console.log('[Admin Auth] JWT verified for email:', email);
    
    // 2. Fetch the admin record from database to verify it still exists and is active
    const { data: adminUser, error: roleError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active')
      .eq('id', adminId)
      .eq('email', email)
      .single();

    if (roleError || !adminUser) {
      console.warn(`[Admin Auth] Failed to find admin record for id ${adminId} email ${email}:`, roleError?.message || 'No record');
      return fail(res, 403, 'forbidden', 'Admin record not found');
    }

    if (!adminUser.is_active) {
      console.warn(`[Admin Auth] Admin account is inactive: ${email}`);
      return fail(res, 403, 'forbidden', 'Admin account is inactive');
    }

    if (adminUser.role !== 'owner' && adminUser.role !== 'admin') {
      console.warn(`[Admin Auth] Insufficient privileges for ${email}: ${adminUser.role}`);
      return fail(res, 403, 'forbidden', 'Insufficient admin privileges');
    }

    // 3. Attach the verified, trusted admin info
    req.admin = {
      id: adminUser.id,
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      full_name: adminUser.full_name,
      is_active: adminUser.is_active
    };
    
    return next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      console.warn('[Admin Auth] JWT verification failed:', err.message);
      return fail(res, 401, 'unauthorized', 'Invalid or expired admin token');
    }
    console.error('[Admin Auth] Verification error:', err);
    return fail(res, 500, 'server_error', 'Internal server error verifying admin identity');
  }
}
