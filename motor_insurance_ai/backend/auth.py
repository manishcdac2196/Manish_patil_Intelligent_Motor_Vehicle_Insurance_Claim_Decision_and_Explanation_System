from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from pydantic import BaseModel

# Secret key for JWT. In production, this should be fetched from env vars!
SECRET_KEY = "CHANGE_ME_IN_PRODUCTION_SECRET_KEY_12345" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None

class UserAuth(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    role: Optional[str] = "user" # user or company
    company: Optional[str] = None # required if role is company

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
