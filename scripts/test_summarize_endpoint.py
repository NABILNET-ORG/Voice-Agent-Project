#!/usr/bin/env python3
"""Test the summarize API endpoint"""

import requests
import json

url = "http://localhost:3000/api/knowledge/summarize"

data = {
    "content": "This is a test website about tarot readings. We offer professional tarot card readings for guidance and spiritual insight.",
    "maxTokens": 100
}

headers = {
    "Content-Type": "application/json"
}

print("Testing Summarize API Endpoint...")
print("=" * 80)

try:
    response = requests.post(url, json=data, headers=headers, timeout=30)

    print(f"Status Code: {response.status_code}")
    print(f"\nResponse:")
    print(json.dumps(response.json(), indent=2))

except Exception as e:
    print(f"Error: {e}")
    print(f"\nResponse Text: {response.text if 'response' in locals() else 'No response'}")

print("=" * 80)
