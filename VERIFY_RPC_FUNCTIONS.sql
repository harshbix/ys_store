-- VERIFY_RPC_FUNCTIONS.sql
-- Comprehensive check of all 15 required RPC functions
-- Run this in Supabase SQL Editor to verify remote state

-- Part A: Count all required functions
SELECT 
  'TOTAL COUNT' as check_type,
  COUNT(*) as count,
  STRING_AGG(proname, ', ' ORDER BY proname) as details
FROM pg_proc p
WHERE p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND p.proname IN (
    'get_or_create_customer_cart',
    'get_cart_with_items',
    'add_item_to_cart',
    'remove_item_from_cart',
    'update_cart_item_quantity',
    'create_product_with_specs',
    'update_product_with_specs',
    'create_or_get_custom_build',
    'get_custom_build_with_items',
    'upsert_custom_build_item',
    'delete_custom_build_item',
    'validate_custom_build',
    'create_quote_from_cart',
    'track_quote_whatsapp_click',
    'get_quote_with_items'
  );

-- Part B: List each function with status
WITH required_functions AS (
  VALUES
    ('get_or_create_customer_cart'),
    ('get_cart_with_items'),
    ('add_item_to_cart'),
    ('remove_item_from_cart'),
    ('update_cart_item_quantity'),
    ('create_product_with_specs'),
    ('update_product_with_specs'),
    ('create_or_get_custom_build'),
    ('get_custom_build_with_items'),
    ('upsert_custom_build_item'),
    ('delete_custom_build_item'),
    ('validate_custom_build'),
    ('create_quote_from_cart'),
    ('track_quote_whatsapp_click'),
    ('get_quote_with_items')
)
SELECT 
  rf.column1 as function_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      WHERE p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND p.proname = rf.column1
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM required_functions rf
ORDER BY rf.column1;

-- Part C: Check migration history table
SELECT 
  'MIGRATION_HISTORY' as check_type,
  COUNT(*) as total_migrations
FROM schema_migrations;

-- Part D: Show applied migrations
SELECT 
  'APPLIED_MIGRATIONS' as check_type,
  name as migration_name,
  executed_at
FROM schema_migrations
ORDER BY executed_at DESC;

-- Part E: Check if key tables exist
SELECT 
  'TABLE_CHECK' as check_type,
  tablename,
  CASE WHEN to_regclass('public.' || tablename) IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
  VALUES ('carts'), ('cart_items'), ('custom_builds'), ('custom_build_items'), 
         ('quotes'), ('products'), ('product_specs')
) as t(tablename)
ORDER BY tablename;
