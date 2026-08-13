from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from app.db.session import get_db
from app.db.models import User
from app.schemas.auth import SendOTPRequest, VerifyOTPRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserSchema
from app.auth_utils import create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/send-otp")
async def send_otp(payload: SendOTPRequest, db: AsyncSession = Depends(get_db)):
    input_str = payload.phone_or_username.strip()
    if not input_str:
        raise HTTPException(status_code=400, detail="Phone number or username is required.")

    # Check if user already exists
    result = await db.execute(
        select(User).where(or_(User.phone == input_str, User.username == input_str))
    )
    user = result.scalar_one_or_none()

    return {
        "status": "success",
        "message": f"OTP sent to {input_str}",
        "fixed_otp": settings.FIXED_OTP,
        "is_registered": user is not None
    }

@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(payload: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    if payload.otp != settings.FIXED_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Use fixed OTP '123456'.")

    input_str = payload.phone_or_username.strip()
    result = await db.execute(
        select(User).where(or_(User.phone == input_str, User.username == input_str))
    )
    user = result.scalar_one_or_none()

    if not user:
        return TokenResponse(
            access_token=None,
            user=None,
            is_new_user=True,
            message="OTP verified. User registration required."
        )

    # Existing user -> generate token
    token = create_access_token(user_id=user.id)
    return TokenResponse(
        access_token=token,
        user=UserSchema.model_validate(user),
        is_new_user=False,
        message="Login successful"
    )

@router.post("/register", response_model=TokenResponse)
async def register_user(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    phone = payload.phone.strip()
    username = payload.username.strip().lower()

    # Check if phone or username already taken
    existing_phone = await db.execute(select(User).where(User.phone == phone))
    if existing_phone.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number is already registered.")

    existing_username = await db.execute(select(User).where(User.username == username))
    if existing_username.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username is already taken.")

    # Create new user
    new_user = User(
        phone=phone,
        username=username,
        display_name=payload.display_name.strip(),
        about=payload.about or "Hey there! I am using Signal.",
        avatar_url=payload.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}",
        is_online=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(user_id=new_user.id)
    return TokenResponse(
        access_token=token,
        user=UserSchema.model_validate(new_user),
        is_new_user=False,
        message="Registration successful"
    )

@router.get("/me", response_model=UserSchema)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserSchema.model_validate(current_user)
