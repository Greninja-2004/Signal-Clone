from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserSchema
from app.schemas.message import MessageSchema

class ConversationMemberSchema(BaseModel):
    id: str
    conversation_id: str
    user_id: str
    role: str
    joined_at: datetime
    last_read_message_id: Optional[str] = None
    user: Optional[UserSchema] = None

    class Config:
        from_attributes = True

class ConversationSchema(BaseModel):
    id: str
    type: str  # 'direct' | 'group'
    title: Optional[str] = None
    avatar_url: Optional[str] = None
    description: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    members: List[ConversationMemberSchema] = []
    last_message: Optional[MessageSchema] = None
    unread_count: int = 0
    peer: Optional[UserSchema] = None  # Populated for direct chats

    class Config:
        from_attributes = True

class CreateDirectConversationRequest(BaseModel):
    target_user_id: str

class CreateGroupConversationRequest(BaseModel):
    title: str
    member_user_ids: List[str]
    description: Optional[str] = None
    avatar_url: Optional[str] = None
