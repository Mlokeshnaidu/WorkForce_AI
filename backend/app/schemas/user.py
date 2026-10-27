from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.user import UserRole


class UserBase(BaseModel):
    email: str
    full_name: str


class UserCreate(UserBase):
    password: str
    role: Optional[UserRole] = UserRole.EMPLOYEE


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    email: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
