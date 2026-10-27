from datetime import date, datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base


class ShiftType(str):
    MORNING = "MORNING"    # 09:00 - 17:00
    EVENING = "EVENING"    # 13:00 - 21:00
    NIGHT = "NIGHT"        # 21:00 - 05:00
    REMOTE = "REMOTE"      # Flexible


class AttendanceStatus(str):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"
    LATE = "LATE"


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    work_hours = Column(Float, default=0.0)
    overtime_hours = Column(Float, default=0.0)
    status = Column(String(20), default=AttendanceStatus.PRESENT)
    shift_type = Column(String(20), default=ShiftType.MORNING)
    notes = Column(String(255), nullable=True)

    employee = relationship("Employee", backref="attendances")
