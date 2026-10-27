from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class AttendanceCheckIn(BaseModel):
    employee_id: int
    shift_type: Optional[str] = "MORNING"
    notes: Optional[str] = None


class AttendanceCheckOut(BaseModel):
    employee_id: int
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    work_hours: float = 0.0
    overtime_hours: float = 0.0
    status: str
    shift_type: str
    notes: Optional[str] = None
    employee_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
