-- 006_enable_rls_base.sql
-- MVP keeps API access through backend service role. This file enables RLS
-- for future direct Supabase client usage while allowing backend operations.

alter table if exists products enable row level security;
alter table if exists product_specs enable row level security;
alter table if exists product_media enable row level security;
alter table if exists shop_media enable row level security;
alter table if exists carts enable row level security;
alter table if exists cart_items enable row level security;
alter table if exists custom_builds enable row level security;
alter table if exists custom_build_items enable row level security;
alter table if exists quotes enable row level security;
alter table if exists quote_items enable row level security;
alter table if exists wishlists enable row level security;
alter table if exists wishlist_items enable row level security;
alter table if exists analytics_events enable row level security;

-- Policies intentionally deferred to backend-controlled access in MVP.
