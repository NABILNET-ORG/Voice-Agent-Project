# Voice Agent Flow Diagram

## Current Issue: Missing API Key

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Clicks "Start Call"                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              POST /api/voice-agent/token                         │
│                                                                   │
│  1. ✅ Check authentication                                      │
│     → User: b2721f19-331a-4eb8-8c3d-184153e42faf                │
│                                                                   │
│  2. ✅ Fetch business_config                                     │
│     → Config found                                               │
│                                                                   │
│  3. ✅ Select provider                                           │
│     → Default: 'gemini' (for cost savings)                       │
│                                                                   │
│  4. ❌ Get API key                                               │
│     → config.gemini_api_key: NULL                                │
│     → process.env.GEMINI_API_KEY: undefined                      │
│                                                                   │
│  5. ❌ Return 400 Error                                          │
│     {                                                             │
│       "error": "GEMINI API key not configured",                  │
│       "message": "Please add your GEMINI API key..."             │
│     }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Shows Error                         │
│              "Failed to create session"                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Solution: Add Gemini API Key

```
┌─────────────────────────────────────────────────────────────────┐
│              Step 1: Get Free Gemini API Key                     │
│                                                                   │
│  https://aistudio.google.com/apikey                             │
│  → Click "Create API Key"                                        │
│  → Copy key (AIza...)                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         Step 2: Add Key via Settings UI                          │
│                                                                   │
│  http://localhost:3000/settings/integrations                    │
│  → Find "Google Gemini" card                                     │
│  → Click "Configure"                                             │
│  → Paste API key                                                 │
│  → ✅ Check "Use for Voice Agent"                               │
│  → Click "Save"                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Database Updated                                    │
│                                                                   │
│  UPDATE business_config SET                                      │
│    gemini_api_key = 'AIza...',                                  │
│    ai_voice_agent_provider = 'gemini'                           │
│  WHERE user_id = 'b2721f19-331a-4eb8-8c3d-184153e42faf'         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         Step 3: Test Voice Agent                                 │
│                                                                   │
│  http://localhost:3000/                                         │
│  → Click "Start Demo Call"                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              POST /api/voice-agent/token                         │
│                                                                   │
│  1. ✅ Check authentication                                      │
│     → User: b2721f19-331a-4eb8-8c3d-184153e42faf                │
│                                                                   │
│  2. ✅ Fetch business_config                                     │
│     → Config found                                               │
│     → ai_voice_agent_provider: 'gemini'                         │
│                                                                   │
│  3. ✅ Select provider                                           │
│     → Provider: 'gemini'                                         │
│                                                                   │
│  4. ✅ Get API key                                               │
│     → config.gemini_api_key: 'AIza...' ✓                        │
│                                                                   │
│  5. ✅ Create Gemini session                                     │
│     → WebSocket URL generated                                    │
│     → Setup message created                                      │
│                                                                   │
│  6. ✅ Return session credentials                                │
│     {                                                             │
│       "provider": "gemini",                                      │
│       "ws_url": "wss://generativelanguage.googleapis.com/...",  │
│       "setup_message": {...},                                    │
│       "model": "gemini-2.0-flash-live-001",                     │
│       "voice": "Puck",                                          │
│       "session_id": "gemini-1731764280000"                      │
│     }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Frontend Connects to Gemini                         │
│                                                                   │
│  1. Open WebSocket to Gemini Live API                           │
│  2. Send setup message                                           │
│  3. Start audio streaming (16kHz PCM16)                         │
│  4. Enable microphone                                            │
│  5. Show "Connected (Gemini)" status                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Voice Conversation Active! 🎉                       │
│                                                                   │
│  • User speaks → Gemini transcribes                             │
│  • Gemini responds with audio                                    │
│  • Function calls (bookings) work                                │
│  • Cost: $0.016/min (19x cheaper than OpenAI!)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Provider Selection Logic

```
┌─────────────────────────────────────────────────────────────────┐
│              Provider Selection Priority                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ Is ai_voice_agent_provider set?     │
        └─────────────────────────────────────┘
                 │                    │
           YES   │                    │   NO
                 ▼                    ▼
        ┌──────────────┐      ┌──────────────┐
        │ Use that     │      │ Default to   │
        │ provider     │      │ 'gemini'     │
        └──────────────┘      └──────────────┘
                 │                    │
                 └──────────┬─────────┘
                            ▼
                ┌─────────────────────┐
                │ Provider = 'gemini' │
                │        or           │
                │ Provider = 'openai' │
                └─────────────────────┘
                            │
                            ▼
        ┌─────────────────────────────────────┐
        │ Get API key for selected provider   │
        └─────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │ GEMINI:      │        │ OPENAI:      │
        │ 1. Check env │        │ 1. Check env │
        │ 2. Check DB  │        │ 2. Check DB  │
        └──────────────┘        └──────────────┘
                │                       │
                └───────────┬───────────┘
                            ▼
                    ┌───────────────┐
                    │ API key found?│
                    └───────────────┘
                         │      │
                    YES  │      │  NO
                         ▼      ▼
                 ┌─────────┐  ┌─────────┐
                 │ SUCCESS │  │ ERROR   │
                 │ 200 OK  │  │ 400 Bad │
                 └─────────┘  └─────────┘
```

---

## Cost Analysis Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Voice Agent Cost Comparison                         │
└─────────────────────────────────────────────────────────────────┘

Provider: GEMINI (Recommended)
├─ Cost per minute: $0.016
├─ Cost per hour: $0.96
├─ Monthly cost (100 min): $1.60
├─ Setup: FREE API key
├─ Free tier: 1500 requests/day
└─ Quality: High (90% of OpenAI)

Provider: OPENAI
├─ Cost per minute: $0.30
├─ Cost per hour: $18.00
├─ Monthly cost (100 min): $30.00
├─ Setup: Paid API key
├─ Free tier: $5 credit
└─ Quality: Premium (100%)

Savings with Gemini: 94.7%
ROI: Immediate
```

---

## Error States

### 1. No Business Config (404)
```
User → Token endpoint
         ↓
     Check auth ✅
         ↓
     Fetch config ❌ (no record found)
         ↓
     Return 404: "Business configuration not found"
```

**Fix**: Create business config via onboarding

### 2. No API Key (400) ← CURRENT ISSUE
```
User → Token endpoint
         ↓
     Check auth ✅
         ↓
     Fetch config ✅
         ↓
     Check API key ❌ (NULL or undefined)
         ↓
     Return 400: "GEMINI API key not configured"
```

**Fix**: Add API key via Settings UI (see QUICK_FIX_GUIDE.md)

### 3. Invalid API Key (400)
```
User → Token endpoint
         ↓
     Check auth ✅
         ↓
     Fetch config ✅
         ↓
     Check API key ✅
         ↓
     Call Gemini API ❌ (invalid key)
         ↓
     Return 400: "Failed to create realtime session"
```

**Fix**: Verify API key is correct

---

## Success Flow

```
User clicks "Start Call"
    ↓
Frontend: POST /api/voice-agent/token
    ↓
Backend: Check auth ✅
    ↓
Backend: Fetch config ✅
    ↓
Backend: Select provider (gemini) ✅
    ↓
Backend: Get API key ✅
    ↓
Backend: Create Gemini session ✅
    ↓
Backend: Return credentials ✅
    ↓
Frontend: Connect to Gemini WebSocket ✅
    ↓
Frontend: Send setup message ✅
    ↓
Gemini: Send setupComplete ✅
    ↓
Frontend: Enable microphone ✅
    ↓
Frontend: Start audio streaming ✅
    ↓
🎉 VOICE CONVERSATION ACTIVE! 🎉
```

---

**Last Updated**: November 16, 2025
**Current Status**: Waiting for API key configuration
**Next Step**: Follow QUICK_FIX_GUIDE.md
