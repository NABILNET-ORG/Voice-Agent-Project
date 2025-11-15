#!/usr/bin/env python3
"""Check business_config schema and data"""

import psycopg2
import psycopg2.extras

CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

def main():
    conn = psycopg2.connect(CONNECTION_STRING)

    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        # Check columns
        print("business_config columns:")
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'business_config'
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        """)

        for row in cur.fetchall():
            print(f"  - {row['column_name']:<30} {row['data_type']:<20} {'NULL' if row['is_nullable'] == 'YES' else 'NOT NULL'}")

        # Check if openai_api_key exists
        print("\nChecking for openai_api_key column...")
        cur.execute("""
            SELECT COUNT(*) as count
            FROM information_schema.columns
            WHERE table_name = 'business_config'
            AND column_name = 'openai_api_key';
        """)

        count = cur.fetchone()['count']
        if count > 0:
            print("[OK] openai_api_key column exists")
        else:
            print("[WARN] openai_api_key column NOT found")
            print("\nAdding openai_api_key column...")
            cur.execute("ALTER TABLE business_config ADD COLUMN IF NOT EXISTS openai_api_key TEXT;")
            conn.commit()
            print("[OK] openai_api_key column added")

        # Check current data
        print("\nCurrent business_config data:")
        cur.execute("SELECT id, business_name, openai_api_key FROM business_config LIMIT 1;")
        row = cur.fetchone()
        if row:
            has_key = row['openai_api_key'] is not None and len(row['openai_api_key']) > 0
            print(f"  Business: {row['business_name']}")
            print(f"  OpenAI Key: {'SET (length: ' + str(len(row['openai_api_key'])) + ')' if has_key else 'NOT SET'}")
        else:
            print("  No data found")

    conn.close()
    print("\n[INFO] Check complete")

if __name__ == "__main__":
    main()
