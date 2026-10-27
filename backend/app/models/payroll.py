from datetime import date, datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class PayrollStatus(str):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PAID = "PAID"


class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    month = Column(Integer, nullable=False)   # 1 - 12
    year = Column(Integer, nullable=False)    # e.g. 2026
    base_salary = Column(Float, nullable=False)
    allowances = Column(Float, default=0.0)
    bonuses = Column(Float, default=0.0)
    tax_deductions = Column(Float, default=0.0)
    net_salary = Column(Float, nullable=False)
    status = Column(String(20), default=PayrollStatus.PENDING)
    payment_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", backref="payrolls")
