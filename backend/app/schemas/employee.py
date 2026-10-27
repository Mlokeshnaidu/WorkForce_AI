from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    job_title: str
    salary: float
    department_id: int
    status: Optional[str] = "ACTIVE"

    # AI Attrition Predictor Metrics
    satisfaction_level: Optional[float] = 0.70
    last_evaluation: Optional[float] = 0.75
    number_of_projects: Optional[int] = 3
    average_monthly_hours: Optional[int] = 180
    time_spent_company: Optional[int] = 3
    work_accident: Optional[int] = 0
    promotion_last_5years: Optional[int] = 0


class EmployeeCreate(EmployeeBase):
    user_id: Optional[int] = None
    hire_date: Optional[date] = None


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    salary: Optional[float] = None
    department_id: Optional[int] = None
    status: Optional[str] = None
    satisfaction_level: Optional[float] = None
    last_evaluation: Optional[float] = None
    number_of_projects: Optional[int] = None
    average_monthly_hours: Optional[int] = None
    time_spent_company: Optional[int] = None
    work_accident: Optional[int] = None
    promotion_last_5years: Optional[int] = None


class EmployeeResponse(EmployeeBase):
    id: int
    user_id: Optional[int] = None
    hire_date: Optional[date] = None
    current_risk_score: float = 0.15
    risk_level: str = "LOW"
    department_name: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
