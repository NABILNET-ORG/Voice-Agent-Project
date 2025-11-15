#!/usr/bin/env python3
"""Show full AI configuration with actual key values for debugging"""

import psycopg2
import psycopg2.extras

CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

conn = psycopg2.connect(CONNECTION_STRING)

with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
    cur.execute("""
        SELECT
            ai_summarization_provider,
            ai_model_name,
            gemini_api_key,
            openai_api_key
        FROM business_config
        LIMIT 1;
    """)

    row = cur.fetchone()

    print("Database Values:")
    print(f"  ai_summarization_provider: '{row['ai_summarization_provider']}'")
    print(f"  ai_model_name: '{row['ai_model_name']}'")
    print(f"  gemini_api_key: '{row['gemini_api_key'][:20]}...' ({len(row['gemini_api_key'] or '')} chars)")
    print(f"  openai_api_key: {len(row['openai_api_key'] or '')} chars")

    # Test what the API route will see
    print("\nWhat API route should use:")
    provider = row['ai_summarization_provider'] or 'openai'
    print(f"  Provider: {provider}")

    if provider == 'gemini':
        print(f"  API Key: {row['gemini_api_key'][:20]}...")
        print(f"  Model: {row['ai_model_name'] or 'gemini-pro'}")
        print(f"  URL: https://generativelanguage.googleapis.com/v1beta/models/{row['ai_model_name'] or 'gemini-pro'}:generateContent")

conn.close()
