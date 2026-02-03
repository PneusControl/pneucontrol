from app.core.secrets import secrets_manager
import asyncio

async def main():
    new_key = "re_P8X7HRhJ_EzH64MzyTzPxJdop3XGJtRCe"
    print(f"Updating RESEND_API_KEY...")
    
    # Check if exists
    try:
        secrets = await secrets_manager.list_secrets()
        exists = any(s['key'] == 'RESEND_API_KEY' for s in secrets)
        
        if exists:
            # Update using direct supabase client since secrets_manager.set_secret might be failing on upsert
            from app.core.config import get_settings
            from supabase import create_client
            settings = get_settings()
            sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            
            encrypted_value = secrets_manager.encrypt(new_key)
            
            sb.table("system_config").update({
                "value": encrypted_value,
                "description": "API Key Resend para e-mails (trax.app.br)",
                "is_encrypted": True,
                "updated_at": "now()"
            }).eq("key", "RESEND_API_KEY").execute()
            print("RESEND_API_KEY updated via direct UPDATE.")
        else:
            await secrets_manager.set_secret(
                key="RESEND_API_KEY",
                value=new_key,
                description="API Key Resend para e-mails (trax.app.br)",
                encrypt=True
            )
            print("RESEND_API_KEY created.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
