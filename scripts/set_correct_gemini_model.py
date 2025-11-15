#!/usr/bin/env python3
"""Set correct Gemini model name"""

import psycopg2

CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

conn = psycopg2.connect(CONNECTION_STRING)

with conn.cursor() as cur:
    # Use gemini-pro which is the stable model
    cur.execute("""
        UPDATE business_config
        SET ai_model_name = 'gemini-pro'
        WHERE ai_model_provider = 'gemini';
    """)

    conn.commit()

    print("[OK] Updated to gemini-pro (stable model)")

conn.close()
