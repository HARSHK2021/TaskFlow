from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from app.database.connection import get_database
from app.schemas.schemas import UserRegister, UserLogin, GoogleLogin, TokenResponse, UserResponse
from app.authentication.auth_handler import get_password_hash, verify_password, create_access_token

router = APIRouter()

def user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        avatar=user.get("avatar"),
        createdAt=user.get("createdAt", datetime.utcnow()),
        level=user.get("level", 1),
        xp=user.get("xp", 0),
        totalCompleted=user.get("totalCompleted", 0),
        currentStreak=user.get("currentStreak", 0),
        bestStreak=user.get("bestStreak", 0),
        badges=user.get("badges", [])
    )

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    db = get_database()
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password": get_password_hash(user_data.password),
        "avatar": None,
        "googleId": None,
        "level": 1,
        "xp": 0,
        "totalCompleted": 0,
        "currentStreak": 0,
        "bestStreak": 0,
        "badges": [],
        "settings": {"theme": "dark", "timezone": "UTC"},
        "createdAt": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    
    token = create_access_token({"sub": str(result.inserted_id)})
    return TokenResponse(access_token=token, user=user_to_response(user_doc))

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_database()
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(access_token=token, user=user_to_response(user))

@router.post("/google-login", response_model=TokenResponse)
async def google_login(google_data: GoogleLogin):
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from app.config import settings
    
    try:
        idinfo = id_token.verify_oauth2_token(
            google_data.token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except Exception as e:
        print(f"Google OAuth verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token")
    
    db = get_database()
    email = idinfo["email"]
    user = await db.users.find_one({"email": email})
    
    if not user:
        user_doc = {
            "name": idinfo.get("name", email.split("@")[0]),
            "email": email,
            "password": None,
            "avatar": idinfo.get("picture"),
            "googleId": idinfo["sub"],
            "level": 1, "xp": 0, "totalCompleted": 0,
            "currentStreak": 0, "bestStreak": 0, "badges": [],
            "settings": {"theme": "dark", "timezone": "UTC"},
            "createdAt": datetime.utcnow()
        }
        result = await db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        user = user_doc
    
    token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(access_token=token, user=user_to_response(user))
