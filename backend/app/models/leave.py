from datetime import date, datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class LeaveType(str):
    ANNUAL = "ANNUAL"
    SICK = "SICK"
    CASUAL = "CASUAL"
    MATERNITY = "MATERNITY"
    UNPAID = "UNPAID"


class LeaveStatus(str):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Leave(Base):
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    leave_type = Column(String(20), default=LeaveType.ANNUAL, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days_count = Column(Float, nullable=False, default=1.0)
    reason = Column(String(500), nullable=False)
    status = Column(String(20), default=LeaveStatus.PENDING, index=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", backref="leaves")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
