#!/usr/bin/env python3
"""Fix Gemini model to use a valid current model"""

import psycopg2

CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

conn = psycopg2.connect(CONNECTION_STRING)

with conn.cursor() as cur:
    # Update to use a valid Gemini model
    cur.execute("""
        UPDATE business_config
        SET ai_model_name = 'gemini-1.5-flash'
        WHERE ai_model_provider = 'gemini';
    """)

    conn.commit()

    print("[OK] Updated model to gemini-1.5-flash (valid current model)")

    # Show current config
    cur.execute("""
        SELECT ai_model_provider, ai_model_name, ai_summarization_provider
        FROM business_config
        LIMIT 1;
    """)

    row = cur.fetchone()
    print(f"\nCurrent Configuration:")
    print(f"  Provider: {row[0]}")
    print(f"  Model: {row[1]}")
    print(f"  Summarization Provider: {row[2]}")

conn.close()
