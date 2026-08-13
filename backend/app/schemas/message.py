from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserSchema

class MessageReceiptSchema(BaseModel):
    id: str
    message_id: str
    user_id: str
    status: str # 'sent', 'delivered', 'read'
    timestamp: datetime

    class Config:
        from_attributes = True

class MessageReactionSchema(BaseModel):
    id: str
    message_id: str
    user_id: str
    emoji: str
    created_at: datetime

    class Config:
        from_attributes = True

class MessageSchema(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    content: str
    message_type: str = "text" # 'text', 'image', 'file', 'system'
    media_url: Optional[str] = None
    reply_to_id: Optional[str] = None
    is_deleted: bool = False
    created_at: datetime
    sender: Optional[UserSchema] = None
    receipts: List[MessageReceiptSchema] = []
    reactions: List[MessageReactionSchema] = []

    class Config:
        from_attributes = True

class CreateMessageRequest(BaseModel):
    conversation_id: str
    content: str
    message_type: str = "text"
    media_url: Optional[str] = None
    reply_to_id: Optional[str] = None
