from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    phone: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    about: Optional[str] = "Hey there! I am using Signal."

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    about: Optional[str] = None
    avatar_url: Optional[str] = None

class UserSchema(UserBase):
    id: str
    is_online: bool = False
    last_seen: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class ContactSchema(BaseModel):
    id: str
    contact_user: UserSchema
    alias: Optional[str] = None

    class Config:
        from_attributes = True
