# Next Actions

## Immediate (Do Now - Next Session)

### 1. Test 3 Extraction Modes ⚠️ HIGH PRIORITY
**Status**: Implementation complete, needs real-world testing

**Test Cases**:
- Test simple-query mode: Should extract 2-3 services quickly
- Test full-context mode: Should extract all 25+ services
- Test batch mode: Should show real-time progress (1/25, 2/25, etc.)
- Verify bilingual fields populated correctly (name_ar/en, description_ar/en)
- Check extraction quality and accuracy

### 2. Service Deduplication
**Problem**: Same service might be extracted multiple times from different sources

**Solution**:
- Implement duplicate detection (compare name + price)
- Merge duplicate entries (keep longest description)
- Show "X duplicates removed" message in UI

### 3. Smart Full Website Crawl (URL Extraction Enhancement)
- Discover links from starting URL
- Crawl discovered pages (limit to same domain)
- Extract services from all pages
- Deduplicate across pages
- Show: "Crawled 15 pages, found 45 services, 12 unique"

---

## Short Term (This Week)

### 1. Test Voice Agent with Extracted Services
- Add services via extraction
- Test voice agent mentions services correctly
- Verify bilingual responses

---

## Medium Term (This Month)

### 1. Enhanced Service Management
- Drag-and-drop reordering
- Service categories/filtering
- Bulk operations (delete, edit multiple)
- Service templates

### 2. Enhanced Service Management UI
- Service categories/filtering in UI
- Search/filter services by name or category
- Better visual organization

### 3. Production Deployment
```bash
vercel --prod
```

---

**Priority**: Test 3 modes → Deduplication → Full website crawl → Voice agent testing

**Completed This Session**:
✅ Implemented 3 extraction modes (simple-query, full-context, batch)
✅ Added batching support for efficient processing
✅ Real-time progress tracking UI
✅ Bilingual field support (AR/EN)
✅ Backward compatibility maintained
✅ Token limit issue resolved
