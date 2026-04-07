import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kzpknqwlecicildibiqt.supabase.co',
  'sb_publishable_jjSK989vHsPoz60QpFTUTA_KE8wa67h'
);

async function run() {
  const rpcPayload = {
    p_customer_name: "Test User",
    p_notes: "Test",
    p_source_type: "cart",
    p_source_id: "e501d51a-7b3d-4cba-a44e-1b802e3b2bfa",
    p_idempotency_key: "abc-def-123"
  };
  
  console.log("Calling RPC with payload:", rpcPayload);
  const result = await supabase.rpc('create_quote_from_cart', rpcPayload);
  console.log("Result:", JSON.stringify(result, null, 2));
}

run().catch(console.error);
