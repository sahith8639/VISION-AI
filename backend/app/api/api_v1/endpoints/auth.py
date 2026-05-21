from datetime import timedelta, datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core import security
from app.core.config import settings
from app.db.mongodb import get_database
from app.schemas.user import UserCreate, Token, User
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()

@router.post("/register", response_model=User)
async def register(
    user_in: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    user = await db["users"].find_one({"email": user_in.email})
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    if hasattr(user_in, "model_dump"):
        user_dict = user_in.model_dump()
    else:
        user_dict = user_in.dict()
    user_dict["hashed_password"] = security.get_password_hash(user_dict.pop("password"))

    new_user = await db["users"].insert_one(user_dict)
    user_id = str(new_user.inserted_id)
    user_dict["_id"] = user_id
    
    # Add to specific role collections
    profile_data = {
        "user_id": user_id,
        "email": user_in.email,
        "full_name": user_in.full_name,
        "created_at": datetime.utcnow()
    }
    
    if user_in.role == "student":
        await db["students"].insert_one(profile_data)
    elif user_in.role == "teacher":
        await db["teachers"].insert_one(profile_data)

    return user_dict

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Any:
    user = await db["users"].find_one({"email": form_data.username})
    if not user or not security.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user["email"], expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "role": user["role"]
    }
