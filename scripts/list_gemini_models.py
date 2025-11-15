#!/usr/bin/env python3
import psycopg2
import requests

CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

conn = psycopg2.connect(CONNECTION_STRING)
with conn.cursor() as cur:
    cur.execute("SELECT gemini_api_key FROM business_config LIMIT 1;")
    api_key = cur.fetchone()[0]
conn.close()

print("Listing available Gemini models...")
print("=" * 80)

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"

try:
    response = requests.get(url, timeout=10)
    if response.status_code == 200:
        data = response.json()
        models = data.get('models', [])
        print(f"\nFound {len(models)} models:\n")
        for model in models:
            name = model.get('name', '').replace('models/', '')
            methods = model.get('supportedGenerationMethods', [])
            if 'generateContent' in methods:
                print(f"  [OK] {name}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error: {e}")
