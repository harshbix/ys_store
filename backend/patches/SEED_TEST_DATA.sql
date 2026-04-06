-- SEED_TEST_DATA.sql
-- Minimal test data for runtime validation tests
-- 3 products: 1 ready-built PC, 1 CPU component, 1 motherboard component
-- 
-- Copy/paste to Supabase SQL Editor and click Run

-- Product 1: Ready-built PC for general cart tests
INSERT INTO products (
  sku,
  slug,
  title,
  product_type,
  brand,
  model_name,
  condition,
  stock_status,
  is_visible,
  estimated_price_tzs,
  short_description,
  long_description
) VALUES (
  'RUNTIME-PC-001',
  'runtime-test-pc',
  'Runtime Test Ready-Built PC',
  'desktop',
  'TestBrand',
  'TestModel',
  'new',
  'in_stock',
  true,
  1500000,
  'Testing product for cart operations',
  'This product is used for runtime validation of cart create and add operations'
) ON CONFLICT (sku) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  product_type = EXCLUDED.product_type,
  brand = EXCLUDED.brand,
  model_name = EXCLUDED.model_name,
  condition = EXCLUDED.condition,
  stock_status = EXCLUDED.stock_status,
  is_visible = true,
  estimated_price_tzs = EXCLUDED.estimated_price_tzs,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  updated_at = now();

-- Product 2: CPU component for custom build tests
INSERT INTO products (
  sku,
  slug,
  title,
  product_type,
  brand,
  model_name,
  condition,
  stock_status,
  is_visible,
  estimated_price_tzs,
  short_description,
  long_description
) VALUES (
  'RUNTIME-CPU-001',
  'runtime-test-cpu',
  'Runtime Test CPU',
  'component',
  'TestCorp',
  'TestCPU-5000',
  'new',
  'in_stock',
  true,
  800000,
  'Testing CPU for custom builds',
  'This CPU component is used for runtime validation of custom build component addition'
) ON CONFLICT (sku) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  product_type = EXCLUDED.product_type,
  brand = EXCLUDED.brand,
  model_name = EXCLUDED.model_name,
  condition = EXCLUDED.condition,
  stock_status = EXCLUDED.stock_status,
  is_visible = true,
  estimated_price_tzs = EXCLUDED.estimated_price_tzs,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  updated_at = now();

-- Product 3: Motherboard component for component replacement test
INSERT INTO products (
  sku,
  slug,
  title,
  product_type,
  brand,
  model_name,
  condition,
  stock_status,
  is_visible,
  estimated_price_tzs,
  short_description,
  long_description
) VALUES (
  'RUNTIME-MOBO-001',
  'runtime-test-motherboard',
  'Runtime Test Motherboard',
  'component',
  'TestBoard',
  'TestMobo-3000',
  'new',
  'in_stock',
  true,
  600000,
  'Testing motherboard for custom builds',
  'This motherboard component is used for runtime validation of component replacement'
) ON CONFLICT (sku) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  product_type = EXCLUDED.product_type,
  brand = EXCLUDED.brand,
  model_name = EXCLUDED.model_name,
  condition = EXCLUDED.condition,
  stock_status = EXCLUDED.stock_status,
  is_visible = true,
  estimated_price_tzs = EXCLUDED.estimated_price_tzs,
  short_description = EXCLUDED.short_description,
  long_description = EXCLUDED.long_description,
  updated_at = now();

-- Verification: Run separately
-- SELECT COUNT(*) FROM products WHERE sku LIKE 'RUNTIME-%';  -- Should return 3
