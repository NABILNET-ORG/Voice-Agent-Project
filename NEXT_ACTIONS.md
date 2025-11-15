# Next Actions

## Immediate (Do Now - Next Session)

### 1. Fix Service Extraction Token Limits ⚠️ HIGH PRIORITY
**Problem**: Only extracting 2/16 (KB) or 7/16 (URL) services due to 8192 token limit

**Solution**:
- Implement batch processing (1 source at a time)
- Add real-time progress: "Extracting 5/25 (20%)"
- Aggregate all results
- Keep ALL bilingual fields (don't reduce data)

### 2. Add 3 Extraction Modes
- **Single Page Only**: Current URL extraction
- **Smart Full Website Crawl**: Discover + extract from all pages, deduplicate
- **Knowledge Base (All Sources)**: Extract from all 25 KB sources

### 3. Fix Bilingual Extraction
- Ensure both name_ar AND name_en extracted
- Ensure both description_ar AND description_en extracted
- Fix category extraction (currently wrong/missing)

---

## Short Term (This Week)

### 1. Service Deduplication
- Implement duplicate detection (same name + price = duplicate)
- Merge descriptions (keep longest)
- Show "X duplicates removed" message

### 2. Progress Indicator UI
- Animated progress bar during extraction
- Display: "Extracting service 12/25 (48%)"
- Show current service name being processed
- Estimated time remaining

### 3. Test Voice Agent with Services
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

### 2. Full Website Crawl Implementation
- Discover links from starting URL
- Crawl discovered pages
- Extract services from all pages
- Deduplicate across pages
- Show: "Crawled 15 pages, found 45 services, 12 unique"

### 3. Production Deployment
```bash
vercel --prod
```

---

**Priority**: Fix token limit (batching) → Add progress UI → Implement 3 modes → Test end-to-end
