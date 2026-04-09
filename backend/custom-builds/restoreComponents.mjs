import fs from 'fs';

console.log('🔧 Restoring removed duplicate components...\n');

// Restore the components from the original XLSX extraction
const restoredComponents = [
  {
    "id": "cas_002",
    "type": "case",
    "name": "atx black/white chassis",
    "price_tzs": 350000,
    "cpu_socket": null,
    "motherboard_socket": null,
    "motherboard_ram_type": null,
    "ram_type": null,
    "gpu_length_mm": null,
    "case_max_gpu_length_mm": 330,
    "psu_wattage": null,
    "estimated_wattage": 5,
    "storage_capacity_gb": null,
    "storage_type": null,
    "ram_capacity_gb": null,
    "vram_gb": null,
    "cooler_type": null,
    "cores": null,
    "threads": null
  },
  {
    "id": "cas_003",
    "type": "case",
    "name": "atx black/white chassis",
    "price_tzs": 400000,
    "cpu_socket": null,
    "motherboard_socket": null,
    "motherboard_ram_type": null,
    "ram_type": null,
    "gpu_length_mm": null,
    "case_max_gpu_length_mm": 340,
    "psu_wattage": null,
    "estimated_wattage": 5,
    "storage_capacity_gb": null,
    "storage_type": null,
    "ram_capacity_gb": null,
    "vram_gb": null,
    "cooler_type": null,
    "cores": null,
    "threads": null
  },
  {
    "id": "coo_002",
    "type": "cooler",
    "name": "air cooler with temp display",
    "price_tzs": 100000,
    "cpu_socket": null,
    "motherboard_socket": null,
    "motherboard_ram_type": null,
    "ram_type": null,
    "gpu_length_mm": null,
    "case_max_gpu_length_mm": null,
    "psu_wattage": null,
    "estimated_wattage": 5,
    "storage_capacity_gb": null,
    "storage_type": null,
    "ram_capacity_gb": null,
    "vram_gb": null,
    "cooler_type": "air",
    "cores": null,
    "threads": null
  }
];

const componentsData = JSON.parse(fs.readFileSync('./pc_components.seed.json', 'utf8'));

// Add back the restored components
componentsData.data.push(...restoredComponents);

// Update metadata
componentsData.__metadata.total_records = componentsData.data.length;

fs.writeFileSync(
  './pc_components.seed.json',
  JSON.stringify(componentsData, null, 2),
  'utf8'
);

console.log(`✅ Restored 3 duplicate components`);
console.log(`Total components now: ${componentsData.data.length}`);
