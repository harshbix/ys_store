-- TEST_DATA_SEED.sql
-- Purpose: Add minimal test data for frontend RPC runtime tests
-- Includes: 1 regular product (for cart), 1 CPU component (for builds), 1 motherboard (for build replacement tests)
--
-- ACTION: Copy/paste entire file to Supabase SQL Editor and click Run

-- Product 1: Desktop for cart tests
INSERT INTO products (
  sku,
  slug,
  title,
  product_type,
  brand,
  model_name,
  condition,
  stock_status,
  estimated_price_tzs,
  short_description,
  long_description
) VALUES (
  'TST-PROD-001',
  'test-product-001',
  'Test Desktop PC',
  'desktop',
  'TestBrand',
  'Model-A',
  'new',
  'in_stock',
  500000,
  'Test product for cart tests',
  'A test desktop product used in runtime validation tests'
) ON CONFLICT (sku) DO NOTHING;

-- Product 2: CPU component for build tests
INSERT INTO products (
  sku,
  slug,
  title,
  product_type,
  brand,
  model_name,
  condition,
  stock_status,
  estimated_price_tzs,
  short_description,
  long_description
) VALUES (
  'TST-CPU-001',
  'test-cpu-component',
  'Test Intel i7 CPU',
  'component',
  'Intel',
  'Core i7-13700K',
  'new',
  'in_stock',
  350000,
  'Test CPU component for build tests',
  'A test CPU component used in custom build validation'
) ON CONFLICT (sku) DO NOTHING;

-- Product 3: Motherboard component for build replacement tests
INSERT INTO products (
  sku,
  slug,
  title,
  product_type,
  brand,
  model_name,
  condition,
  stock_status,
  estimated_price_tzs,
  short_description,
  long_description
) VALUES (
  'TST-MOBO-001',
  'test-motherboard-component',
  'Test ASUS Motherboard',
  'component',
  'ASUS',
  'ROG STRIX Z790',
  'new',
  'in_stock',
  200000,
  'Test motherboard component for build tests',
  'A test motherboard component used in component replacement validation'
) ON CONFLICT (sku) DO NOTHING;

-- Verification queries (run separately):
-- SELECT COUNT(*) FROM products;  -- Should return >= 3
-- SELECT sku, title FROM products WHERE sku LIKE 'TST-%' ORDER BY sku;  -- Should return test products
