from pydantic import BaseModel, Field
from typing import Optional
from app.schemas.user import UserSchema

class SendOTPRequest(BaseModel):
    phone_or_username: str = Field(..., description="Phone number (e.g., +15550101) or Username")

class VerifyOTPRequest(BaseModel):
    phone_or_username: str
    otp: str = Field(..., description="Fixed OTP: 123456")

class RegisterRequest(BaseModel):
    phone: str
    username: str
    display_name: str
    about: Optional[str] = "Hey there! I am using Signal."
    avatar_url: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional[UserSchema] = None
    is_new_user: bool = False
    message: str = "Success"
