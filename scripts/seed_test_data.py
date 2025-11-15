#!/usr/bin/env python3
"""
Seed test data for TestSprite testing
Creates sample bookings and call logs for testing
"""

import os
from supabase import create_client, Client
from datetime import datetime, timedelta
import json

# Load environment variables
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Missing Supabase credentials")
    print("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase: Client = create_client(url, key)

# Get test user ID (from environment or use default test user)
test_user_id = os.environ.get("TEST_USER_ID")

if not test_user_id:
    print("No TEST_USER_ID provided. Getting first user...")
    # Try to get a user from profiles table
    result = supabase.table("profiles").select("id").limit(1).execute()
    if result.data and len(result.data) > 0:
        test_user_id = result.data[0]["id"]
    else:
        print("No users found in database. Please create a user first.")
        exit(1)

print(f"Using user ID: {test_user_id}")

# Create sample bookings
print("\nCreating sample bookings...")
bookings = [
    {
        "user_id": test_user_id,
        "customer_name": "Alice Johnson",
        "customer_email": "alice@example.com",
        "customer_phone": "+1-555-0101",
        "booking_type": "appointment",
        "service_or_item": "Haircut",
        "date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "time": "10:00",
        "duration_minutes": 60,
        "base_price": 50.00,
        "tax_amount": 7.50,
        "total_amount": 57.50,
        "status": "confirmed",
        "notes": "Test booking 1"
    },
    {
        "user_id": test_user_id,
        "customer_name": "Bob Smith",
        "customer_email": "bob@example.com",
        "customer_phone": "+1-555-0102",
        "booking_type": "appointment",
        "service_or_item": "Massage",
        "date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
        "time": "14:00",
        "duration_minutes": 90,
        "base_price": 80.00,
        "tax_amount": 12.00,
        "total_amount": 92.00,
        "status": "confirmed",
        "notes": "Test booking 2"
    },
    {
        "user_id": test_user_id,
        "customer_name": "Carol Williams",
        "customer_email": "carol@example.com",
        "customer_phone": "+1-555-0103",
        "booking_type": "appointment",
        "service_or_item": "Consultation",
        "date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
        "time": "11:00",
        "duration_minutes": 30,
        "base_price": 30.00,
        "tax_amount": 4.50,
        "total_amount": 34.50,
        "status": "completed",
        "notes": "Test booking 3 - completed",
        "completed_at": (datetime.now() - timedelta(days=1)).isoformat()
    }
]

for booking in bookings:
    try:
        result = supabase.table("bookings").insert(booking).execute()
        print(f"✅ Created booking: {booking['customer_name']} - {booking['service_or_item']}")
    except Exception as e:
        print(f"❌ Error creating booking for {booking['customer_name']}: {e}")

# Create sample call logs
print("\nCreating sample call logs...")
call_logs = [
    {
        "user_id": test_user_id,
        "customer_phone": "+1-555-0101",
        "customer_name": "Alice Johnson",
        "started_at": (datetime.now() - timedelta(hours=2)).isoformat(),
        "ended_at": (datetime.now() - timedelta(hours=2) + timedelta(minutes=3)).isoformat(),
        "duration_seconds": 180,
        "outcome": "success",
        "booking_type": "appointment",
        "transcript": [{"role": "assistant", "content": "Hello!"}, {"role": "user", "content": "I'd like to book a haircut"}],
        "sentiment": "positive"
    },
    {
        "user_id": test_user_id,
        "customer_phone": "+1-555-0104",
        "customer_name": "David Brown",
        "started_at": (datetime.now() - timedelta(hours=5)).isoformat(),
        "ended_at": (datetime.now() - timedelta(hours=5) + timedelta(minutes=1)).isoformat(),
        "duration_seconds": 60,
        "outcome": "no_answer",
        "sentiment": "neutral"
    },
    {
        "user_id": test_user_id,
        "customer_phone": "+1-555-0105",
        "customer_name": "Eve Davis",
        "started_at": (datetime.now() - timedelta(days=1)).isoformat(),
        "ended_at": (datetime.now() - timedelta(days=1) + timedelta(minutes=5)).isoformat(),
        "duration_seconds": 300,
        "outcome": "success",
        "booking_type": "appointment",
        "transcript": [{"role": "assistant", "content": "How can I help?"}, {"role": "user", "content": "Book a massage"}],
        "sentiment": "positive"
    }
]

for call in call_logs:
    try:
        result = supabase.table("call_logs").insert(call).execute()
        print(f"✅ Created call log: {call['customer_name']} - {call['outcome']}")
    except Exception as e:
        print(f"❌ Error creating call log for {call['customer_name']}: {e}")

print("\n✅ Seed data creation complete!")
print(f"Created {len(bookings)} bookings and {len(call_logs)} call logs")
