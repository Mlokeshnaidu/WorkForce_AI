from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)

    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    job_title = Column(String(100), nullable=False)
    salary = Column(Float, nullable=False)
    hire_date = Column(Date, default=date.today)
    status = Column(String(20), default="ACTIVE")  # ACTIVE, ON_LEAVE, TERMINATED

    # AI Attrition Predictor Metrics (Used by Scikit-Learn Engine)
    satisfaction_level = Column(Float, default=0.70)      # Scale 0.0 to 1.0
    last_evaluation = Column(Float, default=0.75)         # Scale 0.0 to 1.0
    number_of_projects = Column(Integer, default=3)
    average_monthly_hours = Column(Integer, default=180)
    time_spent_company = Column(Integer, default=3)       # Years at company
    work_accident = Column(Integer, default=0)            # 0 = No, 1 = Yes
    promotion_last_5years = Column(Integer, default=0)    # 0 = No, 1 = Yes
    
    # AI Attrition Prediction Output
    current_risk_score = Column(Float, default=0.15)      # Risk % (0.0 to 1.0)
    risk_level = Column(String(20), default="LOW")        # LOW, MEDIUM, HIGH

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="employee")
    department = relationship("Department", back_populates="employees")
