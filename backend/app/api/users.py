import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import User, Contact
from app.schemas.user import UserSchema, UserUpdate, ContactSchema
from app.auth_utils import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    ext = os.path.splitext(file.filename)[1] or ".png"
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    avatar_url = f"/static/uploads/{filename}"
    return {"avatar_url": avatar_url}

@router.post("/attachment")
async def upload_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    ext = os.path.splitext(file.filename)[1] or ".bin"
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    media_url = f"/static/uploads/{filename}"
    is_image = (file.content_type and file.content_type.startswith("image/")) or ext.lower() in [".png", ".jpg", ".jpeg", ".gif", ".webp"]
    message_type = "image" if is_image else "file"

    return {
        "media_url": media_url,
        "filename": file.filename,
        "content_type": file.content_type,
        "message_type": message_type
    }


@router.get("/search", response_model=List[UserSchema])
async def search_users(
    q: str = Query(..., min_length=1, description="Search term for name, username, or phone"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    term = f"%{q.strip()}%"
    result = await db.execute(
        select(User).where(
            User.id != current_user.id,
            or_(
                User.display_name.ilike(term),
                User.username.ilike(term),
                User.phone.ilike(term)
            )
        )
    )
    users = result.scalars().all()
    return [UserSchema.model_validate(u) for u in users]

@router.put("/me", response_model=UserSchema)
async def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if payload.display_name:
        current_user.display_name = payload.display_name.strip()
    if payload.about is not None:
        current_user.about = payload.about.strip()
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    await db.commit()
    await db.refresh(current_user)
    return UserSchema.model_validate(current_user)

@router.get("/contacts", response_model=List[ContactSchema])
async def get_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Contact)
        .options(selectinload(Contact.contact_user))
        .where(Contact.user_id == current_user.id)
    )
    contacts = result.scalars().all()
    return [ContactSchema.model_validate(c) for c in contacts]


@router.post("/contacts/{contact_user_id}")
async def add_contact(
    contact_user_id: str,
    alias: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if contact_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a contact.")

    target = await db.execute(select(User).where(User.id == contact_user_id))
    if not target.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found.")

    existing = await db.execute(
        select(Contact).where(Contact.user_id == current_user.id, Contact.contact_user_id == contact_user_id)
    )
    if existing.scalar_one_or_none():
        return {"message": "Contact already added."}

    new_contact = Contact(user_id=current_user.id, contact_user_id=contact_user_id, alias=alias)
    db.add(new_contact)
    await db.commit()
    return {"message": "Contact added successfully."}
