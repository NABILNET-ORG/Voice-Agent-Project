#!/usr/bin/env python3
import psycopg2
import requests

CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

conn = psycopg2.connect(CONNECTION_STRING)
with conn.cursor() as cur:
    cur.execute("SELECT gemini_api_key FROM business_config LIMIT 1;")
    api_key = cur.fetchone()[0]
conn.close()

# Try v1 API
models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]

for model in models:
    print(f"\nTesting {model} with v1 API...")
    url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={api_key}"

    payload = {
        "contents": [{"parts": [{"text": "Hi"}]}]
    }

    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            print(f"  [OK] {model} WORKS with v1!")
            break
        else:
            print(f"  [FAIL] {response.status_code}: {response.json().get('error', {}).get('message', '')[:80]}")
    except Exception as e:
        print(f"  [ERROR] {str(e)[:80]}")
