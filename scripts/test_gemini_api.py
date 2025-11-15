#!/usr/bin/env python3
"""Test Gemini API key and connection"""

import psycopg2
import psycopg2.extras
import requests
import json

CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

def main():
    print("=" * 80)
    print("GEMINI API TEST")
    print("=" * 80)

    # Get API key from database
    conn = psycopg2.connect(CONNECTION_STRING)

    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute("SELECT gemini_api_key, ai_model_name FROM business_config LIMIT 1;")
        row = cur.fetchone()

        if not row or not row['gemini_api_key']:
            print("[ERROR] Gemini API key not found in database")
            conn.close()
            return

        api_key = row['gemini_api_key']
        model = row['ai_model_name'] or 'gemini-pro'

        print(f"\n[INFO] API Key: {api_key[:10]}... ({len(api_key)} chars)")
        print(f"[INFO] Model: {model}")

    conn.close()

    # Test API call
    print(f"\n[INFO] Testing Gemini API...")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': api_key
    }

    data = {
        "contents": [{
            "parts": [{
                "text": "Say 'Hello, the API is working!' in a single short sentence."
            }]
        }],
        "generationConfig": {
            "maxOutputTokens": 50,
            "temperature": 0.3
        }
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)

        print(f"\n[INFO] Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                text = result['candidates'][0]['content']['parts'][0]['text']
                print(f"[OK] API Response: {text}")
                print("\n[SUCCESS] Gemini API is working correctly!")
            else:
                print(f"[ERROR] Unexpected response format: {result}")
        else:
            print(f"[ERROR] API call failed")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"[ERROR] {e}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
