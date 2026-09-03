from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

import os

# SECRET_KEY should always be in .env for production.
# We fallback to a default string ONLY to prevent the hackathon demo from crashing if the .env is misconfigured.
SECRET_KEY = os.getenv("JWT_SECRET", "naksha_sih_hackathon_super_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.username == request.username).first()
        if not user or not verify_password(request.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect username or password")

        access_token = create_access_token(
            data={"sub": user.username, "state": user.state_jurisdiction, "role": user.role}
        )
        return {"access_token": access_token, "token_type": "bearer", "state_jurisdiction": user.state_jurisdiction}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreateUserRequest(BaseModel):
    state_jurisdiction: str
    first_name: str
    dob_ddmmyyyy: str

@router.post("/admin/create_user")
def create_new_officer(req: CreateUserRequest, db: Session = Depends(get_db)):
    """
    ADMIN ENDPOINT: Generates a new officer identity for a specific state.
    Creates their specialized username, password, and BitLocker recovery key.
    """
    import random, string
    username = f"{req.first_name.lower()}{req.dob_ddmmyyyy}"
    
    # Generate Password: <State2><3Digits><3Letters>
    prefix = req.state_jurisdiction[:2].upper()
    digits = ''.join(random.choices(string.digits, k=3))
    letters = ''.join(random.choices(string.ascii_lowercase, k=3))
    password = f"{prefix}{digits}{letters}"
    
    # Generate 15-char Passkey
    parts = [''.join(random.choices(string.ascii_uppercase + string.digits, k=5)) for _ in range(3)]
    passkey = "-".join(parts)
    
    # Check if user already exists
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="User already exists.")
        
    new_user = models.User(
        username=username,
        hashed_password=get_password_hash(password),
        passkey=passkey,
        state_jurisdiction=req.state_jurisdiction,
        role="Officer"
    )
    db.add(new_user)
    db.commit()
    
    return {
        "message": "Officer Identity Created Successfully",
        "credentials": {
            "username": username,
            "password": password,
            "passkey": passkey,
            "state": req.state_jurisdiction
        }
    }

from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

class ResetPasswordRequest(BaseModel):
    passkey: str
    new_password: str

@router.post("/reset_password")
def reset_password(req: ResetPasswordRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    OFFICER ENDPOINT: Self-Service Password Reset.
    Requires the officer to be logged in (JWT) AND provide their 15-char Passkey.
    """
    if current_user.passkey != req.passkey:
        raise HTTPException(status_code=403, detail="Invalid Passkey. Cryptographic verification failed.")
        
    # If passkey matches, update password
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    
    return {"message": "Password successfully reset via Passkey Verification."}
