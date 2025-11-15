# Next Actions

## Immediate (Do Now)

### 1. Run Database Migration
```bash
psql -f supabase/migrations/20250114_knowledge_base.sql
```

### 2. Add Google OAuth Test User
1. https://console.cloud.google.com/apis/credentials/consent
2. Add email to "Test users"
3. Test connection

### 3. Test Knowledge Base
Settings → AI Configuration → Knowledge Base → Add Website

---

## Short Term (This Week)

### 1. Integrate Knowledge into Voice Agent
Update useRealtimeAPI.ts to load and inject knowledge sources

### 2. Configure Notifications
- Twilio (SMS)
- Resend (Email)
- Test flows

### 3. Implement Gemini/OpenRouter
Add actual model connections

---

## Medium Term (This Month)

### 1. Production Deployment
```bash
vercel --prod
```

### 2. Phone Integration
Configure Twilio number and webhooks

### 3. Automated Testing
```bash
npm test
```

### 4. Performance
- Caching
- Pagination
- Optimization

---

**Priority**: Database migration → OAuth test user → Test Knowledge Base
