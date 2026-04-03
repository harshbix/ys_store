-- 003_demo_products.sql
-- Demo catalog for local/staging testing of cart and wishlist flows.

insert into products (
  id,
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
  long_description,
  warranty_text,
  is_visible,
  is_featured,
  featured_tag,
  created_by_admin_id
)
values
  (
    '10000000-0000-4000-8000-000000000001'::uuid,
    'YS-DESK-4070-001',
    'ys-gaming-desktop-rtx4070',
    'YS Gaming Desktop RTX 4070',
    'desktop',
    'YS Custom',
    'Titan 4070',
    'new',
    'in_stock',
    3450000,
    'High-performance desktop for gaming and content workloads.',
    'Custom tuned desktop build with modern airflow and stable thermals.',
    '12 months warranty',
    true,
    true,
    'recommended',
    null
  ),
  (
    '10000000-0000-4000-8000-000000000002'::uuid,
    'YS-LAP-4060-001',
    'ys-gaming-laptop-4060',
    'YS Gaming Laptop RTX 4060',
    'laptop',
    'Aorus',
    'A16 4060',
    'new',
    'in_stock',
    2890000,
    'Portable high-refresh gaming laptop with modern GPU acceleration.',
    'Balanced laptop for gaming, streaming, and creative editing.',
    '12 months warranty',
    true,
    true,
    'best_seller',
    null
  ),
  (
    '10000000-0000-4000-8000-000000000003'::uuid,
    'YS-COMP-GPU-001',
    'nvidia-rtx-4070-super',
    'NVIDIA RTX 4070 Super',
    'component',
    'NVIDIA',
    'RTX 4070 Super',
    'new',
    'low_stock',
    1850000,
    'Powerful GPU for high fps gaming and creator pipelines.',
    'Efficient next-gen graphics card for premium 1440p performance.',
    '12 months warranty',
    true,
    true,
    'hot_deal',
    null
  ),
  (
    '10000000-0000-4000-8000-000000000004'::uuid,
    'YS-ACC-MON-001',
    'ys-27in-165hz-monitor',
    'YS 27 inch 165Hz Monitor',
    'accessory',
    'YS Select',
    'Vision 27 165',
    'new',
    'in_stock',
    520000,
    'Fast refresh QHD monitor with accurate color profile.',
    'Premium monitor tuned for both gaming and daily productivity.',
    '6 months warranty',
    true,
    false,
    null,
    null
  ),
  (
    '10000000-0000-4000-8000-000000000005'::uuid,
    'YS-LAP-3050-002',
    'lenovo-legion-5-rtx3050',
    'Lenovo Legion 5 RTX 3050',
    'laptop',
    'Lenovo',
    'Legion 5 15ACH6',
    'imported_used',
    'incoming_stock',
    2150000,
    'Reliable mid-range gaming laptop with strong cooling.',
    'Great option for 1080p esports and creator workloads on a budget.',
    '3 months service warranty',
    true,
    false,
    null,
    null
  ),
  (
    '10000000-0000-4000-8000-000000000006'::uuid,
    'YS-COMP-RAM-001',
    'corsair-vengeance-32gb-ddr5',
    'Corsair Vengeance 32GB DDR5 Kit',
    'component',
    'Corsair',
    'Vengeance DDR5 2x16',
    'new',
    'in_stock',
    385000,
    'Low-latency DDR5 memory kit for modern systems.',
    'Stable profile memory tuned for creators and gamers.',
    '12 months warranty',
    true,
    false,
    null,
    null
  ),
  (
    '10000000-0000-4000-8000-000000000007'::uuid,
    'YS-DESK-I5-001',
    'office-desktop-core-i5-13th-gen',
    'Office Desktop Core i5 13th Gen',
    'desktop',
    'YS Business',
    'OfficePro 13',
    'new',
    'build_on_request',
    1450000,
    'Business desktop optimized for daily office operations.',
    'Quiet, power-efficient desktop designed for productivity and uptime.',
    '12 months warranty',
    true,
    false,
    null,
    null
  ),
  (
    '10000000-0000-4000-8000-000000000008'::uuid,
    'YS-ACC-KM-001',
    'mechanical-keyboard-mouse-bundle',
    'Mechanical Keyboard + Mouse Bundle',
    'accessory',
    'YS Select',
    'Pro Input Combo',
    'new',
    'sold_out',
    180000,
    'Compact mechanical keyboard and precision gaming mouse combo.',
    'Affordable starter bundle with tactile switches and adjustable DPI.',
    '1 month replacement warranty',
    true,
    false,
    null,
    null
  )
on conflict (id) do update
set
  sku = excluded.sku,
  slug = excluded.slug,
  title = excluded.title,
  product_type = excluded.product_type,
  brand = excluded.brand,
  model_name = excluded.model_name,
  condition = excluded.condition,
  stock_status = excluded.stock_status,
  estimated_price_tzs = excluded.estimated_price_tzs,
  short_description = excluded.short_description,
  long_description = excluded.long_description,
  warranty_text = excluded.warranty_text,
  is_visible = excluded.is_visible,
  is_featured = excluded.is_featured,
  featured_tag = excluded.featured_tag,
  updated_at = now();

delete from product_specs
where product_id in (
  '10000000-0000-4000-8000-000000000001'::uuid,
  '10000000-0000-4000-8000-000000000002'::uuid,
  '10000000-0000-4000-8000-000000000003'::uuid,
  '10000000-0000-4000-8000-000000000004'::uuid,
  '10000000-0000-4000-8000-000000000005'::uuid,
  '10000000-0000-4000-8000-000000000006'::uuid,
  '10000000-0000-4000-8000-000000000007'::uuid,
  '10000000-0000-4000-8000-000000000008'::uuid
);

insert into product_specs (
  product_id,
  spec_key,
  value_text,
  value_number,
  value_bool,
  value_json,
  unit,
  sort_order
)
values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'cpu_model', 'Intel Core i7-13700F', null, null, null, null, 10),
  ('10000000-0000-4000-8000-000000000001'::uuid, 'gpu_model', 'RTX 4070', null, null, null, null, 20),
  ('10000000-0000-4000-8000-000000000001'::uuid, 'ram_gb', null, 32, null, null, 'GB', 30),
  ('10000000-0000-4000-8000-000000000001'::uuid, 'storage_gb', null, 1000, null, null, 'GB', 40),

  ('10000000-0000-4000-8000-000000000002'::uuid, 'cpu_model', 'Intel Core i7-13620H', null, null, null, null, 10),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'gpu_model', 'RTX 4060 Laptop', null, null, null, null, 20),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'screen_size_in', null, 16, null, null, 'in', 30),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'refresh_rate_hz', null, 165, null, null, 'Hz', 40),

  ('10000000-0000-4000-8000-000000000003'::uuid, 'gpu_model', 'RTX 4070 Super', null, null, null, null, 10),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'gpu_length_mm', null, 305, null, null, 'mm', 20),

  ('10000000-0000-4000-8000-000000000004'::uuid, 'refresh_rate_hz', null, 165, null, null, 'Hz', 10),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'screen_size_in', null, 27, null, null, 'in', 20),

  ('10000000-0000-4000-8000-000000000005'::uuid, 'cpu_model', 'AMD Ryzen 5 5600H', null, null, null, null, 10),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'gpu_model', 'RTX 3050 Laptop', null, null, null, null, 20),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'screen_size_in', null, 15.6, null, null, 'in', 30),

  ('10000000-0000-4000-8000-000000000006'::uuid, 'ram_gb', null, 32, null, null, 'GB', 10),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'ram_type', 'DDR5', null, null, null, null, 20),

  ('10000000-0000-4000-8000-000000000007'::uuid, 'cpu_model', 'Intel Core i5-13400', null, null, null, null, 10),
  ('10000000-0000-4000-8000-000000000007'::uuid, 'ram_gb', null, 16, null, null, 'GB', 20),
  ('10000000-0000-4000-8000-000000000007'::uuid, 'storage_gb', null, 512, null, null, 'GB', 30),

  ('10000000-0000-4000-8000-000000000008'::uuid, 'refresh_rate_hz', null, 1000, null, null, 'Hz', 10)
on conflict (product_id, spec_key) do update
set
  value_text = excluded.value_text,
  value_number = excluded.value_number,
  value_bool = excluded.value_bool,
  value_json = excluded.value_json,
  unit = excluded.unit,
  sort_order = excluded.sort_order;

delete from product_media
where product_id in (
  '10000000-0000-4000-8000-000000000001'::uuid,
  '10000000-0000-4000-8000-000000000002'::uuid,
  '10000000-0000-4000-8000-000000000003'::uuid,
  '10000000-0000-4000-8000-000000000004'::uuid,
  '10000000-0000-4000-8000-000000000005'::uuid,
  '10000000-0000-4000-8000-000000000006'::uuid,
  '10000000-0000-4000-8000-000000000007'::uuid,
  '10000000-0000-4000-8000-000000000008'::uuid
);

insert into product_media (
  product_id,
  original_url,
  thumb_url,
  full_url,
  width,
  height,
  size_bytes,
  alt_text,
  is_primary,
  sort_order
)
values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'https://picsum.photos/seed/ys-4070-a/1200/900', 'https://picsum.photos/seed/ys-4070-a/640/480', 'https://picsum.photos/seed/ys-4070-a/1600/1200', 1200, 900, null, 'YS Gaming Desktop RTX 4070', true, 0),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'https://picsum.photos/seed/ys-4060-l/1200/900', 'https://picsum.photos/seed/ys-4060-l/640/480', 'https://picsum.photos/seed/ys-4060-l/1600/1200', 1200, 900, null, 'YS Gaming Laptop RTX 4060', true, 0),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'https://picsum.photos/seed/ys-4070-g/1200/900', 'https://picsum.photos/seed/ys-4070-g/640/480', 'https://picsum.photos/seed/ys-4070-g/1600/1200', 1200, 900, null, 'NVIDIA RTX 4070 Super', true, 0),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'https://picsum.photos/seed/ys-monitor/1200/900', 'https://picsum.photos/seed/ys-monitor/640/480', 'https://picsum.photos/seed/ys-monitor/1600/1200', 1200, 900, null, 'YS 27 inch 165Hz Monitor', true, 0),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'https://picsum.photos/seed/ys-legion/1200/900', 'https://picsum.photos/seed/ys-legion/640/480', 'https://picsum.photos/seed/ys-legion/1600/1200', 1200, 900, null, 'Lenovo Legion 5 RTX 3050', true, 0),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'https://picsum.photos/seed/ys-ram/1200/900', 'https://picsum.photos/seed/ys-ram/640/480', 'https://picsum.photos/seed/ys-ram/1600/1200', 1200, 900, null, 'Corsair Vengeance 32GB DDR5 Kit', true, 0),
  ('10000000-0000-4000-8000-000000000007'::uuid, 'https://picsum.photos/seed/ys-office/1200/900', 'https://picsum.photos/seed/ys-office/640/480', 'https://picsum.photos/seed/ys-office/1600/1200', 1200, 900, null, 'Office Desktop Core i5 13th Gen', true, 0),
  ('10000000-0000-4000-8000-000000000008'::uuid, 'https://picsum.photos/seed/ys-km/1200/900', 'https://picsum.photos/seed/ys-km/640/480', 'https://picsum.photos/seed/ys-km/1600/1200', 1200, 900, null, 'Mechanical Keyboard + Mouse Bundle', true, 0);
