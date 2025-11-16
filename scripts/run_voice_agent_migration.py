#!/usr/bin/env python3
"""
Run Voice Agent Architecture Migration
Uses psycopg2 to connect via Supabase Session Pooler
"""

import os
import sys
import psycopg2
from urllib.parse import urlparse

def get_connection_string():
    """Get database connection string from environment"""
    # Try to get from various sources
    db_url = os.getenv('DATABASE_URL')
    if db_url:
        return db_url

    # Build from Supabase URL
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL', 'https://hixuvycqekjxbplddykt.supabase.co')
    project_ref = supabase_url.replace('https://', '').replace('.supabase.co', '')

    # Supabase Session Pooler format (port 6543)
    # postgres://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

    password = os.getenv('SUPABASE_DB_PASSWORD')
    if not password:
        print("❌ SUPABASE_DB_PASSWORD environment variable not set")
        print()
        print("To find your database password:")
        print("1. Go to: https://supabase.com/dashboard/project/" + project_ref + "/settings/database")
        print("2. Copy the 'Database Password' or reset it")
        print("3. Set environment variable:")
        print(f"   export SUPABASE_DB_PASSWORD='your-password-here'")
        print("   OR add to .env.local")
        return None

    # Session Pooler connection string (recommended for serverless)
    conn_str = f"postgresql://postgres.{project_ref}:{password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

    return conn_str

def run_migration():
    """Execute the voice agent architecture migration"""
    print("🔧 Voice Agent Architecture Migration")
    print("=" * 60)
    print()

    # Get connection string
    conn_str = get_connection_string()
    if not conn_str:
        return False

    # Read migration file
    migration_file = 'supabase/migrations/20251116_voice_agent_architecture.sql'
    try:
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        print(f"✅ Migration file loaded: {len(migration_sql)} characters")
        print(f"   - {migration_sql.count('ALTER TABLE')} ALTER TABLE statements")
        print(f"   - {migration_sql.count('UPDATE')} UPDATE statements")
        print(f"   - {migration_sql.count('COMMENT ON')} COMMENT statements")
        print()
    except FileNotFoundError:
        print(f"❌ Migration file not found: {migration_file}")
        return False

    # Connect to database
    print("📡 Connecting to Supabase via Session Pooler...")
    try:
        conn = psycopg2.connect(conn_str)
        conn.autocommit = False  # Use transaction
        cursor = conn.cursor()
        print("✅ Connected successfully")
        print()
    except psycopg2.Error as e:
        print(f"❌ Connection failed: {e}")
        print()
        print("Troubleshooting:")
        print("1. Verify SUPABASE_DB_PASSWORD is correct")
        print("2. Check database is accessible")
        print("3. Verify Session Pooler is enabled")
        return False

    # Execute migration
    try:
        print("🚀 Executing migration...")
        print()

        # Split into individual statements
        statements = migration_sql.split(';')
        total = len([s for s in statements if s.strip() and not s.strip().startswith('--')])
        executed = 0

        for statement in statements:
            stmt = statement.strip()
            if not stmt or stmt.startswith('--'):
                continue

            try:
                cursor.execute(stmt)
                executed += 1

                # Show progress for major statements
                if 'ALTER TABLE' in stmt:
                    table = stmt.split('ALTER TABLE')[1].split()[0]
                    print(f"   ✅ ALTER TABLE {table}")
                elif 'UPDATE business_config' in stmt:
                    rows = cursor.rowcount
                    print(f"   ✅ UPDATE business_config ({rows} rows)")
                elif 'ADD CONSTRAINT' in stmt:
                    print(f"   ✅ ADD CONSTRAINT")
                elif 'COMMENT ON' in stmt:
                    pass  # Don't spam for comments

            except psycopg2.Error as e:
                if 'already exists' in str(e):
                    print(f"   ⚠️  {e} (skipping, already exists)")
                else:
                    print(f"   ❌ Error: {e}")
                    raise

        print()
        print(f"✅ Executed {executed}/{total} statements successfully")

        # Commit transaction
        print()
        print("💾 Committing transaction...")
        conn.commit()
        print("✅ Migration committed successfully!")

    except psycopg2.Error as e:
        print(f"❌ Migration failed: {e}")
        print()
        print("Rolling back...")
        conn.rollback()
        cursor.close()
        conn.close()
        return False

    # Verify new columns
    print()
    print("🔍 Verifying new columns...")
    try:
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'business_config'
            AND column_name IN (
                'openai_api_key_general',
                'openai_api_key_voice',
                'gemini_api_key_general',
                'gemini_api_key_voice',
                'voice_agent_provider',
                'voice_agent_model',
                'voice_agent_voice_name',
                'voice_agent_personality'
            )
            ORDER BY column_name;
        """)

        columns = cursor.fetchall()
        if len(columns) == 8:
            print(f"✅ All {len(columns)} new columns exist:")
            for col in columns:
                print(f"   - {col[0]}: {col[1]}")
        else:
            print(f"⚠️  Found {len(columns)}/8 columns (some may have failed)")

    except psycopg2.Error as e:
        print(f"❌ Verification failed: {e}")

    # Check migrated data
    print()
    print("📊 Checking migrated data...")
    try:
        cursor.execute("""
            SELECT
                business_name,
                gemini_api_key IS NOT NULL as has_old_gemini_key,
                gemini_api_key_general IS NOT NULL as has_general_key,
                voice_agent_provider,
                voice_agent_model,
                voice_agent_voice_name
            FROM business_config
            LIMIT 1;
        """)

        result = cursor.fetchone()
        if result:
            print(f"✅ Sample data from '{result[0]}':")
            print(f"   - Old gemini_api_key exists: {result[1]}")
            print(f"   - New gemini_api_key_general exists: {result[2]}")
            print(f"   - voice_agent_provider: {result[3]}")
            print(f"   - voice_agent_model: {result[4]}")
            print(f"   - voice_agent_voice_name: {result[5]}")
    except psycopg2.Error as e:
        print(f"⚠️  Could not check data: {e}")

    # Cleanup
    cursor.close()
    conn.close()

    print()
    print("=" * 60)
    print("🎉 MIGRATION COMPLETE!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Restart dev server: npm run dev")
    print("2. Go to Settings → AI Assistant Configuration")
    print("3. See new VoiceAgentConfig component")
    print("4. Test voice agent on home page")
    print()

    return True

if __name__ == '__main__':
    success = run_migration()
    sys.exit(0 if success else 1)
