-- 004_create_support_tables.sql

create table if not exists spec_definitions (
  spec_key text primary key,
  label text not null,
  data_type text not null check (data_type in ('text', 'number', 'boolean', 'json')),
  allowed_values jsonb,
  is_filterable boolean not null default false,
  is_comparable boolean not null default false,
  applies_to_product_type product_type[] not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_specs (
  id bigserial primary key,
  product_id uuid not null references products(id) on delete cascade,
  spec_key text not null references spec_definitions(spec_key),
  value_text text,
  value_number numeric(12,2),
  value_bool boolean,
  value_json jsonb,
  unit text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_specs_one_value_check check (
    ((value_text is not null)::int + (value_number is not null)::int + (value_bool is not null)::int + (value_json is not null)::int) = 1
  ),
  constraint product_specs_unique_per_product_key unique (product_id, spec_key)
);

create table if not exists custom_build_items (
  id uuid primary key default gen_random_uuid(),
  custom_build_id uuid not null references custom_builds(id) on delete cascade,
  component_type component_type not null,
  product_id uuid not null references products(id),
  quantity integer not null default 1 check (quantity > 0),
  unit_estimated_price_tzs bigint not null check (unit_estimated_price_tzs >= 0),
  is_auto_replaced boolean not null default false,
  compatibility_notes jsonb,
  created_at timestamptz not null default now()
);

create table if not exists compatibility_rules (
  id uuid primary key default gen_random_uuid(),
  rule_type text not null,
  source_component_type component_type not null,
  source_value_key text not null,
  operator text not null,
  target_component_type component_type not null,
  target_value_key text not null,
  severity compatibility_status not null,
  message_template text not null,
  auto_replace_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  original_url text not null,
  thumb_url text not null,
  full_url text not null,
  width integer,
  height integer,
  size_bytes integer,
  alt_text text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists shop_media (
  id uuid primary key default gen_random_uuid(),
  original_url text not null,
  thumb_url text not null,
  full_url text not null,
  width integer,
  height integer,
  size_bytes integer,
  caption text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  customer_auth_id uuid not null,
  created_at timestamptz not null default now(),
  unique (customer_auth_id)
);

create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);
