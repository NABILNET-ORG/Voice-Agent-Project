# Phase 2 & 3 Implementation Plan
## Voice Agent Architecture Refactor

**Goal**: Implement dual API keys per provider + dedicated voice agent configuration on HOME PAGE

---

## 🎯 **Architecture Overview**

### **Current Issues**:
1. ❌ Single API key per provider (can't separate billing)
2. ❌ Voice agent config mixed with general AI config (Integrations page)
3. ❌ Voice demo on separate page (`/voice-demo`)
4. ❌ Home page uses old WebRTC implementation (OpenAI only)
5. ❌ Voice names not validated per provider

### **Target Architecture**:
1. ✅ Dual API keys per provider (general + voice)
2. ✅ Voice agent config in AI Assistant Configuration tab
3. ✅ Voice agent on HOME PAGE with dual-provider support
4. ✅ Provider-specific model/voice dropdowns
5. ✅ Voice personality customization

---

## 📊 **Database Changes**

### **New Columns** (business_config table):

```sql
-- Dual API Keys
openai_api_key_general TEXT        -- For summarization, analytics, etc.
openai_api_key_voice TEXT          -- For voice agent only
gemini_api_key_general TEXT
gemini_api_key_voice TEXT
openrouter_api_key_general TEXT
openrouter_api_key_voice TEXT

-- Voice Agent Configuration
voice_agent_provider TEXT          -- 'openai', 'gemini', 'openrouter'
voice_agent_model TEXT             -- Provider-specific model name
voice_agent_voice_name TEXT        -- Provider-specific voice name
voice_agent_personality TEXT       -- Personality description
voice_agent_speed DECIMAL          -- Speech speed multiplier (0.5 - 2.0)
voice_agent_pitch DECIMAL          -- Voice pitch adjustment (-20 to +20)
```

### **Migration**:
- File: `supabase/migrations/20251116_voice_agent_architecture.sql` ✅ CREATED
- Status: Ready to run in production
- Backward compatible: Keeps old columns, migrates data automatically

---

## 🎨 **UI Changes**

### **1. Settings → Integrations Page**

**BEFORE**:
```
OpenAI Card:
  - API Key: [input]
  - Model: [dropdown]
  - ☑ Use for Voice Agent
  - ☑ Use for Summarization
```

**AFTER**:
```
OpenAI Card:
  - General API Key: [input] (for text AI features)
  - Voice Agent API Key: [input] (for realtime voice)
  - Model for Text AI: [dropdown]
  - ☑ Use for Summarization
  - ☑ Use for Analytics
  - ☑ Use for Transcription
  (NO voice agent checkbox - configured separately)
```

### **2. Settings → AI Assistant Configuration Tab**

**NEW SECTION**: Voice Agent Configuration

```
┌─────────────────────────────────────────┐
│    Voice Agent Configuration             │
├─────────────────────────────────────────┤
│  Provider:                               │
│  ○ OpenAI ($0.30/min)                   │
│  ● Google Gemini ($0.016/min) ← DEFAULT │
│  ○ OpenRouter                            │
│                                          │
│  Model: (changes based on provider)      │
│  [gemini-2.0-flash-exp ▼]               │
│                                          │
│  Voice: (changes based on provider)      │
│  [Puck - Friendly, warm, male ▼]        │
│                                          │
│  Personality:                            │
│  [Friendly - Warm, approachable ▼]      │
│  - Friendly                              │
│  - Professional                          │
│  - Empathetic                            │
│  - Energetic                             │
│  - Custom (text input)                   │
│                                          │
│  Advanced:                               │
│  Speech Speed: [1.0] (0.5 - 2.0)        │
│  Voice Pitch: [0] (-20 to +20)          │
│                                          │
│  [Preview Voice] [Save Configuration]   │
└─────────────────────────────────────────┘
```

### **3. Home Page (/) **

**REPLACE**: WebRTC implementation with WebSocket dual-provider

**NEW FEATURES**:
- Show provider badge (OpenAI or Gemini)
- Show cost per minute
- Provider-specific connection logic
- Function calling for bookings
- Real-time transcription

**REMOVE**: `/voice-demo` page (consolidate to home)

---

## 💻 **Code Changes**

### **Files to Modify**:

1. **Database Migration** ✅
   - `supabase/migrations/20251116_voice_agent_architecture.sql`

2. **API Endpoints**:
   - `src/app/api/voice-agent/token/route.ts` - Use new columns
   - Update SELECT query to use `voice_agent_*` columns

3. **Settings Pages**:
   - `src/app/settings/integrations/page.tsx` - Add 2nd API key field per provider
   - `src/app/settings/page.tsx` - Add Voice Agent Configuration section

4. **Home Page**:
   - `src/app/page.tsx` - Replace WebRTC with WebSocket implementation
   - `src/hooks/useRealtimeAPI.ts` - Update to support both providers (like voice-demo)

5. **Types & Constants**:
   - `src/lib/gemini-live/client.ts` - Already done ✅
   - Add voice/model constants file

---

## 📝 **Implementation Steps**

### **Step 1: Update Voice Agent Token Endpoint** ✅ (Partial)

Current code uses:
```typescript
config.openai_api_key
config.gemini_api_key
config.ai_voice_agent_provider
config.ai_voice
```

Update to use:
```typescript
config.openai_api_key_voice || config.openai_api_key_general || config.openai_api_key
config.gemini_api_key_voice || config.gemini_api_key_general || config.gemini_api_key
config.voice_agent_provider || config.ai_voice_agent_provider
config.voice_agent_voice_name || config.ai_voice
config.voice_agent_model || 'gemini-2.0-flash-exp'
```

**Fallback chain ensures backward compatibility!**

### **Step 2: Create Voice Agent Config Component**

New component: `VoiceAgentConfig.tsx`

Features:
- Provider selection (radio buttons)
- Dynamic model dropdown (filtered by provider)
- Dynamic voice dropdown (filtered by provider)
- Personality selector
- Advanced settings (speed, pitch)
- Preview button (test voice)

### **Step 3: Update Integrations Page**

Modify provider cards to show:
- API Key for General AI
- API Key for Voice Agent
- Remove "Use for Voice Agent" checkbox

### **Step 4: Update Home Page**

Replace `useRealtimeAPI` hook with dual-provider WebSocket implementation:
- Copy logic from `/voice-demo/page.tsx`
- Support both OpenAI and Gemini
- Show provider badge
- Function calling for bookings

### **Step 5: Run Migration**

Execute SQL in Supabase Dashboard or via deployment.

---

## ⏱️ **Time Estimates**

| Task | Estimate | Priority |
|------|----------|----------|
| Database migration | ✅ Done | HIGH |
| Update token endpoint | 30 min | HIGH |
| Create VoiceAgentConfig component | 2 hours | HIGH |
| Update Integrations page | 1 hour | MEDIUM |
| Update home page | 2 hours | HIGH |
| Testing & debugging | 1-2 hours | HIGH |
| **TOTAL** | **6-8 hours** | |

---

## 🚦 **Current Status**

- [x] Database migration created
- [ ] Migration executed (pending deployment)
- [ ] Token endpoint updated
- [ ] Voice Agent Config component created
- [ ] Integrations page updated
- [ ] Home page updated
- [ ] End-to-end testing

---

## 🎯 **Acceptance Criteria**

### **Phase 2**:
1. ✅ User can add 2 separate API keys per provider (Integrations)
2. ✅ Voice agent configured in AI Assistant Configuration tab
3. ✅ Provider selection determines available models/voices
4. ✅ Home page uses WebSocket with dual-provider support
5. ✅ Backward compatible with existing data

### **Phase 3**:
1. ✅ Personality customization working
2. ✅ Speech speed/pitch controls functional
3. ✅ Voice preview feature
4. ✅ A/B testing framework (optional)

---

## 🤔 **Decision Points**

### **Question 1: Should we keep `/voice-demo` page?**
- **Option A**: Remove it, consolidate to home page
- **Option B**: Keep it as advanced/testing page
- **Recommendation**: Remove it (less confusing)

### **Question 2: Backward compatibility?**
- **Option A**: Keep old columns, add fallback logic
- **Option B**: Drop old columns, force migration
- **Recommendation**: Option A (safer)

### **Question 3: When to run migration?**
- **Option A**: Run now via Supabase Dashboard
- **Option B**: Run on next deployment (auto-run)
- **Recommendation**: Option B (less manual work)

---

## 🚀 **Next Actions**

**Ready to proceed with implementation?**

I'll start with:
1. Update voice agent token endpoint (30 min)
2. Create voice agent config UI component (2 hours)
3. Replace home page WebRTC with WebSocket (2 hours)
4. Test end-to-end (1 hour)

**Total: ~5-6 hours of development**

Should I proceed? Or do you want to see a mockup first?

---

**Created**: November 16, 2025
**Estimated Completion**: Same day (5-6 hours)
**Status**: Awaiting approval to proceed
