# 🚀 INSTANT DATABASE SETUP

## Copy and Paste This Into Supabase SQL Editor

**Go to:** https://supabase.com/dashboard/project/hixuvycqekjxbplddykt/sql/new

**Then paste the entire contents from the file below:**

`supabase/migrations/20250111_initial_schema.sql`

**Click Run** and you're done!

---

## OR Use This Quick Command (If you have psql locally)

```bash
psql "postgresql://postgres:SisI2009@db.hixuvycqekjxbplddykt.supabase.co:5432/postgres" < supabase/migrations/20250111_initial_schema.sql
```

---

## What Gets Created

✅ 4 tables with Row Level Security:
- `profiles` - User profiles with Google Calendar tokens
- `business_config` - Complete business configuration
- `bookings` - All appointments and orders
- `call_logs` - Call history with transcripts

✅ RLS Policies - Automatic data isolation per user

✅ Triggers - Auto-create profile + business config for new users

✅ Indexes - Optimized queries

---

## Verify It Worked

Run this query in SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'business_config', 'bookings', 'call_logs');
```

You should see all 4 tables listed!

---

**Next:** Configure Edge Function secrets and set up Twilio webhook!
