# ✋ STOP — Manual Supabase Step Required

## The Problem

Your database is missing the **`motherboard_ram_type`** column needed for RAM compatibility validation.

**Current state:**
- Migration code defines the column
- But it was NOT applied to your live Supabase database
- Seed data has been fixed ✅
- Database schema must now be updated

---

## The Fix (2 Steps)

### STEP 1: Add Column to Supabase Database

**Go to**: Supabase Dashboard → SQL Editor

**Run this SQL:**

```sql
ALTER TABLE public.pc_components
ADD COLUMN motherboard_ram_type text;

CREATE INDEX idx_pc_components_mb_ram_type 
ON public.pc_components(motherboard_ram_type) 
WHERE motherboard_ram_type IS NOT NULL;
```

**Expected Result:**
- No errors
- Column added successfully
- Index created

### STEP 2: Re-Import Corrected Seed Data

After SQL completes, run:

```bash
node importSeeds-fast.mjs
```

This will:
1. Delete old data (on conflict)
2. Insert corrected motherboards with `motherboard_ram_type` populated
3. Update 147 presets
4. Update 1470 preset items

---

## Verify Everything Works

After re-import, run:

```bash
node verify-db-integrity.mjs
```

**Expected Output:**
```
=== CHECK 1: RAM Compatibility Field ===
✅ Motherboard samples:
  mot_001: ASUS PRIME B250M D4
    - ram_type: null
    - motherboard_ram_type: DDR5

=== CHECK 2: Duplicates ===
✅ No duplicate issue (3 case variants with different prices are OK)

=== CHECK 3: Orphaned References ===
✅ All preset items reference valid components

=== CHECK 4: NULL Compatibility Fields ===
✅ All critical compatibility fields are populated
```

---

## Why This Matters

Without `motherboard_ram_type`, your builder's RAM validation fails:

**Current broken logic:**
```javascript
// RAM type match check tries to use motherboard_ram_type
if (motherboard.motherboard_ram_type !== ram.ram_type) {
  // AUTO-REPLACE or ERROR
}
// But column doesn't exist → query returns null → always fails ❌
```

**After fix:**
```javascript
// RAM type match works correctly
if (motherboard.motherboard_ram_type === 'DDR5' && ram.ram_type === 'DDR5') {
  // ✅ Compatible
}
```

---

## Questions?

After completing Step 1 (SQL), return here and we'll verify + complete Step 2 (import).

