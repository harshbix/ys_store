-- 003_create_core_tables.sql

create table if not exists admin_users (
  id uuid primary key,
  email text not null unique,
  full_name text not null,
  role admin_role not null default 'owner',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  slug text not null unique,
  title text not null,
  product_type product_type not null,
  brand text not null,
  model_name text not null,
  condition product_condition not null,
  stock_status stock_status not null default 'in_stock',
  estimated_price_tzs bigint not null check (estimated_price_tzs >= 0),
  short_description text,
  long_description text,
  warranty_text text,
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  featured_tag text,
  created_by_admin_id uuid references admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  session_token text unique,
  customer_auth_id uuid,
  status cart_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists custom_builds (
  id uuid primary key default gen_random_uuid(),
  build_code text not null unique,
  owner_type build_owner_type not null,
  customer_auth_id uuid,
  session_token text,
  name text,
  build_status build_status not null default 'draft',
  compatibility_status compatibility_status not null default 'warning',
  replacement_summary jsonb,
  total_estimated_price_tzs bigint not null default 0 check (total_estimated_price_tzs >= 0),
  is_saved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  item_type cart_item_type not null,
  product_id uuid references products(id),
  custom_build_id uuid references custom_builds(id),
  quantity integer not null check (quantity > 0),
  unit_estimated_price_tzs bigint not null check (unit_estimated_price_tzs >= 0),
  title_snapshot text not null,
  specs_snapshot jsonb,
  created_at timestamptz not null default now(),
  constraint cart_items_item_ref_check check (
    (product_id is not null and custom_build_id is null)
    or
    (product_id is null and custom_build_id is not null)
  )
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  quote_code text not null unique,
  quote_type quote_type not null,
  status quote_status not null default 'new',
  customer_name text not null,
  notes text,
  estimated_total_tzs bigint not null check (estimated_total_tzs >= 0),
  source_cart_id uuid references carts(id),
  source_build_id uuid references custom_builds(id),
  idempotency_key text not null unique,
  replacement_summary jsonb,
  whatsapp_message text not null,
  whatsapp_clicked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_reason text
);

create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  item_type cart_item_type not null,
  ref_product_id uuid references products(id),
  ref_custom_build_id uuid references custom_builds(id),
  title_snapshot text not null,
  specs_snapshot jsonb,
  quantity integer not null check (quantity > 0),
  unit_estimated_price_tzs bigint not null check (unit_estimated_price_tzs >= 0),
  line_total_tzs bigint not null check (line_total_tzs >= 0),
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id bigserial primary key,
  event_name analytics_event_name not null,
  session_token text,
  customer_auth_id uuid,
  product_id uuid references products(id),
  custom_build_id uuid references custom_builds(id),
  quote_id uuid references quotes(id),
  page_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
