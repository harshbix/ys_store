-- 009_add_phase1_perf_indexes.sql
-- Performance hardening for contract-critical read paths.

create extension if not exists pg_trgm;

-- Newest sorting and visible-first listing support.
create index if not exists idx_products_created_at_desc
  on products (created_at desc);

create index if not exists idx_products_visible_created_at_desc
  on products (is_visible, created_at desc);

-- Brand contains-search optimization for ilike filters.
create index if not exists idx_products_brand_trgm
  on products using gin (brand gin_trgm_ops);

-- Targeted spec text search acceleration for cpu/gpu contains filters.
create index if not exists idx_product_specs_cpu_model_trgm
  on product_specs using gin (value_text gin_trgm_ops)
  where spec_key = 'cpu_model' and value_text is not null;

create index if not exists idx_product_specs_gpu_model_trgm
  on product_specs using gin (value_text gin_trgm_ops)
  where spec_key = 'gpu_model' and value_text is not null;