# 🚨 CRITICAL DATABASE FIXES REQUIRED

## Issue 1: Missing `motherboard_ram_type` Column

The column does NOT exist in Supabase database despite being in the migration code.

### Fix: Run this SQL in Supabase SQL Editor

```sql
-- Step 1: Add the missing column
ALTER TABLE public.pc_components
ADD COLUMN motherboard_ram_type text;

-- Step 2: Create index for performance
CREATE INDEX idx_pc_components_mb_ram_type 
ON public.pc_components(motherboard_ram_type) 
WHERE motherboard_ram_type IS NOT NULL;
```

**Location**: Go to Supabase Dashboard → SQL Editor → Copy/paste the above → Run

---

## Issue 2: Motherboard Data Has Inconsistent RAM Type Fields

Current WRONG state:
- `ram_type` field on motherboards contains values like "DDR4" (SHOULD be NULL)
- `motherboard_ram_type` field is MISSING from database (SHOULD have DDR4/DDR5)

### Fix: Update Seed Data

The script `update-motherboard-seeds.mjs` will:
1. Load all seed data
2. For each motherboard component:
   - Move `ram_type` value → `motherboard_ram_type`
   - Clear `ram_type` (set to null)
3. Save corrected seed files
4. Re-import to database

### Execute:
```bash
node update-motherboard-seeds.mjs
node importSeeds-fast.mjs  # Re-import with corrected data
```

---

## Issue 3: Case Component Naming

Current state: 3 case components with similar names but DIFFERENT prices
- cas_001: ATX black/white chassis (300,000 TZS) - 10 presets
- cas_002: atx black/white chassis (350,000 TZS) - 18 presets  
- cas_003: atx black/white chassis (400,000 TZS) - 119 presets

**Status**: ✅ NOT a problem - they ARE different products (different prices)
- Each is actively referenced by presets
- They represent variant pricing
- This is CORRECT behavior

---

## Verification After Fixes

After running the above SQL and scripts, run:
```bash
node verify-db-integrity.mjs
```

All checks should pass:
- ✅ RAM compatibility field exists
- ✅ No orphaned references
- ✅ All critical fields populated

