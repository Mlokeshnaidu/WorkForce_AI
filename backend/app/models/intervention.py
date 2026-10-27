from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class InterventionStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    SUCCESSFUL = "SUCCESSFUL"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class Intervention(Base):
    """
    Module 18 & 21: Prescriptive Retention Interventions & Strategy Tracker
    Tracks targeted HR retention initiatives triggered by AI attrition alerts (e.g., compensation review, workload adjustment, promotion).
    """
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    strategy_type = Column(String(100), nullable=False)  # SALARY_INCREMENT, PROMOTION, WORKLOAD_REDUCTION, MENTORSHIP, TEAM_TRANSFER
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    initial_risk_score = Column(Float, nullable=False)
    target_risk_score = Column(Float, default=0.20)
    current_risk_score = Column(Float, nullable=True)
    cost_budget = Column(Float, default=0.0)  # Budget allocation in USD
    status = Column(Enum(InterventionStatus), default=InterventionStatus.PLANNED)
    
    outcome_notes = Column(Text, nullable=True)
    start_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", foreign_keys=[employee_id])
    creator = relationship("User", foreign_keys=[created_by])
