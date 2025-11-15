#!/usr/bin/env python3
"""Set OpenAI API key in business_config"""

import psycopg2
import sys

CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

def set_openai_key(api_key):
    """Set OpenAI API key in business_config table"""

    if not api_key or not api_key.startswith('sk-'):
        print("[ERROR] Invalid API key. OpenAI keys start with 'sk-'")
        return False

    conn = psycopg2.connect(CONNECTION_STRING)

    try:
        with conn.cursor() as cur:
            # Update the business_config table
            cur.execute("""
                UPDATE business_config
                SET openai_api_key = %s
                WHERE id IN (SELECT id FROM business_config LIMIT 1);
            """, (api_key,))

            conn.commit()

            if cur.rowcount > 0:
                print(f"[OK] OpenAI API key set successfully")
                print(f"[INFO] Key length: {len(api_key)} characters")
                print(f"[INFO] Key prefix: {api_key[:20]}...")
                return True
            else:
                print("[WARN] No business_config row found to update")
                return False

    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Failed to set API key: {e}")
        return False
    finally:
        conn.close()

def main():
    print("OpenAI API Key Setup")
    print("=" * 60)

    if len(sys.argv) > 1:
        api_key = sys.argv[1]
    else:
        print("\nUsage: python scripts/set_openai_key.py <your-openai-api-key>")
        print("\nOr run interactively:")
        api_key = input("\nEnter your OpenAI API key: ").strip()

    if not api_key:
        print("[ERROR] No API key provided")
        sys.exit(1)

    success = set_openai_key(api_key)

    if success:
        print("\n" + "=" * 60)
        print("[SUCCESS] API key configured!")
        print("\nNext steps:")
        print("1. Restart your dev server: npm run dev")
        print("2. Go to Settings → AI Configuration → Knowledge Base")
        print("3. Try adding a website and summarizing it")
        print("=" * 60)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
