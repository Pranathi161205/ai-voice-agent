import bcrypt
from jose import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"


def hash_password(password: str):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str):
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_token(email: str):
    payload = {
        "sub": email,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)


def decode_token(token: str):
    return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])