#!/usr/bin/env python3
import psycopg2
import requests

CONNECTION_STRING = "postgresql://postgres.hixuvycqekjxbplddykt:SisI2009@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

conn = psycopg2.connect(CONNECTION_STRING)

with conn.cursor() as cur:
    # Set to gemini-2.5-flash
    cur.execute("UPDATE business_config SET ai_model_name = 'gemini-2.5-flash';")
    conn.commit()

    # Get API key
    cur.execute("SELECT gemini_api_key FROM business_config LIMIT 1;")
    api_key = cur.fetchone()[0]

conn.close()

# Test the API
url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

payload = {
    "contents": [{"parts": [{"text": "Summarize: Professional tarot reading services. We offer guidance and spiritual insights."}]}],
    "generationConfig": {"maxOutputTokens": 50, "temperature": 0.3}
}

headers = {
    'Content-Type': 'application/json',
    'x-goog-api-key': api_key
}

response = requests.post(url, json=payload, headers=headers)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    text = result['candidates'][0]['content']['parts'][0]['text']
    print(f"[OK] Gemini working!")
    print(f"Summary: {text}")
else:
    print(f"Error: {response.text}")
