import { fail } from '../utils/apiResponse.js';
import { supabase } from '../lib/supabase.js';

export async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return fail(res, 401, 'unauthorized', 'Missing admin token');
  }

  try {
    // 1. Validate the Supabase token server-side
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user || !user.email) {
      return fail(res, 401, 'unauthorized', 'Invalid or expired admin token');
    }

    // 2. Fetch the admin record using the service role to ensure bypass doesn't obscure failure
    const email = user.email.toLowerCase();
    
    const { data: adminUser, error: roleError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active')
      .eq('email', user.email)
      .single();

    if (roleError || !adminUser) {
      return fail(res, 403, 'forbidden', 'Admin record not found');
    }

    if (!adminUser.is_active) {
      return fail(res, 403, 'forbidden', 'Admin account is inactive');
    }

    if (adminUser.role !== 'owner' && adminUser.role !== 'admin') {
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
    console.error('[Admin Auth] Verification error:', err);
    return fail(res, 500, 'server_error', 'Internal server error verifying admin identity');
  }
}
