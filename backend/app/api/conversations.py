from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, desc, func
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.db.models import User, Conversation, ConversationMember, Message, MessageReceipt
from app.schemas.conversation import (
    ConversationSchema,
    ConversationMemberSchema,
    CreateDirectConversationRequest,
    CreateGroupConversationRequest,
)
from app.schemas.message import MessageSchema
from app.schemas.user import UserSchema
from app.auth_utils import get_current_user
from app.websocket.manager import manager

router = APIRouter(prefix="/conversations", tags=["Conversations"])

class AddGroupMembersRequest(BaseModel):
    user_ids: List[str]

class UpdateMemberRoleRequest(BaseModel):
    role: str # 'admin' or 'member'

@router.get("", response_model=List[ConversationSchema])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    memberships = await db.execute(
        select(ConversationMember).where(ConversationMember.user_id == current_user.id)
    )
    user_memberships = {m.conversation_id: m for m in memberships.scalars().all()}
    
    if not user_memberships:
        return []

    conv_ids = list(user_memberships.keys())

    result = await db.execute(
        select(Conversation)
        .options(
            selectinload(Conversation.members).selectinload(ConversationMember.user)
        )
        .where(Conversation.id.in_(conv_ids))
        .order_by(desc(Conversation.updated_at))
    )
    conversations = result.scalars().all()

    response_list = []
    for conv in conversations:
        last_msg_res = await db.execute(
            select(Message)
            .options(
                selectinload(Message.sender),
                selectinload(Message.receipts),
                selectinload(Message.reactions)
            )
            .where(Message.conversation_id == conv.id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        last_msg = last_msg_res.scalar_one_or_none()

        unread_count = 0
        if last_msg:
            msg_res = await db.execute(
                select(Message)
                .where(
                    Message.conversation_id == conv.id,
                    Message.sender_id != current_user.id
                )
            )
            other_msgs = msg_res.scalars().all()
            for m in other_msgs:
                rcpt_res = await db.execute(
                    select(MessageReceipt).where(
                        MessageReceipt.message_id == m.id,
                        MessageReceipt.user_id == current_user.id,
                        MessageReceipt.status == "read"
                    )
                )
                if not rcpt_res.scalar_one_or_none():
                    unread_count += 1

        peer_user = None
        if conv.type == "direct":
            for m in conv.members:
                if m.user_id != current_user.id:
                    peer_user = UserSchema.model_validate(m.user) if m.user else None
                    break

        conv_dict = {
            "id": conv.id,
            "type": conv.type,
            "title": conv.title,
            "avatar_url": conv.avatar_url,
            "description": conv.description,
            "created_by": conv.created_by,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "members": [
                ConversationMemberSchema(
                    id=m.id,
                    conversation_id=m.conversation_id,
                    user_id=m.user_id,
                    role=m.role,
                    joined_at=m.joined_at,
                    last_read_message_id=m.last_read_message_id,
                    user=UserSchema.model_validate(m.user) if m.user else None
                ) for m in conv.members
            ],
            "last_message": MessageSchema.model_validate(last_msg) if last_msg else None,
            "unread_count": unread_count,
            "peer": peer_user
        }
        response_list.append(ConversationSchema(**conv_dict))

    response_list.sort(
        key=lambda c: c.last_message.created_at if c.last_message else c.updated_at,
        reverse=True
    )
    return response_list

@router.post("/direct", response_model=ConversationSchema)
async def create_or_get_direct_conversation(
    payload: CreateDirectConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    target_id = payload.target_user_id
    if target_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot start a direct conversation with yourself.")

    target_res = await db.execute(select(User).where(User.id == target_id))
    target_user = target_res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")

    stmt = (
        select(Conversation)
        .join(ConversationMember, Conversation.id == ConversationMember.conversation_id)
        .where(Conversation.type == "direct")
        .where(ConversationMember.user_id.in_([current_user.id, target_id]))
        .group_by(Conversation.id)
        .having(func.count(ConversationMember.user_id) == 2)
    )
    existing_res = await db.execute(stmt)
    existing_conv = existing_res.scalar_one_or_none()

    if existing_conv:
        full_res = await db.execute(
            select(Conversation)
            .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
            .where(Conversation.id == existing_conv.id)
        )
        conv = full_res.scalar_one()
        return ConversationSchema(
            id=conv.id,
            type=conv.type,
            title=conv.title,
            avatar_url=conv.avatar_url,
            description=conv.description,
            created_by=conv.created_by,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            members=[
                ConversationMemberSchema(
                    id=m.id, conversation_id=m.conversation_id, user_id=m.user_id, role=m.role, joined_at=m.joined_at,
                    user=UserSchema.model_validate(m.user) if m.user else None
                ) for m in conv.members
            ],
            peer=UserSchema.model_validate(target_user),
            unread_count=0
        )

    new_conv = Conversation(type="direct", created_by=current_user.id)
    db.add(new_conv)
    await db.flush()

    m1 = ConversationMember(conversation_id=new_conv.id, user_id=current_user.id, role="member")
    m2 = ConversationMember(conversation_id=new_conv.id, user_id=target_id, role="member")
    db.add_all([m1, m2])
    await db.commit()

    full_res = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        .where(Conversation.id == new_conv.id)
    )
    conv = full_res.scalar_one()
    return ConversationSchema(
        id=conv.id,
        type=conv.type,
        title=conv.title,
        avatar_url=conv.avatar_url,
        description=conv.description,
        created_by=conv.created_by,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        members=[
            ConversationMemberSchema(
                id=m.id, conversation_id=m.conversation_id, user_id=m.user_id, role=m.role, joined_at=m.joined_at,
                user=UserSchema.model_validate(m.user) if m.user else None
            ) for m in conv.members
        ],
        peer=UserSchema.model_validate(target_user),
        unread_count=0
    )

@router.post("/group", response_model=ConversationSchema)
async def create_group_conversation(
    payload: CreateGroupConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Group title is required.")

    member_ids = set(payload.member_user_ids)
    member_ids.add(current_user.id)

    new_conv = Conversation(
        type="group",
        title=payload.title.strip(),
        avatar_url=payload.avatar_url or f"https://api.dicebear.com/7.x/identicon/svg?seed={payload.title}",
        description=payload.description,
        created_by=current_user.id
    )
    db.add(new_conv)
    await db.flush()

    for uid in member_ids:
        role = "admin" if uid == current_user.id else "member"
        db.add(ConversationMember(conversation_id=new_conv.id, user_id=uid, role=role))

    system_msg = Message(
        conversation_id=new_conv.id,
        sender_id=current_user.id,
        content=f"{current_user.display_name} created group '{new_conv.title}'",
        message_type="system"
    )
    db.add(system_msg)
    await db.commit()

    full_msg_res = await db.execute(
        select(Message)
        .options(
            selectinload(Message.sender),
            selectinload(Message.receipts),
            selectinload(Message.reactions)
        )
        .where(Message.id == system_msg.id)
    )
    full_system_msg = full_msg_res.scalar_one()

    full_res = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.members).selectinload(ConversationMember.user))
        .where(Conversation.id == new_conv.id)
    )
    conv = full_res.scalar_one()

    return ConversationSchema(
        id=conv.id,
        type=conv.type,
        title=conv.title,
        avatar_url=conv.avatar_url,
        description=conv.description,
        created_by=conv.created_by,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        members=[
            ConversationMemberSchema(
                id=m.id, conversation_id=m.conversation_id, user_id=m.user_id, role=m.role, joined_at=m.joined_at,
                user=UserSchema.model_validate(m.user) if m.user else None
            ) for m in conv.members
        ],
        last_message=MessageSchema.model_validate(full_system_msg),
        unread_count=0
    )


@router.post("/{conversation_id}/members")
async def add_group_members(
    conversation_id: str,
    payload: AddGroupMembersRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify current_user is an admin in this group
    mem_res = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id
        )
    )
    current_mem = mem_res.scalar_one_or_none()
    if not current_mem or current_mem.role != "admin":
        raise HTTPException(status_code=403, detail="Only group admins can add members.")

    conv_res = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = conv_res.scalar_one_or_none()
    if not conv or conv.type != "group":
        raise HTTPException(status_code=400, detail="Invalid group conversation.")

    added_names = []
    for uid in payload.user_ids:
        # Check if already member
        existing = await db.execute(
            select(ConversationMember).where(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id == uid
            )
        )
        if not existing.scalar_one_or_none():
            db.add(ConversationMember(conversation_id=conversation_id, user_id=uid, role="member"))
            target_user = await db.execute(select(User).where(User.id == uid))
            tu = target_user.scalar_one_or_none()
            if tu:
                added_names.append(tu.display_name)

    if added_names:
        names_str = ", ".join(added_names)
        system_msg = Message(
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=f"{current_user.display_name} added {names_str} to the group",
            message_type="system"
        )
        db.add(system_msg)
        conv.updated_at = datetime.now(timezone.utc)
        await db.commit()

        # Load relationships for message schema
        msg_res = await db.execute(
            select(Message)
            .options(
                selectinload(Message.sender),
                selectinload(Message.receipts),
                selectinload(Message.reactions)
            )
            .where(Message.id == system_msg.id)
        )
        full_msg = msg_res.scalar_one()
        msg_schema = MessageSchema.model_validate(full_msg).model_dump(mode="json")

        # Broadcast system message
        all_mems = await db.execute(select(ConversationMember.user_id).where(ConversationMember.conversation_id == conversation_id))
        all_uids = [row[0] for row in all_mems.all()]
        await manager.broadcast_to_users(all_uids, {"event": "message:new", "data": msg_schema})

    return {"message": f"Successfully added {len(added_names)} member(s)."}

@router.delete("/{conversation_id}/members/{target_user_id}")
async def remove_group_member(
    conversation_id: str,
    target_user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mem_res = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id
        )
    )
    current_mem = mem_res.scalar_one_or_none()
    if not current_mem:
        raise HTTPException(status_code=403, detail="You are not a member of this group.")

    # User leaving self OR current_user is admin
    if current_user.id != target_user_id and current_mem.role != "admin":
        raise HTTPException(status_code=403, detail="Only group admins can remove members.")

    target_mem_res = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == target_user_id
        )
    )
    target_mem = target_mem_res.scalar_one_or_none()
    if not target_mem:
        raise HTTPException(status_code=404, detail="Member not found in group.")

    target_user = await db.execute(select(User).where(User.id == target_user_id))
    tu = target_user.scalar_one_or_none()
    tu_name = tu.display_name if tu else "User"

    await db.delete(target_mem)

    if current_user.id == target_user_id:
        content_str = f"{tu_name} left the group"
    else:
        content_str = f"{current_user.display_name} removed {tu_name} from the group"

    system_msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=content_str,
        message_type="system"
    )
    db.add(system_msg)

    conv_res = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = conv_res.scalar_one_or_none()
    if conv:
        conv.updated_at = datetime.now(timezone.utc)

    await db.commit()

    # Load relationships for message schema
    msg_res = await db.execute(
        select(Message)
        .options(
            selectinload(Message.sender),
            selectinload(Message.receipts),
            selectinload(Message.reactions)
        )
        .where(Message.id == system_msg.id)
    )
    full_msg = msg_res.scalar_one()
    msg_schema = MessageSchema.model_validate(full_msg).model_dump(mode="json")

    all_mems = await db.execute(select(ConversationMember.user_id).where(ConversationMember.conversation_id == conversation_id))
    all_uids = [row[0] for row in all_mems.all()]
    all_uids.append(target_user_id) # Send event to target_user as well

    await manager.broadcast_to_users(all_uids, {"event": "message:new", "data": msg_schema})

    return {"message": f"Successfully removed {tu_name} from the group."}

@router.get("/{conversation_id}/messages", response_model=List[MessageSchema])
async def get_messages(
    conversation_id: str,
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    m_check = await db.execute(
        select(ConversationMember).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id
        )
    )
    if not m_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You are not a member of this conversation.")

    result = await db.execute(
        select(Message)
        .options(
            selectinload(Message.sender),
            selectinload(Message.receipts),
            selectinload(Message.reactions)
        )
        .where(Message.conversation_id == conversation_id)
        .order_by(desc(Message.created_at))
        .limit(limit)
    )
    msgs = result.scalars().all()
    return [MessageSchema.model_validate(m) for m in reversed(msgs)]
