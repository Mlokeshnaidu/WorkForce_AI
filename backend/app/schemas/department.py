from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None


class DepartmentResponse(DepartmentBase):
    id: int
    created_at: Optional[datetime] = None
    employee_count: int = 0

    model_config = ConfigDict(from_attributes=True)
