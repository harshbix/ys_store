
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kzpknqwlecicildibiqt.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGtucXdsZWNpY2lsZGliaXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEzODM3MywiZXhwIjoyMDkwNzE0MzczfQ.fDjS9VNxkxfQFpnD_rn7wkk1aE038pxIKmsdPvpB3WA');

async function run() {
  console.log('1. Creating test cart...');
  const { data: cart, error: cartErr } = await supabase.from('carts').insert({}).select('*').single();
  if (cartErr) throw cartErr;

  console.log('2. RPC on empty cart...', cart.id);
  const emptyRes = await supabase.rpc('create_quote_from_cart', { p_customer_name: 'Test', p_source_type: 'cart', p_source_id: cart.id });
  console.log(emptyRes.error);

  console.log('3. Inserting item...');
  const { data: prod } = await supabase.from('products').select('id').limit(1).single();
  await supabase.from('cart_items').insert({ cart_id: cart.id, item_type: 'product', product_id: prod?.id, quantity: 1, unit_estimated_price_tzs: 15000, title_snapshot: 'Test'});

  console.log('4. RPC on populated cart...');
  const popRes = await supabase.rpc('create_quote_from_cart', { p_customer_name: 'Test', p_source_type: 'cart', p_source_id: cart.id, p_idempotency_key: cart.id });
  console.log(popRes.error || popRes.data);
}
run();

