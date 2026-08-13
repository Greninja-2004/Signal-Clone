import json
import jwt
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.config import settings
from app.db.session import AsyncSessionLocal
from app.db.models import User, Conversation, ConversationMember, Message, MessageReceipt
from app.schemas.message import MessageSchema
from app.schemas.user import UserSchema
from app.websocket.manager import manager

router = APIRouter(tags=["WebSocket"])

async def get_user_from_token(token: str, db: AsyncSession) -> User:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    except Exception:
        return None

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    if not token:
        await websocket.close(code=1008)
        return

    async with AsyncSessionLocal() as db:
        user = await get_user_from_token(token, db)
        if not user:
            await websocket.close(code=1008)
            return

        user_id = user.id

        # Update online status
        user.is_online = True
        await db.commit()

        await manager.connect(user_id, websocket)

        # Broadcast presence
        await manager.broadcast_to_users(
            list(manager.active_connections.keys()),
            {
                "event": "presence:update",
                "data": {"user_id": user_id, "is_online": True, "last_seen": datetime.now(timezone.utc).isoformat()}
            }
        )

        try:
            while True:
                data_text = await websocket.receive_text()
                try:
                    payload = json.loads(data_text)
                    event_type = payload.get("event")
                    data = payload.get("data", {})
                except Exception:
                    continue

                if event_type == "message:send":
                    conv_id = data.get("conversation_id")
                    content = data.get("content", "").strip()
                    message_type = data.get("message_type", "text")
                    media_url = data.get("media_url")
                    reply_to_id = data.get("reply_to_id")

                    if not conv_id or (not content and not media_url):
                        continue
                    if not content and media_url:
                        content = "📷 Photo" if message_type == "image" else "📎 Attachment"


                    # Verify membership
                    mem_res = await db.execute(
                        select(ConversationMember).where(
                            ConversationMember.conversation_id == conv_id,
                            ConversationMember.user_id == user_id
                        )
                    )
                    if not mem_res.scalar_one_or_none():
                        continue

                    # Create message
                    new_msg = Message(
                        conversation_id=conv_id,
                        sender_id=user_id,
                        content=content,
                        message_type=message_type,
                        media_url=media_url,
                        reply_to_id=reply_to_id
                    )
                    db.add(new_msg)

                    # Update conversation timestamp
                    conv_res = await db.execute(select(Conversation).where(Conversation.id == conv_id))
                    conv = conv_res.scalar_one_or_none()
                    if conv:
                        conv.updated_at = datetime.now(timezone.utc)

                    await db.flush()

                    # Find all conversation participants
                    all_mems = await db.execute(
                        select(ConversationMember).where(ConversationMember.conversation_id == conv_id)
                    )
                    participant_ids = [m.user_id for m in all_mems.scalars().all()]

                    receipts_objs = []
                    for pid in participant_ids:
                        if pid != user_id:
                            # If recipient is online, status = delivered, else sent
                            is_recip_online = manager.is_online(pid)
                            status = "delivered" if is_recip_online else "sent"
                            rcpt = MessageReceipt(message_id=new_msg.id, user_id=pid, status=status)
                            db.add(rcpt)
                            receipts_objs.append(rcpt)

                    await db.commit()

                    # Load relationships for message schema
                    msg_res = await db.execute(
                        select(Message)
                        .options(
                            selectinload(Message.sender),
                            selectinload(Message.receipts),
                            selectinload(Message.reactions)
                        )
                        .where(Message.id == new_msg.id)
                    )
                    full_msg = msg_res.scalar_one()
                    msg_schema = MessageSchema.model_validate(full_msg).model_dump(mode="json")

                    # Broadcast to all conversation participants
                    await manager.broadcast_to_users(
                        participant_ids,
                        {
                            "event": "message:new",
                            "data": msg_schema
                        }
                    )

                elif event_type in ("typing:start", "typing:stop"):
                    conv_id = data.get("conversation_id")
                    if not conv_id:
                        continue

                    all_mems = await db.execute(
                        select(ConversationMember).where(ConversationMember.conversation_id == conv_id)
                    )
                    participant_ids = [m.user_id for m in all_mems.scalars().all()]
                    other_ids = [pid for pid in participant_ids if pid != user_id]

                    await manager.broadcast_to_users(
                        other_ids,
                        {
                            "event": "typing:status",
                            "data": {
                                "conversation_id": conv_id,
                                "user_id": user_id,
                                "is_typing": (event_type == "typing:start")
                            }
                        }
                    )

                elif event_type == "message:read":
                    conv_id = data.get("conversation_id")
                    msg_ids = data.get("message_ids", [])
                    if not conv_id or not msg_ids:
                        continue

                    updated_ids = []
                    for mid in msg_ids:
                        rcpt_res = await db.execute(
                            select(MessageReceipt).where(
                                MessageReceipt.message_id == mid,
                                MessageReceipt.user_id == user_id
                            )
                        )
                        rcpt = rcpt_res.scalar_one_or_none()
                        if rcpt:
                            if rcpt.status != "read":
                                rcpt.status = "read"
                                rcpt.timestamp = datetime.now(timezone.utc)
                                updated_ids.append(mid)
                        else:
                            new_rcpt = MessageReceipt(
                                message_id=mid,
                                user_id=user_id,
                                status="read",
                                timestamp=datetime.now(timezone.utc)
                            )
                            db.add(new_rcpt)
                            updated_ids.append(mid)

                    if updated_ids:
                        await db.commit()


                        # Get all conversation participants to notify sender
                        all_mems = await db.execute(
                            select(ConversationMember).where(ConversationMember.conversation_id == conv_id)
                        )
                        participant_ids = [m.user_id for m in all_mems.scalars().all()]

                        await manager.broadcast_to_users(
                            participant_ids,
                            {
                                "event": "receipt:update",
                                "data": {
                                    "conversation_id": conv_id,
                                    "user_id": user_id,
                                    "message_ids": updated_ids,
                                    "status": "read"
                                }
                            }
                        )

        except WebSocketDisconnect:
            pass
        finally:
            manager.disconnect(user_id, websocket)

            # Check if user has no other open sockets
            if not manager.is_online(user_id):
                user.is_online = False
                user.last_seen = datetime.now(timezone.utc)
                await db.commit()

                await manager.broadcast_to_users(
                    list(manager.active_connections.keys()),
                    {
                        "event": "presence:update",
                        "data": {
                            "user_id": user_id,
                            "is_online": False,
                            "last_seen": user.last_seen.isoformat()
                        }
                    }
                )
