from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ChatMessageCreate(BaseModel):
    receiver_id: int
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    message: str
    is_read: bool
    created_at: Optional[datetime] = None
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
