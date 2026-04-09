# 🧪 PC BUILDER - QUICK TEST GUIDE

**Dev Server:** http://localhost:5175/builder

---

## ✅ TEST 1: COMPONENT VISIBILITY

**Goal:** Verify components show when you click a slot

1. Open http://localhost:5175/builder
2. Scroll down to "Customize Your Build" section
3. Click "Select" on the CPU slot
4. ✅ Component picker opens at bottom
5. ✅ See title: "Select CPU" (shows 15 options available)
6. ✅ See search bar at top
7. ✅ See grid of CPU cards:
   - Component name (e.g., "AMD Ryzen 7 7700X")
   - Spec line (e.g., "Socket AM5 • 8C/16T")
   - Price (e.g., "TZS 1,200,000")
8. ✅ Click any CPU → Added to slot
9. ✅ Picker closes automatically
10. ✅ Slot now shows ✓ Selected component

---

## ✅ TEST 2: SEARCH COMPONENTS

**Goal:** Verify search filter works in picker

1. Click CPU slot again → Picker opens
2. Type "Ryzen 5" in search box
3. ✅ Grid instantly filters to matching components
4. ✅ Shows "X options available" (fewer numbers)
5. Clear search → Shows all again

---

## ✅ TEST 3: SELECT MULTIPLE COMPONENTS

**Goal:** Build complete PC with multiple parts

1. Select CPU ✓
2. Click RAM slot → Picker shows DDR5/DDR4 options
   - ✅ Shows specs like "32GB DDR5"
3. Select RAM → Slot updates
4. Click GPU slot → Picker shows GPUs
   - ✅ Shows specs like "12GB VRAM"
5. Select GPU → Slot updates
6. Repeat for: Motherboard, Storage, PSU, etc.

**After each selection:**
- ✅ Total price updates in sidebar
- ✅ Component count increases
- ✅ Slot shows selected component

---

## ✅ TEST 4: PRESET CARDS

**Goal:** Verify preset cards are modern & clickable

1. Scroll to top of page
2. See section: "🔥 Choose a Starting Point"
3. ✅ See 3 preset cards in grid
4. Each card shows:
   - Build name
   - Tag (Gaming/Editing/Budget/High-End with icon)
   - Price (bold, large)
   - CPU: [name]
   - GPU: [name]  
   - Components: 8
5. ✅ Hover over card → border highlights, shadow increases
6. Click "✓ Use This Build" button
   - ✅ All components load
   - ✅ Page scrolls to builder section
   - ✅ All 8 slots show selected components
   - ✅ Total price updates to preset price

---

## ✅ TEST 5: BUILD SUMMARY

**Goal:** Verify price display is prominent

1. Look at right sidebar
2. ✅ See large gradient card with:
   - "TOTAL BUILD PRICE" label
   - Huge price: "TZS X,XXX,XXX"
   - Status: "Valid" or warning
3. ✅ Add a component → Price updates instantly
4. ✅ On mobile, summary stays visible (sticky or in flow)

---

## ✅ TEST 6: VALIDATION

**Goal:** Test compatibility checking

**Scenario 1: Compatible build**
1. Select:
   - CPU: Ryzen 7 (Socket AM5)
   - MB: ASUS MB with AM5
   - RAM: 32GB DDR5
   - GPU: RTX 4070
2. Click "✓ Validate Build" button
3. ✅ Shows green status: "valid"
4. ✅ No errors or warnings

**Scenario 2: Incompatible build (if available)**
1. Select:
   - CPU: Socket AM4
   - MB: Socket AM5 (mismatch!)
2. Click Validate
3. ✅ Shows yellow warning: "⚠️ warning"
4. ✅ System suggests auto-replacement
5. ✅ Component may be auto-replaced

---

## ✅ TEST 7: MOBILE RESPONSIVE

**Goal:** Verify layout works on phones

1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Set to iPhone SE (375px width)
4. ✅ Preset cards: Stack single column
5. ✅ Component slots: Stack single column  
6. ✅ Sidebar summary: Still visible
7. ✅ Picker modal: Full screen properly
8. ✅ All text readable
9. ✅ All buttons clickable

---

## ✅ TEST 8: ERROR HANDLING

**Goal:** Verify error states work

**Force an error:**
1. Disconnect internet (or throttle network)
2. Refresh page
3. Try to click CPU slot
4. ✅ See error message: "Failed to load components"
5. Internet back on → Retry works

---

## ✅ TEST 9: LOADING STATES

**Goal:** Verify skeleton loaders

1. Slow down network (DevTools → Network → 3G Slow)
2. Open builder page
3. ✅ See skeleton loaders for presets
4. ✅ Skeleton loaders for components picker
5. ✅ After ~1-2 seconds: Real content loads

---

## ✅ TEST 10: COMPLETE WORKFLOW

**Goal:** End-to-end test

1. **Start:** Open http://localhost:5175/builder
2. **See presets:** 3 preset cards visible
3. **Load preset:** Click "Use This Build"
   - All 8 components load
   - Scroll to builder
   - Price: TZS X,XXX,XXX
4. **Modify build:** Click RAM slot, choose different RAM
   - Slot updates
   - Total price changes
5. **Validate:** Click "Validate Build"
   - Status shows (green/yellow/red)
6. **Add to cart:** Click "Add to Cart"
   - Button shows loading state
   - Action completes
7. **Success:** No errors in console

---

## 🐛 IF SOMETHING DOESN'T WORK

### Components not showing:
- [ ] Backend running? Check http://localhost:3000/api/builds/presets
- [ ] Error in console? (F12 → Console tab)
- [ ] Try refresh page
- [ ] Check network tab (should show 200 OK)

### Components showing but slow:
- [ ] Throttle network in DevTools
- [ ] Normal behavior - data loading

### Presets don't load:
- [ ] Backend running?
- [ ] Check console for error
- [ ] Verify http://localhost:3000/api/builds/presets works

### Search not working:
- [ ] Try typing different component names
- [ ] Check if any components match your search term

### Price not updating:
- [ ] Refresh page
- [ ] Try selecting a different component
- [ ] Check console for errors

### Mobile layout broken:
- [ ] Clear cache (Ctrl+Shift+Delete)
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Try different device size

---

## 📊 EXPECTED DATA

**Presets can load:** 3 sample presets
- Preset 1: ~5 TZS
- Preset 2: ~5 TZS  
- Preset 3: ~5 TZS

**Components per type:**
- CPU: 15 available
- Motherboard: 6 available
- GPU: 14 available
- RAM: 4 available
- And more...

**Total components in DB:** 54 PC components

---

## ✅ FINAL CHECKLIST

Mark these as you test:

- [ ] Components visible when slot clicked
- [ ] Search filters components
- [ ] Can select CPU, RAM, GPU, etc.
- [ ] Price updates after each selection
- [ ] Preset cards look modern
- [ ] "Use This Build" loads all components
- [ ] Page scrolls to builder after preset load
- [ ] Validation shows status
- [ ] Mobile layout responsive
- [ ] No console errors
- [ ] No 500 errors in network tab
- [ ] LoadingStates show while fetching
- [ ] Error handling works

**All green?** ✅ System ready for production!

---

## 🚀 NEXT: DEPLOY

When ready to go live:
1. Push frontend build to GitHub
2. Render auto-deploys
3. Redeploy backend on Render (important!)
4. Test at https://ys-store-h1ec.onrender.com/builder
