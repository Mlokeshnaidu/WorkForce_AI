from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PayrollGenerate(BaseModel):
    month: int
    year: int


class PayrollUpdateStatus(BaseModel):
    status: str
    payment_date: Optional[date] = None


class PayrollResponse(BaseModel):
    id: int
    employee_id: int
    month: int
    year: int
    base_salary: float
    allowances: float
    bonuses: float
    tax_deductions: float
    net_salary: float
    status: str
    payment_date: Optional[date] = None
    created_at: Optional[datetime] = None
    employee_name: Optional[str] = None
    job_title: Optional[str] = None
    department_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
