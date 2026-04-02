import { supabase } from '../../lib/supabase.js';

export async function insertAnalyticsEvent(payload) {
  return supabase.from('analytics_events').insert(payload);
}
