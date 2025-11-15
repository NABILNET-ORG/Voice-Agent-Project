#!/usr/bin/env python3
"""Test different Gemini model names to find the correct one"""

import psycopg2
import requests

CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Get API key
conn = psycopg2.connect(CONNECTION_STRING)
with conn.cursor() as cur:
    cur.execute("SELECT gemini_api_key FROM business_config LIMIT 1;")
    api_key = cur.fetchone()[0]
conn.close()

# Test different model names
models_to_test = [
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-flash"
]

print("Testing Gemini Models...")
print("=" * 80)

for model in models_to_test:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    payload = {
        "contents": [{"parts": [{"text": "Hi"}]}],
        "generationConfig": {"maxOutputTokens": 10}
    }

    headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': api_key
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)

        if response.status_code == 200:
            print(f"[OK] {model} - WORKS!")
            result = response.json()
            if 'candidates' in result:
                text = result['candidates'][0]['content']['parts'][0]['text']
                print(f"     Response: {text[:50]}")
        else:
            print(f"[FAIL] {model} - {response.status_code}")

    except Exception as e:
        print(f"[ERROR] {model} - {str(e)[:60]}")

print("=" * 80)
