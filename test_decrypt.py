
import asyncio
import os
from cryptography.fernet import Fernet
from supabase import create_client
from dotenv import load_dotenv

# Carrega .env do backend
load_dotenv('backend/.env')

async def test_decrypt():
    key = os.getenv('ENCRYPTION_KEY')
    url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    print(f"Key: {key}")
    print(f"URL: {url}")
    
    cipher = Fernet(key.encode())
    supabase = create_client(url, service_key)
    
    res = supabase.table("system_config").select("*").eq("key", "RESEND_API_KEY").single().execute()
    if not res.data:
        print("RESEND_API_KEY not found")
        return
        
    encrypted_value = res.data['value']
    print(f"Encrypted Value: {encrypted_value[:20]}...")
    
    try:
        decrypted = cipher.decrypt(encrypted_value.encode()).decode()
        print(f"Success! Decrypted value: {decrypted[:5]}...")
        if decrypted.startswith('re_'):
            print("API Key format looks correct (re_...)")
        else:
            print("WARNING: API Key format might be wrong")
    except Exception as e:
        print(f"FAILED to decrypt: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_decrypt())
