from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.chat import ChatMessage
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse

router = APIRouter(prefix="/chats", tags=["One-to-One Communication & Chat (Module 8)"])


@router.post("/", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a direct message to a colleague or manager."""
    recipient = db.query(User).filter(User.id == data.receiver_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user not found")

    msg = ChatMessage(
        sender_id=current_user.id,
        receiver_id=data.receiver_id,
        message=data.message,
        is_read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return ChatMessageResponse(
        id=msg.id,
        sender_id=msg.sender_id,
        receiver_id=msg.receiver_id,
        message=msg.message,
        is_read=msg.is_read,
        created_at=msg.created_at,
        sender_name=current_user.full_name,
        receiver_name=recipient.full_name
    )


@router.get("/conversation/{other_user_id}", response_model=List[ChatMessageResponse])
def get_conversation(
    other_user_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get full message exchange between authenticated user and another user."""
    other_user = db.query(User).filter(User.id == other_user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Mark unread messages as read
    db.query(ChatMessage).filter(
        ChatMessage.sender_id == other_user_id,
        ChatMessage.receiver_id == current_user.id,
        ChatMessage.is_read == False
    ).update({"is_read": True})
    db.commit()

    messages = db.query(ChatMessage).filter(
        or_(
            and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == other_user_id),
            and_(ChatMessage.sender_id == other_user_id, ChatMessage.receiver_id == current_user.id)
        )
    ).order_by(ChatMessage.created_at.asc()).offset(skip).limit(limit).all()

    results = []
    for m in messages:
        sender_name = current_user.full_name if m.sender_id == current_user.id else other_user.full_name
        receiver_name = other_user.full_name if m.sender_id == current_user.id else current_user.full_name
        results.append(ChatMessageResponse(
            id=m.id,
            sender_id=m.sender_id,
            receiver_id=m.receiver_id,
            message=m.message,
            is_read=m.is_read,
            created_at=m.created_at,
            sender_name=sender_name,
            receiver_name=receiver_name
        ))
    return results


@router.get("/contacts")
def get_chat_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List colleagues with unread message counts for quick direct messaging."""
    all_users = db.query(User).filter(User.id != current_user.id, User.is_active == True).all()
    contacts = []
    for u in all_users:
        unread = db.query(ChatMessage).filter(
            ChatMessage.sender_id == u.id,
            ChatMessage.receiver_id == current_user.id,
            ChatMessage.is_read == False
        ).count()
        last_msg = db.query(ChatMessage).filter(
            or_(
                and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == u.id),
                and_(ChatMessage.sender_id == u.id, ChatMessage.receiver_id == current_user.id)
            )
        ).order_by(ChatMessage.created_at.desc()).first()

        contacts.append({
            "user_id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role.value,
            "unread_count": unread,
            "last_message": last_msg.message if last_msg else None,
            "last_message_time": last_msg.created_at.isoformat() if last_msg else None
        })
    return contacts
