# Knowledge Base Setup Guide

## Current Status

✅ **Database Migration:** Complete
✅ **UI Components:** Working
✅ **Website Fetch:** Working (fetched 1 page from samiatarot.com)
❌ **Summarization:** Failing - Missing OpenAI API Key

## Issue: Summarize API 500 Error

The Knowledge Base feature is almost working, but the summarization endpoint is returning a 500 error because the `OPENAI_API_KEY` environment variable is not set.

### Quick Fix

Add your OpenAI API key to the `.env` file:

```bash
# Add this line to .env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Steps to Fix

1. **Get OpenAI API Key**
   - Go to: https://platform.openai.com/api-keys
   - Create a new secret key
   - Copy the key (starts with `sk-`)

2. **Add to .env File**
   ```bash
   echo "OPENAI_API_KEY=sk-your-key-here" >> .env
   ```

3. **Restart Dev Server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

4. **Test Knowledge Base**
   - Go to: Settings → AI Configuration → Knowledge Base
   - Click "Add Website"
   - Enter URL: https://samiatarot.com/
   - Click "Fetch & Summarize"
   - Should now work!

## Why Only 1 Page Was Found

The website crawler found only 1 page with 144 words from https://samiatarot.com/. This could be because:

### Possible Reasons
1. **Homepage Only** - The crawler might have only fetched the homepage
2. **No Internal Links** - The homepage might not have links to other pages
3. **JavaScript-Heavy Site** - If the site uses client-side routing, links won't be in HTML
4. **Crawl Depth** - Default depth is 2, might need adjustment

### Solution: Adjust Crawl Settings

The Knowledge Base Manager UI allows you to:
- Increase `maxPages` (default: 20)
- Increase `maxDepth` (default: 2)
- Add specific URLs manually for important pages

### Crawl Configuration

In `KnowledgeBaseManager.tsx`, you can modify the fetch options:

```typescript
const options = {
  maxDepth: 3,        // Increase to crawl deeper
  maxPages: 50,       // Increase to fetch more pages
  priorityKeywords: [
    'service', 'pricing', 'price',
    'menu', 'about', 'contact',
    'product', 'tarot', 'reading'  // Add site-specific keywords
  ]
};
```

### Manual Page Addition

For important pages that the crawler misses:
1. Fetch each page individually
2. Combine the content
3. Edit and merge in the preview before saving

## Next Steps

### Immediate
1. ✅ Add `OPENAI_API_KEY` to `.env`
2. ✅ Restart dev server
3. ✅ Test summarization

### Testing
1. Try fetching https://samiatarot.com/ again with summarization
2. Test with other pages:
   - https://samiatarot.com/services
   - https://samiatarot.com/about
   - https://samiatarot.com/pricing
   - (Add other important pages)

3. Verify the summary is useful for AI voice agent

### Production
1. Add `OPENAI_API_KEY` to Vercel environment variables
2. Test knowledge base in production
3. Add real business website content
4. Configure priority levels (1-5) for different sources

## Expected Behavior After Fix

```
1. User enters URL
2. System fetches content (1-20 pages)
3. Content is sent to OpenAI for summarization
4. Summary is generated (concise, ~500 tokens)
5. User can preview and edit summary
6. User saves to knowledge_sources table
7. AI voice agent uses summary in conversations
```

## Troubleshooting

### Error: "OpenAI API key not configured"
- Solution: Add `OPENAI_API_KEY` to `.env` file

### Error: "Failed to fetch website"
- Check URL is accessible
- Try with http:// or https://
- Check for CORS restrictions

### Only 1 Page Found
- Check if site uses JavaScript routing
- Try increasing maxDepth
- Manually add important pages

### Summary Too Short/Long
- Adjust `maxTokens` parameter (default: 500)
- Edit summary before saving
- Regenerate if needed

## Advanced Configuration

### Custom Summarization Model

In `src/app/api/knowledge/summarize/route.ts`:

```typescript
// Change model for different quality/cost tradeoffs
model: 'gpt-4o-mini',        // Fast, cheap (current)
model: 'gpt-4o',             // Better quality, more expensive
model: 'gpt-3.5-turbo',      // Cheaper, faster
```

### Custom System Prompt

Modify the summarization prompt for your specific use case:

```typescript
content: `You are a helpful assistant for a tarot reading business.
Summarize this website content focusing on:
- Types of tarot readings offered
- Pricing and packages
- Booking process
- Special services
Keep it under ${maxTokens} tokens.`
```

## Testing Checklist

After adding OpenAI API key:

- [ ] Fetch website (should find multiple pages)
- [ ] Generate summary (should work without 500 error)
- [ ] Preview summary (should be concise and useful)
- [ ] Edit summary if needed
- [ ] Save to database
- [ ] Verify in knowledge_sources table
- [ ] Test AI voice agent uses the knowledge
- [ ] Check token usage and costs

---

**Status:** Ready for testing after adding `OPENAI_API_KEY`
**Next:** Add API key → Restart → Test summarization
