from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class LeaveCreate(BaseModel):
    employee_id: int
    leave_type: str = "ANNUAL"
    start_date: date
    end_date: date
    days_count: float = 1.0
    reason: str


class LeaveReview(BaseModel):
    status: str  # APPROVED or REJECTED
    review_notes: Optional[str] = None


class LeaveResponse(BaseModel):
    id: int
    employee_id: int
    leave_type: str
    start_date: date
    end_date: date
    days_count: float
    reason: str
    status: str
    reviewed_by: Optional[int] = None
    review_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    employee_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
