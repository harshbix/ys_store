-- 007_create_quote_transactional_rpc.sql
-- Atomic quote creation for idempotent quote workflow.

create or replace function create_quote_transactional(p_quote jsonb, p_items jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_quote_id uuid;
  v_item jsonb;
  v_qty integer;
  v_unit bigint;
  v_line bigint;
  v_total bigint := 0;
  v_quote_row quotes%rowtype;
begin
  if p_quote is null then
    raise exception 'p_quote is required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'p_items must be a non-empty array';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(coalesce((v_item->>'quantity')::integer, 0), 0);
    v_unit := greatest(coalesce((v_item->>'unit_estimated_price_tzs')::bigint, 0), 0);
    v_line := v_qty * v_unit;
    v_total := v_total + v_line;
  end loop;

  insert into quotes (
    quote_code,
    quote_type,
    status,
    customer_name,
    notes,
    estimated_total_tzs,
    source_cart_id,
    source_build_id,
    idempotency_key,
    replacement_summary,
    whatsapp_message
  )
  values (
    p_quote->>'quote_code',
    (p_quote->>'quote_type')::quote_type,
    coalesce((p_quote->>'status')::quote_status, 'new'::quote_status),
    p_quote->>'customer_name',
    nullif(p_quote->>'notes', ''),
    v_total,
    nullif(p_quote->>'source_cart_id', '')::uuid,
    nullif(p_quote->>'source_build_id', '')::uuid,
    p_quote->>'idempotency_key',
    p_quote->'replacement_summary',
    p_quote->>'whatsapp_message'
  )
  returning id into v_quote_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(coalesce((v_item->>'quantity')::integer, 0), 0);
    v_unit := greatest(coalesce((v_item->>'unit_estimated_price_tzs')::bigint, 0), 0);
    v_line := v_qty * v_unit;

    insert into quote_items (
      quote_id,
      item_type,
      ref_product_id,
      ref_custom_build_id,
      title_snapshot,
      specs_snapshot,
      quantity,
      unit_estimated_price_tzs,
      line_total_tzs
    )
    values (
      v_quote_id,
      (v_item->>'item_type')::cart_item_type,
      nullif(v_item->>'ref_product_id', '')::uuid,
      nullif(v_item->>'ref_custom_build_id', '')::uuid,
      coalesce(v_item->>'title_snapshot', 'Untitled'),
      v_item->'specs_snapshot',
      greatest(v_qty, 1),
      v_unit,
      greatest(v_line, v_unit)
    );
  end loop;

  select * into v_quote_row from quotes where id = v_quote_id;
  return to_jsonb(v_quote_row);
exception
  when unique_violation then
    if position('quotes_idempotency_key_key' in sqlerrm) > 0 then
      select * into v_quote_row from quotes where idempotency_key = p_quote->>'idempotency_key';
      return to_jsonb(v_quote_row);
    end if;
    raise;
end;
$$;
