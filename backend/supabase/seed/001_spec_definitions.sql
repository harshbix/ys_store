-- 001_spec_definitions.sql
-- Minimal spec definitions for MVP filters/comparison.

insert into spec_definitions (spec_key, label, data_type, is_filterable, is_comparable, applies_to_product_type, sort_order)
values
  ('cpu_model', 'CPU', 'text', true, true, array['desktop','laptop','component']::product_type[], 10),
  ('cpu_socket', 'CPU Socket', 'text', false, true, array['desktop','component']::product_type[], 11),
  ('gpu_model', 'GPU', 'text', true, true, array['desktop','laptop','component']::product_type[], 20),
  ('ram_gb', 'RAM (GB)', 'number', true, true, array['desktop','laptop','component']::product_type[], 30),
  ('ram_type', 'RAM Type', 'text', true, true, array['desktop','laptop','component']::product_type[], 31),
  ('storage_gb', 'Storage (GB)', 'number', true, true, array['desktop','laptop','component']::product_type[], 40),
  ('storage_type', 'Storage Type', 'text', true, true, array['desktop','laptop','component']::product_type[], 41),
  ('screen_size_in', 'Screen Size (in)', 'number', true, true, array['laptop']::product_type[], 50),
  ('refresh_rate_hz', 'Refresh Rate (Hz)', 'number', true, true, array['laptop']::product_type[], 51),
  ('motherboard_socket', 'Motherboard Socket', 'text', false, true, array['desktop','component']::product_type[], 60),
  ('motherboard_ram_type', 'Motherboard RAM Type', 'text', false, true, array['desktop','component']::product_type[], 61),
  ('motherboard_max_ram_gb', 'Motherboard Max RAM (GB)', 'number', false, true, array['desktop','component']::product_type[], 62),
  ('gpu_length_mm', 'GPU Length (mm)', 'number', false, true, array['component']::product_type[], 70),
  ('case_max_gpu_length_mm', 'Case Max GPU Length (mm)', 'number', false, true, array['desktop','component']::product_type[], 71),
  ('psu_wattage', 'PSU Wattage', 'number', false, true, array['component']::product_type[], 80),
  ('estimated_system_wattage', 'Estimated System Wattage', 'number', false, true, array['desktop','component']::product_type[], 81)
on conflict (spec_key) do nothing;
