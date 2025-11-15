# Next Session - Service Extraction Enhancements

## 🎯 Primary Goals

### 1. Fix Knowledge Base Extraction (HIGH PRIORITY)
**Current Issue**: Only extracts 2 of 16 services due to 8192 token output limit

**Solution**: Batch Processing with Real-Time Progress
- Process sources one-by-one or in small batches
- Show animated progress bar: "Extracting service 5/25 (20%)"
- Keep ALL bilingual fields (name_ar, name_en, description_ar, description_en, etc.)
- Aggregate results from all batches

**Implementation**:
```typescript
// Backend: Loop through sources
for (let i = 0; i < sources.length; i++) {
  const service = await extractSingleSource(sources[i]);
  allServices.push(service);
  // Could use SSE to stream progress updates
}
```

---

### 2. Add 3 Extraction Modes
**Current**: Only has "Extract from URL" and "Extract from Knowledge Base"

**New Modes**:

#### Mode 1: Single Page Only (Current URL extraction)
- Extracts from the specific URL provided
- Fast, simple

#### Mode 2: Smart Full Website Crawl
- Starts from provided URL
- Crawls related pages (discovers links)
- Extracts services from ALL discovered pages
- Deduplicates services (same name/price = duplicate)
- Shows progress: "Crawled 15 pages, found 45 services"

#### Mode 3: Extract All Services from Knowledge Base
- Goes through ALL 25 knowledge sources
- Extracts unique services (no duplicates)
- Currently partially working (2 of 16 due to token limit)
- Needs batch processing fix from Goal #1

**UI Changes**:
```tsx
// Services page - Add mode selector
<Select value={extractionMode}>
  <SelectItem value="single-page">Single Page Only</SelectItem>
  <SelectItem value="full-crawl">Smart Full Website Crawl</SelectItem>
  <SelectItem value="knowledge-base">From Knowledge Base (All Sources)</SelectItem>
</Select>
```

---

### 3. Service Deduplication Logic
**Problem**: Might extract same service multiple times from different pages

**Solution**:
```typescript
function deduplicateServices(services) {
  const unique = new Map();

  for (const service of services) {
    const key = `${service.name_ar || service.name}-${service.price}`;

    if (!unique.has(key)) {
      unique.set(key, service);
    } else {
      // Merge descriptions if longer
      const existing = unique.get(key);
      if (service.description?.length > existing.description?.length) {
        existing.description = service.description;
      }
    }
  }

  return Array.from(unique.values());
}
```

---

### 4. Fix URL Extraction Issue
**Problem**: Fetched only 7 of 16 services from https://www.samiatarot.com/shop

**Possible Causes**:
- Token limit truncation (same as KB extraction)
- Not scrolling/loading dynamic content
- Missing services hidden in JavaScript/AJAX

**Solutions**:
- Increase `maxOutputTokens` to 16384 (double current)
- Or process page in sections
- Or use Puppeteer to render full page with JavaScript

---

## 📊 Current Status (From Last Session)

### ✅ Working Features
1. Voice agent with full settings context (ALL tabs)
2. Service extraction UI + review modal
3. Bilingual support structure
4. Enhanced web crawling (sends full HTML)
5. Debug logging (identified token limit issue)

### ⚠️ Needs Fixing
1. **KB Extraction**: Only 2/16 services due to token limit → Need batching
2. **URL Extraction**: Only 7/16 services from shop page → Need investigation
3. **Deduplication**: No duplicate detection yet
4. **Progress UI**: No real-time progress indicator

### 🔧 Technical Details

**Token Limits**:
- Input: ~50,000 chars max
- Output: 8,192 tokens max (MAJOR BOTTLENECK)
- Solution: Process in batches of 1-3 sources at a time

**Bilingual Fields** (Keep ALL of these):
- `name`, `name_ar`, `name_en`
- `description`, `description_ar`, `description_en`, `description_short`
- `category`, `category_ar`, `category_en`
- `price`, `duration` (single fields)

---

## 🚀 Implementation Plan

### Step 1: Fix KB Extraction with Batching (1-2 hours)
1. Update `/api/services/extract-from-knowledge` to process one-by-one
2. Add progress logging: "Processing 5/25..."
3. Aggregate all results
4. Test with all 25 sources

### Step 2: Add Progress UI (30 min)
1. Add progress state to services page
2. Show progress bar during extraction
3. Display: "Extracting service 12/25 (48%)"
4. Could use polling or websockets for real-time updates

### Step 3: Add 3 Extraction Modes (1 hour)
1. Add mode selector dropdown
2. Implement full website crawl logic
3. Add deduplication algorithm
4. Update UI to show mode-specific options

### Step 4: Fix URL Extraction Completeness (30 min)
1. Investigate why only 7/16 services from shop page
2. Increase token limit or add batching
3. Test with https://www.samiatarot.com/shop

---

## 📝 Code Snippets for Reference

### Batch Processing Pattern
```typescript
const BATCH_SIZE = 1; // Process one at a time for full details
let allServices = [];

for (let i = 0; i < knowledgeSources.length; i++) {
  const source = knowledgeSources[i];
  console.log(`Extracting ${i + 1}/${knowledgeSources.length}: ${source.title}`);

  const service = await extractFromSingleSource(source, geminiApiKey);
  if (service) {
    allServices.push(service);
  }
}

return deduplicateServices(allServices);
```

### Progress Update (Future: Use SSE)
```typescript
// Send progress update
res.write(`data: ${JSON.stringify({
  current: i + 1,
  total: knowledgeSources.length,
  percent: Math.round(((i + 1) / knowledgeSources.length) * 100),
  currentService: source.title
})}\n\n`);
```

---

## 🐛 Known Issues to Address

1. **KB Extraction**: 2/16 services (token limit)
2. **URL Extraction**: 7/16 services (needs investigation)
3. **No deduplication**: Same service might appear multiple times
4. **No progress indicator**: User waits 30+ seconds with no feedback
5. **Bilingual incomplete**: Only getting Arabic names, need both languages
6. **Categories wrong**: Not extracting proper categories

---

## ✅ Quick Wins for Next Session

1. Simply process KB extraction in loop (30 min to implement)
2. Add "Extracting X/Y..." message (10 min)
3. Increase `maxOutputTokens` to 16384 for URL extraction (5 min)
4. Test with all sources and commit

**Estimated time**: 2-3 hours for complete implementation

---

**Current Session**: 14 commits pushed, all major infrastructure complete
**Next Session**: Fix extraction completeness + add progress UI + 3 modes
