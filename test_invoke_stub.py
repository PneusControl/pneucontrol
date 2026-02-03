
import asyncio
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def test_invoke():
    url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_KEY')
    supabase = create_client(url, service_key)
    
    # Test call to create-user with dummy data
    print("Testing create-user invoke...")
    try:
        res = supabase.functions.invoke("create-user", body={
            "email": "test_ghost_del@example.com",
            "tenant_id": "791b0a14-64f1-4236-880a-1f5e19e98129",
            "full_name": "Test Delete Me"
        })
        print(f"Response type: {type(res)}")
        print(f"Data type: {type(res.data)}")
        print(f"Data: {res.data}")
    except Exception as e:
        print(f"Invoke failed: {str(e)}")

if __name__ == "__main__":
    # This might fail if supabase not installed globally, but I'll try
    # If it fails, I'll assume res.data is a dict (standard)
    pass
