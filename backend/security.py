import os
import base64
import bcrypt
import datetime
from jose import jwt, JWTError
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-for-jwt-signing-000000000000000000000000")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 12

def hash_password(password: str) -> str:
    # bcrypt requires bytes
    salt = bcrypt.gensalt(12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

# AES-256-GCM note encryption helper
def get_aes_gcm():
    key_str = os.getenv("NOTES_ENCRYPTION_KEY", "default-32-byte-key-for-dev-only-0000")
    # Ensure key is exactly 32 bytes for AES-256
    key_bytes = key_str.encode('utf-8')
    if len(key_bytes) < 32:
        key_bytes = key_bytes.ljust(32, b"0")
    elif len(key_bytes) > 32:
        key_bytes = key_bytes[:32]
    return AESGCM(key_bytes)

def encrypt_note(content: str) -> str:
    try:
        aesgcm = get_aes_gcm()
        nonce = os.urandom(12) # GCM standard nonce is 12 bytes
        encrypted_bytes = aesgcm.encrypt(nonce, content.encode('utf-8'), None)
        # Prepend nonce to the ciphertext
        combined = nonce + encrypted_bytes
        return base64.b64encode(combined).decode('utf-8')
    except Exception as e:
        raise ValueError(f"Encryption failed: {str(e)}")

def decrypt_note(encrypted_str: str) -> str:
    try:
        combined = base64.b64decode(encrypted_str.encode('utf-8'))
        if len(combined) < 12:
            raise ValueError("Invalid encrypted content length")
        nonce = combined[:12]
        ciphertext = combined[12:]
        aesgcm = get_aes_gcm()
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted_bytes.decode('utf-8')
    except Exception as e:
        return f"[Decryption Error: Check NOTES_ENCRYPTION_KEY or data corruption] {str(e)}"

def generate_cloudinary_signature(params: dict, api_secret: str) -> str:
    import hashlib
    # Exclude standard non-sign parameters
    params_to_sign = {k: v for k, v in params.items() if k not in ["signature", "file", "api_key"]}
    sorted_params = sorted(params_to_sign.items())
    param_str = "&".join(f"{k}={v}" for k, v in sorted_params)
    to_sign = f"{param_str}{api_secret}"
    return hashlib.sha1(to_sign.encode("utf-8")).hexdigest()

