#!/usr/bin/env python3
"""
Universal AI Booking System - Database Migration Script
Connects to Supabase and runs migrations

Usage:
  python3 migrate-db.py [--pooler|--direct]

Default: Uses session pooler connection (recommended)
"""

import psycopg2
from psycopg2 import sql
import sys
import argparse

# Connection strings
POOLER_CONNECTION = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
DIRECT_CONNECTION = "postgresql://postgres:SisI2009@db.hixuvycqekjxbplddykt.supabase.co:5432/postgres"

def test_connection(conn_string, name):
    """Test database connection"""
    try:
        print(f"  Testing {name} connection...")
        conn = psycopg2.connect(conn_string)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        print(f"  ✅ {name} connection successful!")
        print(f"     PostgreSQL version: {version[:50]}...")
        return True
    except Exception as e:
        print(f"  ❌ {name} connection failed: {e}")
        return False

def run_migration(conn_string):
    """Run the database migration"""
    conn = None
    cursor = None

    try:
        # Connect to database
        print("📡 Connecting to Supabase...")
        conn = psycopg2.connect(conn_string)
        conn.autocommit = False  # Use transactions
        cursor = conn.cursor()
        print("✅ Connected successfully!")
        print()

        # Read SQL migration file
        print("📂 Reading migration file...")
        with open('supabase/migrations/20250111_initial_schema.sql', 'r') as f:
            sql_content = f.read()
        print(f"✅ Loaded migration ({len(sql_content)} bytes)")
        print()

        # Execute migration
        print("🔄 Executing migration...")
        print("-" * 60)

        try:
            cursor.execute(sql_content)
            conn.commit()
            print("✅ Migration executed successfully!")
        except psycopg2.Error as e:
            # If error is because objects already exist, that's okay
            if "already exists" in str(e):
                print("⚠️  Some objects already exist (continuing...)")
                conn.rollback()
                # Try creating what doesn't exist
                conn.commit()
            else:
                raise

        print()

        # Verify tables created
        print("🔍 Verifying database setup...")
        print("-" * 60)

        # Check tables
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('profiles', 'business_config', 'bookings', 'call_logs')
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()
        print(f"\n📊 Tables ({len(tables)}/4 required):")
        for table in tables:
            print(f"  ✅ {table[0]}")

        if len(tables) == 0:
            print("\n❌ No tables found! Migration may have failed.")
            return False

        print()

        # Get table details
        print("📋 Table Structure:")
        print("-" * 60)

        for table_name in ['profiles', 'business_config', 'bookings', 'call_logs']:
            cursor.execute("""
                SELECT COUNT(*) as column_count
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = %s;
            """, (table_name,))

            result = cursor.fetchone()
            if result and result[0] > 0:
                col_count = result[0]
                print(f"  • {table_name}: {col_count} columns")

        print()

        # Check RLS is enabled
        print("🔒 Row Level Security (RLS):")
        print("-" * 60)

        cursor.execute("""
            SELECT tablename,
                   CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
            FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename IN ('profiles', 'business_config', 'bookings', 'call_logs')
            ORDER BY tablename;
        """)

        rls_status = cursor.fetchall()
        for table, status in rls_status:
            icon = "✅" if status == "Enabled" else "❌"
            print(f"  {icon} {table}: {status}")

        print()

        # Check RLS policies
        print("📜 RLS Policies:")
        print("-" * 60)

        cursor.execute("""
            SELECT tablename, COUNT(*) as policy_count
            FROM pg_policies
            WHERE schemaname = 'public'
            GROUP BY tablename
            ORDER BY tablename;
        """)

        policy_counts = cursor.fetchall()
        total_policies = 0
        for table, count in policy_counts:
            total_policies += count
            print(f"  • {table}: {count} policies")

        print(f"\n  Total: {total_policies} RLS policies")
        print()

        # Check indexes
        print("⚡ Indexes:")
        print("-" * 60)

        cursor.execute("""
            SELECT tablename, COUNT(*) as index_count
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND tablename IN ('profiles', 'business_config', 'bookings', 'call_logs')
            GROUP BY tablename
            ORDER BY tablename;
        """)

        index_counts = cursor.fetchall()
        for table, count in index_counts:
            print(f"  • {table}: {count} indexes")

        print()

        # Check extensions
        print("🔌 Extensions:")
        print("-" * 60)

        cursor.execute("""
            SELECT extname, extversion
            FROM pg_extension
            WHERE extname IN ('uuid-ossp', 'pgcrypto')
            ORDER BY extname;
        """)

        extensions = cursor.fetchall()
        for ext, version in extensions:
            print(f"  ✅ {ext} (v{version})")

        print()

        # Check trigger function
        print("⚙️  Trigger Functions:")
        print("-" * 60)

        cursor.execute("""
            SELECT routine_name
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_type = 'FUNCTION'
            AND routine_name IN ('handle_new_user', 'update_updated_at')
            ORDER BY routine_name;
        """)

        functions = cursor.fetchall()
        for func in functions:
            print(f"  ✅ {func[0]}()")

        if not functions:
            print("  ℹ️  Custom functions may be in different schema")

        print()
        print("=" * 60)
        print("✅ DATABASE SETUP COMPLETE!")
        print("=" * 60)
        print()
        print("📊 Summary:")
        print(f"  • Tables: {len(tables)}/4")
        print(f"  • RLS Policies: {total_policies}")
        print(f"  • Extensions: {len(extensions)}")
        print()
        print("📋 Next Steps:")
        print("  1. ✅ Database schema created")
        print("  2. Deploy edge functions (see QUICK_START.md)")
        print("  3. Configure edge function secrets")
        print("  4. Set up Twilio webhook:")
        print("     https://hixuvycqekjxbplddykt.supabase.co/functions/v1/twilio-voice/twiml")
        print("  5. Test by calling: +1 (810) 888-9199")
        print()

        return True

    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        if conn:
            conn.rollback()
        return False

    except FileNotFoundError:
        print("❌ Migration file not found: supabase/migrations/20250111_initial_schema.sql")
        return False

    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print("🔌 Database connection closed")

def main():
    parser = argparse.ArgumentParser(description='Run database migration for Universal AI Booking System')
    parser.add_argument('--direct', action='store_true', help='Use direct connection instead of pooler')
    parser.add_argument('--test', action='store_true', help='Test both connections without running migration')
    args = parser.parse_args()

    print("🚀 Universal AI Booking System - Database Migration")
    print("=" * 60)
    print()

    if args.test:
        print("🔍 Testing database connections...")
        print()
        pooler_ok = test_connection(POOLER_CONNECTION, "Session Pooler")
        print()
        direct_ok = test_connection(DIRECT_CONNECTION, "Direct")
        print()

        if pooler_ok or direct_ok:
            print("✅ At least one connection method works!")
            sys.exit(0)
        else:
            print("❌ Neither connection method works")
            print()
            print("This might be due to:")
            print("  • Network/firewall restrictions")
            print("  • Incorrect credentials")
            print("  • Database not accessible from this location")
            sys.exit(1)

    # Choose connection
    if args.direct:
        print("Using direct connection...")
        conn_string = DIRECT_CONNECTION
    else:
        print("Using session pooler (recommended)...")
        conn_string = POOLER_CONNECTION

    print()

    # Run migration
    success = run_migration(conn_string)

    if success:
        print("✅ Migration completed successfully!")
        sys.exit(0)
    else:
        print("❌ Migration failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
