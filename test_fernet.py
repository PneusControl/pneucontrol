
from cryptography.fernet import Fernet

key = "8cXIFO56Ph_0Rnr08pmroW1CuiVO2mT-EPpqnNj85q8="
encrypted_value = "gAAAAABpggZAzM95-IYzjFpshReG7bU_tyIDqnlPOpnyRPjQ15Otl4Hmk9nlJ-vWPseZ0hyLMP-I9Qw-_MjII1TLwgye8AxFpn4fVQolfxSM5fieCfk_h-Gijr11j5NPeVx7NrOs6-sX"

try:
    cipher = Fernet(key.encode())
    decrypted = cipher.decrypt(encrypted_value.encode()).decode()
    print(f"Success! Decrypted value: {decrypted}")
except Exception as e:
    print(f"FAILED: {str(e)}")
