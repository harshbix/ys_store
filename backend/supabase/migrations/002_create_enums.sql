-- 002_create_enums.sql

create type product_type as enum ('desktop', 'laptop', 'accessory', 'component');
create type product_condition as enum ('new', 'imported_used', 'refurbished', 'custom_build');
create type stock_status as enum ('in_stock', 'low_stock', 'build_on_request', 'incoming_stock', 'sold_out');
create type cart_status as enum ('active', 'converted_to_quote', 'expired');
create type cart_item_type as enum ('product', 'custom_build');
create type build_owner_type as enum ('guest', 'customer');
create type build_status as enum ('draft', 'valid', 'quoted', 'archived');
create type compatibility_status as enum ('valid', 'warning', 'invalid');
create type component_type as enum (
  'cpu',
  'motherboard',
  'gpu',
  'ram',
  'storage',
  'psu',
  'case',
  'cooler',
  'monitor',
  'keyboard_mouse',
  'windows_license'
);
create type quote_type as enum ('laptop', 'desktop', 'build', 'upgrade', 'warranty', 'general');
create type quote_status as enum ('new', 'whatsapp_sent', 'negotiating', 'confirmed', 'closed_won', 'closed_lost');
create type admin_role as enum ('owner');
create type analytics_event_name as enum (
  'product_view',
  'add_to_cart',
  'build_created',
  'quote_created',
  'whatsapp_click',
  'whatsapp_click_initiated'
);
