import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

PASSWORD_HASH_ITERATIONS = 600_000
JWT_ALGORITHM = "HS256"

jwt_secret_key = os.getenv("JWT_SECRET_KEY")
if not jwt_secret_key or len(jwt_secret_key) < 32:
    raise RuntimeError("JWT_SECRET_KEY must be set to a secret of at least 32 characters.")

access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
if access_token_expire_minutes < 1:
    raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be a positive integer.")


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), PASSWORD_HASH_ITERATIONS
    )
    return f"pbkdf2_sha256${PASSWORD_HASH_ITERATIONS}${salt}${password_hash.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected_hash = stored_hash.split("$")
        if algorithm != "pbkdf2_sha256" or int(iterations) != PASSWORD_HASH_ITERATIONS:
            return False
        password_hash = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt), PASSWORD_HASH_ITERATIONS
        )
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(password_hash.hex(), expected_hash)


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=access_token_expire_minutes)
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at},
        jwt_secret_key,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> int:
    payload = jwt.decode(token, jwt_secret_key, algorithms=[JWT_ALGORITHM])
    subject = payload.get("sub")
    if not isinstance(subject, str):
        raise jwt.InvalidTokenError("Token subject is invalid.")
    try:
        return int(subject)
    except ValueError as exc:
        raise jwt.InvalidTokenError("Token subject is invalid.") from exc
