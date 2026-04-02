-- 005_create_indexes.sql

create index if not exists idx_products_type_stock_visible on products(product_type, stock_status, is_visible);
create index if not exists idx_products_price on products(estimated_price_tzs);
create index if not exists idx_products_condition on products(condition);

create index if not exists idx_product_specs_product_id on product_specs(product_id);
create index if not exists idx_product_specs_key_text on product_specs(spec_key, value_text);
create index if not exists idx_product_specs_key_number on product_specs(spec_key, value_number);

create index if not exists idx_carts_customer on carts(customer_auth_id);
create index if not exists idx_carts_status_updated on carts(status, updated_at desc);

create index if not exists idx_cart_items_cart on cart_items(cart_id);
create index if not exists idx_cart_items_product on cart_items(product_id);
create index if not exists idx_cart_items_build on cart_items(custom_build_id);

create index if not exists idx_builds_customer on custom_builds(customer_auth_id);
create index if not exists idx_builds_session on custom_builds(session_token);
create index if not exists idx_builds_status on custom_builds(build_status, compatibility_status);

create index if not exists idx_build_items_build on custom_build_items(custom_build_id);
create index if not exists idx_build_items_component on custom_build_items(component_type);

create unique index if not exists uq_build_component_single_slot on custom_build_items(custom_build_id, component_type)
where component_type in ('cpu', 'motherboard', 'gpu', 'psu', 'case', 'cooler', 'windows_license');

create index if not exists idx_quotes_status_created on quotes(status, created_at desc);
create index if not exists idx_quotes_type on quotes(quote_type);
create index if not exists idx_quotes_source_cart on quotes(source_cart_id);
create unique index if not exists uq_quotes_idempotency_key on quotes(idempotency_key);

create index if not exists idx_quote_items_quote on quote_items(quote_id);
create index if not exists idx_quote_items_product on quote_items(ref_product_id);

create index if not exists idx_analytics_event_created on analytics_events(event_name, created_at desc);
create index if not exists idx_analytics_session on analytics_events(session_token);
create index if not exists idx_analytics_quote on analytics_events(quote_id);
