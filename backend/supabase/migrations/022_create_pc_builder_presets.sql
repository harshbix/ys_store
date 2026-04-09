-- 022_create_pc_builder_presets.sql
-- Creates tables for PC builder presets and components (pre-built recommendations)

create table if not exists pc_components (
  id text primary key,
  type text not null,
  name text not null,
  price_tzs bigint not null default 0 check (price_tzs >= 0),
  
  -- Compatibility fields (used by validation engine)
  cpu_socket text,
  motherboard_socket text,
  motherboard_ram_type text,
  ram_type text,
  gpu_length_mm numeric,
  case_max_gpu_length_mm numeric,
  psu_wattage numeric,
  estimated_wattage numeric,
  
  -- Component-specific fields
  storage_capacity_gb numeric,
  storage_type text,
  ram_capacity_gb numeric,
  vram_gb numeric,
  cooler_type text,
  cores integer,
  threads integer,
  
  is_visible boolean not null default true,
  stock_status text not null default 'in_stock',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pc_build_presets (
  id text primary key,
  name text not null,
  cpu_family text not null,
  build_number integer,
  subtotal_tzs bigint not null default 0 check (subtotal_tzs >= 0),
  discount_percent numeric default 0,
  total_tzs bigint not null default 0 check (total_tzs >= 0),
  status text not null default 'draft',
  estimated_system_wattage numeric,
  required_psu_wattage numeric,
  compatibility_status text default 'unknown',
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pc_build_preset_items (
  id bigserial primary key,
  preset_id text not null references pc_build_presets(id) on delete cascade,
  slot_order integer not null,
  component_type text not null,
  component_id text not null references pc_components(id),
  quantity integer not null default 1 check (quantity > 0),
  unit_price_tzs bigint not null default 0 check (unit_price_tzs >= 0),
  line_total_tzs bigint not null default 0,
  is_auto_replaced boolean not null default false,
  compatibility_notes jsonb,
  created_at timestamptz not null default now(),
  constraint pc_preset_items_unique_component_per_preset unique (preset_id, slot_order)
);

-- Indexes for performance
create index if not exists idx_pc_components_type on pc_components(type);
create index if not exists idx_pc_components_cpu_socket on pc_components(cpu_socket) where cpu_socket is not null;
create index if not exists idx_pc_components_mb_socket on pc_components(motherboard_socket) where motherboard_socket is not null;
create index if not exists idx_pc_components_ram_type on pc_components(ram_type) where ram_type is not null;
create index if not exists idx_pc_components_psu_wattage on pc_components(psu_wattage) where psu_wattage is not null;

create index if not exists idx_pc_presets_family on pc_build_presets(cpu_family);
create index if not exists idx_pc_presets_status on pc_build_presets(status);
create index if not exists idx_pc_presets_visible on pc_build_presets(is_visible);

create index if not exists idx_pc_preset_items_preset_id on pc_build_preset_items(preset_id);
create index if not exists idx_pc_preset_items_component_id on pc_build_preset_items(component_id);

-- Enable RLS policies (read-only public access)
alter table if exists pc_components enable row level security;
alter table if exists pc_build_presets enable row level security;
alter table if exists pc_build_preset_items enable row level security;

create policy pc_components_public_read on pc_components 
  for select 
  using (is_visible = true);

create policy pc_presets_public_read on pc_build_presets 
  for select 
  using (is_visible = true);

create policy pc_preset_items_public_read on pc_build_preset_items 
  for select 
  using (true);
