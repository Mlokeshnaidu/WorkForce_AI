from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    type: Optional[str] = "INFO"


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
