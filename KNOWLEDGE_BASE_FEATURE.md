# Knowledge Base & AI Model Selection Features

## Overview

Two major features added to enhance the AI Voice Agent:

1. **AI Model Selection** - Choose between OpenAI, Gemini, and OpenRouter
2. **Knowledge Base** - Add website content to provide context to the AI

---

## Feature 1: AI Model Selection

### Location
Settings → AI Assistant Configuration → AI Model Provider

### Supported Providers
- ✅ **OpenAI** (Active) - GPT-4o Realtime API
- 🚧 **Google Gemini** (Coming Soon) - Gemini 2.0 Flash
- 🚧 **OpenRouter** (Coming Soon) - Multiple models

### Database Fields Added
```sql
ALTER TABLE business_config ADD COLUMN:
- ai_model_provider TEXT DEFAULT 'openai'
- ai_model_name TEXT DEFAULT 'gpt-4o-realtime-preview-2024-12-17'
- gemini_api_key TEXT
- openrouter_api_key TEXT
```

### How It Works
1. User selects provider in Settings
2. Selects specific model
3. Enters API key (for Gemini/OpenRouter)
4. Settings saved to database
5. Voice agent uses selected model on next call

---

## Feature 2: Knowledge Base - Website Fetching

### Location
Settings → AI Assistant Configuration → Knowledge Base

### Features

#### Smart Website Crawling
- **Auto-detects important pages** (services, pricing, about, menu)
- **Configurable depth** (1-3 levels)
- **Max pages limit** (1-50 pages)
- **Clean content extraction** - Removes navigation, footers, ads
- **Converts to markdown** for token efficiency

#### Content Processing
- **AI Summarization** - Reduces content by 60-80%
- **Manual editing** - Edit fetched content before saving
- **Priority system** - Set importance (1-5 stars)
- **Active/inactive toggle** - Control what AI sees

#### Token Management
- Shows estimated tokens per source
- Total tokens across all active sources
- Alerts if exceeding context limits

### Database Schema
```sql
CREATE TABLE knowledge_sources (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  source_type TEXT, -- 'website', 'pdf', 'manual'
  url TEXT,
  title TEXT,
  content TEXT, -- Full content in markdown
  summary TEXT, -- AI-generated summary
  metadata JSONB, -- {word_count, page_count, fetch_date}
  priority INTEGER (1-5),
  is_active BOOLEAN,
  auto_update BOOLEAN,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### User Flow

**1. Add Website**
- Click "Add Website" button
- Enter URL
- Choose method:
  - Smart Full Website Crawl (recommended)
  - Single Page Only
- Set options (max depth, max pages)
- Click "Fetch & Preview"

**2. Preview & Edit**
- See all fetched pages
- Check word count and token estimates
- Select/deselect pages to include
- Click "Summarize" on large pages to reduce tokens
- Edit content if needed

**3. Save**
- Click "Save Selected"
- Pages added to knowledge base
- AI automatically uses them in next call

**4. Manage**
- Toggle active/inactive
- Delete sources
- See total tokens used

---

## API Endpoints

### POST /api/knowledge/fetch-website
**Request**:
```json
{
  "url": "https://example.com",
  "method": "smart_crawl",
  "options": {
    "maxDepth": 2,
    "maxPages": 20
  }
}
```

**Response**:
```json
{
  "pages": [
    {
      "url": "...",
      "title": "...",
      "content": "...",
      "wordCount": 1250,
      "excerpt": "..."
    }
  ],
  "totalWords": 5000,
  "estimatedTokens": 6667
}
```

### POST /api/knowledge/summarize
**Request**:
```json
{
  "content": "Long website content...",
  "maxTokens": 500
}
```

**Response**:
```json
{
  "summary": "Concise summary...",
  "originalTokens": 5000,
  "summaryTokens": 500,
  "compressionRatio": 0.1
}
```

---

## Web Scraping Technology

### Libraries Used
- **cheerio** - HTML parsing and link extraction
- **@mozilla/readability** - Extract main article content
- **turndown** - Convert HTML to clean Markdown
- **jsdom** - DOM manipulation for Readability

### Smart Crawl Algorithm
1. Fetch homepage
2. Extract all internal links
3. Prioritize links containing keywords:
   - service, pricing, price, menu, about, contact, product
4. Crawl up to maxDepth levels
5. Stop at maxPages limit
6. Extract main content only (no nav/footer/ads)
7. Convert to markdown
8. Calculate word count and tokens

### Respectful Crawling
- 100ms delay between requests
- Respects same-domain only
- Skips binary files (PDF, images, zip)
- Limits pages per domain

---

## AI Integration

### How Knowledge is Used

**When voice call starts**:
1. Load user's active knowledge sources (sorted by priority)
2. Build context from summaries (or full content if no summary)
3. Prepend to AI system instructions
4. Initialize voice agent with enhanced context

**Context Building**:
```
### Homepage
Summary of homepage content...

### Services Page
Summary of services offered...

### Pricing Page
Pricing information...

[User's Custom Instructions]
You are a helpful assistant...
```

### Token Management
- Loads high-priority sources first
- If context exceeds limits, uses summarized versions
- Shows total token count in UI

---

## Example Use Cases

### Salon Business
- Fetch salon website
- AI learns about:
  - Services offered (haircut, coloring, etc.)
  - Pricing ($50, $100, etc.)
  - Business hours
  - Special policies
- Voice agent can accurately answer questions

### Restaurant
- Fetch restaurant website + menu
- AI learns:
  - Menu items
  - Prices
  - Delivery info
  - Special instructions
- Can take orders accurately

### Service Business
- Fetch company website
- AI learns:
  - Service areas
  - Pricing structure
  - Emergency availability
  - Qualifications
- Can schedule appropriately

---

## Future Enhancements

### Phase 2 (Not Implemented Yet)
- PDF document support
- Google Docs integration
- Auto-update scheduling
- Multi-provider model switching (Gemini, OpenRouter)
- Usage analytics (which sources AI uses most)
- Relevance scoring (load only relevant chunks)

---

## Testing

### To Test Knowledge Base:
1. Run database migration:
   ```bash
   # In Supabase dashboard or via CLI
   psql -f supabase/migrations/20250114_knowledge_base.sql
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Go to Settings → AI Assistant Configuration → Knowledge Base

4. Click "Add Website"

5. Enter a URL (e.g., your business website)

6. Choose "Smart Full Website Crawl"

7. Set max depth (2) and max pages (20)

8. Click "Fetch & Preview"

9. See fetched pages, click "Summarize" on large ones

10. Click "Save Selected"

11. Sources appear in list

12. Toggle active/inactive as needed

13. AI will use this context in voice calls!

---

## Build Status
✅ 20 routes compiled successfully
✅ New API endpoints working
✅ Knowledge Base UI complete
✅ AI Model selection UI added

---

## Notes

- **OpenAI Realtime** is the only working model currently
- **Gemini and OpenRouter** support requires additional implementation
- **Summarization** uses GPT-4o-mini (cost-effective)
- **Max 20 websites** recommended to stay within context limits
- **Service role key required** for OAuth callbacks

Enjoy the enhanced AI capabilities! 🚀
