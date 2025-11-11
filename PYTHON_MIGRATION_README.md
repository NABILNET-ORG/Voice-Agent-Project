# 🐍 Python Database Migration Guide

## Production-Ready Script

The `migrate-db.py` script is a comprehensive database migration tool that:

✅ **Connects via Session Pooler** (recommended) or direct connection
✅ **Executes the full SQL migration**
✅ **Verifies all tables, RLS policies, indexes**
✅ **Audits the complete database setup**
✅ **Provides detailed error messages**

---

## Quick Start

### Step 1: Install Dependencies (if needed)

```bash
pip install psycopg2-binary
```

### Step 2: Run Migration

```bash
python3 migrate-db.py
```

That's it! The script will:
1. Connect to Supabase via session pooler
2. Execute the migration SQL
3. Verify all 4 tables were created
4. Check RLS policies
5. Audit indexes and triggers
6. Provide next steps

---

## Command Options

### Default (Session Pooler - Recommended)
```bash
python3 migrate-db.py
```

Uses: `aws-1-ap-southeast-1.pooler.supabase.com`
Best for: Production use, better connection pooling

### Direct Connection
```bash
python3 migrate-db.py --direct
```

Uses: `db.hixuvycqekjxbplddykt.supabase.co`
Best for: Direct database access

### Test Connections
```bash
python3 migrate-db.py --test
```

Tests both connection methods without running migration

---

## Expected Output

```
🚀 Universal AI Booking System - Database Migration
============================================================

Using session pooler (recommended)...

📡 Connecting to Supabase...
✅ Connected successfully!

📂 Reading migration file...
✅ Loaded migration (12847 bytes)

🔄 Executing migration...
------------------------------------------------------------
✅ Migration executed successfully!

🔍 Verifying database setup...
------------------------------------------------------------

📊 Tables (4/4 required):
  ✅ bookings
  ✅ business_config
  ✅ call_logs
  ✅ profiles

📋 Table Structure:
------------------------------------------------------------
  • profiles: 10 columns
  • business_config: 70 columns
  • bookings: 37 columns
  • call_logs: 13 columns

🔒 Row Level Security (RLS):
------------------------------------------------------------
  ✅ bookings: Enabled
  ✅ business_config: Enabled
  ✅ call_logs: Enabled
  ✅ profiles: Enabled

📜 RLS Policies:
------------------------------------------------------------
  • bookings: 4 policies
  • business_config: 4 policies
  • call_logs: 3 policies
  • profiles: 3 policies

  Total: 14 RLS policies

⚡ Indexes:
------------------------------------------------------------
  • bookings: 5 indexes
  • business_config: 1 indexes
  • call_logs: 4 indexes
  • profiles: 1 indexes

🔌 Extensions:
------------------------------------------------------------
  ✅ uuid-ossp (v1.1)

⚙️  Trigger Functions:
------------------------------------------------------------
  ✅ handle_new_user()
  ✅ update_updated_at()

============================================================
✅ DATABASE SETUP COMPLETE!
============================================================

📊 Summary:
  • Tables: 4/4
  • RLS Policies: 14
  • Extensions: 1

📋 Next Steps:
  1. ✅ Database schema created
  2. Deploy edge functions (see QUICK_START.md)
  3. Configure edge function secrets
  4. Set up Twilio webhook:
     https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml
  5. Test by calling: +1 (810) 888-9199

🔌 Database connection closed
✅ Migration completed successfully!
```

---

## Troubleshooting

### Connection Failed

**Error:** `could not translate host name`

**Solution:**
- Check internet connection
- Verify firewall allows PostgreSQL connections (port 5432)
- Try `--direct` flag to use direct connection

### Authentication Failed

**Error:** `password authentication failed`

**Solution:**
- Verify credentials are correct in the script
- Check if password contains special characters (already handled)

### Migration Already Run

**Message:** `Some objects already exist (continuing...)`

**This is normal!** The script handles existing objects gracefully.

---

## Connection Details

### Session Pooler (Default)
- **Host:** aws-1-ap-southeast-1.pooler.supabase.com
- **Port:** 5432
- **User:** postgres.hixuvycqekjxbplddykt
- **Database:** postgres
- **Best for:** Production, concurrent connections

### Direct Connection (--direct flag)
- **Host:** db.hixuvycqekjxbplddykt.supabase.co
- **Port:** 5432
- **User:** postgres
- **Database:** postgres
- **Best for:** Administrative tasks, migrations

---

## Security Notes

- Credentials are hardcoded for convenience (this is YOUR private project)
- For production deployment, use environment variables:
  ```python
  import os
  CONNECTION_STRING = os.getenv('DATABASE_URL')
  ```
- The script uses parameterized queries to prevent SQL injection
- All connections use SSL by default

---

## What Gets Created

### 4 Tables
1. **profiles** - User profiles with Google Calendar tokens
2. **business_config** - Complete business configuration (70+ fields)
3. **bookings** - All appointments and orders
4. **call_logs** - Call history with transcripts

### Row Level Security (RLS)
- All tables have RLS enabled
- 14 security policies ensure data isolation
- Each user can only access their own data

### Indexes
- Optimized queries on user_id, date, status
- Fast lookups for bookings and calls

### Triggers
- `handle_new_user()` - Auto-creates profile + config for new users
- `update_updated_at()` - Auto-updates timestamps

### Extensions
- `uuid-ossp` - UUID generation support

---

## Alternative: Manual Migration

If the Python script doesn't work for any reason:

1. Go to: https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/sql/new
2. Copy contents from: `supabase/migrations/20250111_initial_schema.sql`
3. Paste and click **Run**

---

## Next Steps After Migration

Once migration succeeds, follow **QUICK_START.md** to:
1. Deploy edge functions
2. Configure secrets
3. Set up Twilio webhook
4. Test the system

---

**Script Location:** `migrate-db.py`
**Migration SQL:** `supabase/migrations/20250111_initial_schema.sql`
**Support:** See DEPLOYMENT_GUIDE.md for detailed instructions
