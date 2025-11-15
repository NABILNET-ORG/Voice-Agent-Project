import os
from supabase import create_client, Client

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("ERROR: Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(url, key)

# Check business_config table
print("=== CHECKING BUSINESS_CONFIG TABLE ===")
response = supabase.table('business_config').select('*').execute()
print(f"Found {len(response.data)} business configs")

if len(response.data) > 0:
    config = response.data[0]
    print(f"\nBusiness Config ID: {config.get('id')}")
    print(f"User ID: {config.get('user_id')}")
    print(f"Business Name: {config.get('business_name')}")
    
    services = config.get('services', [])
    print(f"\n✅ SERVICES FOUND: {len(services)} services")
    
    if len(services) > 0:
        print("\nServices list:")
        for i, svc in enumerate(services[:5], 1):
            print(f"  {i}. {svc.get('name')} - ${svc.get('price')}")
        if len(services) > 5:
            print(f"  ... and {len(services) - 5} more")
    else:
        print("  ⚠️  No services in database")
        
    # Check other fields
    if config.get('business_type'):
        print(f"\nBusiness Type: {config.get('business_type')}")
    if config.get('business_phone'):
        print(f"Phone: {config.get('business_phone')}")
else:
    print("⚠️  NO BUSINESS CONFIG FOUND")

# Check knowledge sources
print("\n=== CHECKING KNOWLEDGE_SOURCES TABLE ===")
kb_response = supabase.table('knowledge_sources').select('id, title, url').execute()
print(f"Found {len(kb_response.data)} knowledge sources")

if len(kb_response.data) > 0:
    for i, src in enumerate(kb_response.data[:5], 1):
        print(f"  {i}. {src.get('title')}")
    if len(kb_response.data) > 5:
        print(f"  ... and {len(kb_response.data) - 5} more")

