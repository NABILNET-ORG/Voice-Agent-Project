# Database Migration Instructions

## 🎯 **Quick Start** (2 minutes)

The migration script is ready. You just need to provide your database password.

---

## 📋 **Step 1: Get Database Password**

1. Go to: **https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/settings/database**

2. Scroll to **"Database Password"** section

3. **Either**:
   - Copy your existing password (if you saved it), OR
   - Click **"Reset Database Password"** to generate a new one
   - **IMPORTANT**: Save this password securely!

---

## 🚀 **Step 2: Run Migration Script**

### **Option A: Set Environment Variable** (Recommended)

**Windows (PowerShell)**:
```powershell
$env:SUPABASE_DB_PASSWORD="your-password-here"
python scripts/run_voice_agent_migration.py
```

**Windows (CMD)**:
```cmd
set SUPABASE_DB_PASSWORD=your-password-here
python scripts/run_voice_agent_migration.py
```

**Linux/Mac**:
```bash
export SUPABASE_DB_PASSWORD='your-password-here'
python scripts/run_voice_agent_migration.py
```

### **Option B: Add to .env.local**

1. Open `.env.local` file

2. Add this line:
   ```
   SUPABASE_DB_PASSWORD=your-password-here
   ```

3. Run migration:
   ```bash
   python scripts/run_voice_agent_migration.py
   ```

---

## ✅ **Expected Output**

```
🔧 Voice Agent Architecture Migration
============================================================

✅ Migration file loaded: 5526 characters
   - 5 ALTER TABLE statements
   - 6 UPDATE statements
   - 6 COMMENT statements

📡 Connecting to Supabase via Session Pooler...
✅ Connected successfully

🚀 Executing migration...

   ✅ ALTER TABLE business_config
   ✅ ALTER TABLE business_config
   ✅ ALTER TABLE business_config
   ✅ UPDATE business_config (1 rows)
   ✅ UPDATE business_config (1 rows)
   ✅ UPDATE business_config (0 rows)
   ✅ ALTER TABLE business_config
   ✅ UPDATE business_config (1 rows)
   ✅ UPDATE business_config (1 rows)
   ✅ UPDATE business_config (1 rows)
   ✅ ADD CONSTRAINT

✅ Executed 20/20 statements successfully

💾 Committing transaction...
✅ Migration committed successfully!

🔍 Verifying new columns...
✅ All 8 new columns exist:
   - gemini_api_key_general: text
   - gemini_api_key_voice: text
   - openai_api_key_general: text
   - openai_api_key_voice: text
   - openrouter_api_key_general: text
   - openrouter_api_key_voice: text
   - voice_agent_model: text
   - voice_agent_personality: text
   - voice_agent_provider: text
   - voice_agent_voice_name: text

📊 Checking migrated data...
✅ Sample data from 'Samia Tarot':
   - Old gemini_api_key exists: True
   - New gemini_api_key_general exists: True
   - voice_agent_provider: gemini
   - voice_agent_model: gemini-2.0-flash-exp
   - voice_agent_voice_name: Puck

============================================================
🎉 MIGRATION COMPLETE!
============================================================

Next steps:
1. Restart dev server: npm run dev
2. Go to Settings → AI Assistant Configuration
3. See new VoiceAgentConfig component
4. Test voice agent on home page
```

---

## 🐛 **Troubleshooting**

### **Error: could not translate host name**

**Problem**: Database password not set or incorrect

**Solution**:
1. Double-check password from Supabase Dashboard
2. Make sure you set SUPABASE_DB_PASSWORD correctly
3. Try resetting database password

### **Error: column already exists**

**Problem**: Migration already ran

**Solution**: That's OK! The migration uses `IF NOT EXISTS` so it's safe to run multiple times

### **Error: permission denied**

**Problem**: Using wrong credentials

**Solution**: Make sure you're using the database password (not the anon key)

---

## 📊 **What the Migration Does**

### **New Columns Added** (10 total):
```
openai_api_key_general      - For text AI features
openai_api_key_voice        - For voice agent only
gemini_api_key_general      - For text AI features
gemini_api_key_voice        - For voice agent only
openrouter_api_key_general  - For text AI features
openrouter_api_key_voice    - For voice agent only
voice_agent_provider        - Provider selection (openai/gemini/openrouter)
voice_agent_model           - Model name (provider-specific)
voice_agent_voice_name      - Voice name (provider-specific)
voice_agent_personality     - Personality description
```

### **Data Migration**:
- Copies `gemini_api_key` → `gemini_api_key_general`
- Copies `openai_api_key` → `openai_api_key_general`
- Copies `ai_voice_agent_provider` → `voice_agent_provider`
- Copies `ai_voice` → `voice_agent_voice_name`
- Sets default `voice_agent_model` based on provider
- Sets default `voice_agent_personality`

### **Backward Compatibility**:
- Old columns are kept (NOT dropped)
- Code has fallback logic
- Existing users unaffected

---

## 🎯 **After Migration**

1. ✅ **Restart dev server**:
   ```bash
   npm run dev
   ```

2. ✅ **Test home page**:
   - Go to: http://localhost:3000/
   - Should see provider badge (Gemini/OpenAI with cost)
   - Click "Start Demo Call"
   - Should work with Gemini!

3. ✅ **Test Settings**:
   - Go to: http://localhost:3000/settings
   - Click "AI Assistant Configuration" tab
   - Should see VoiceAgentConfig component
   - Try changing provider/model/voice
   - Save and test

4. ✅ **Deploy**:
   ```bash
   vercel --prod
   ```

---

## 📝 **Connection Details**

**Supabase Project**: hixuvycqekjxbplddykt

**Session Pooler** (recommended):
- Host: `aws-0-us-east-1.pooler.supabase.com`
- Port: `6543`
- Database: `postgres`
- User: `postgres.hixuvycqekjxbplddykt`
- Password: Your database password

**Direct Connection** (alternative):
- Host: `db.hixuvycqekjxbplddykt.supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: Your database password

---

**Last Updated**: November 16, 2025
**Estimated Time**: 2 minutes
**Required**: Database password
