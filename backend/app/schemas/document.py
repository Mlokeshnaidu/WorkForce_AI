from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DocumentCreate(BaseModel):
    employee_id: int
    title: str
    document_type: Optional[str] = "CONTRACT"
    file_name: str
    file_url: str
    file_size_kb: Optional[float] = 0.0


class DocumentResponse(BaseModel):
    id: int
    employee_id: int
    title: str
    document_type: str
    file_name: str
    file_url: str
    file_size_kb: float
    uploaded_at: Optional[datetime] = None
    employee_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
