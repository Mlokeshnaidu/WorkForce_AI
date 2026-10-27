from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class RiskAssessmentLog(Base):
    """
    Module 13 & 17: Employee Risk Monitoring & Smart AI Alert Engine
    Maintains historical log of AI risk assessments and prescriptive retention recommendations.
    """
    __tablename__ = "risk_assessment_logs"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    risk_score = Column(Float, nullable=False)  # 0.0 to 1.0
    risk_level = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH
    confidence = Column(Float, default=0.95)
    top_factors = Column(JSON, nullable=True)  # List of primary risk drivers
    recommendation = Column(Text, nullable=True)  # AI prescriptive intervention
    assessed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee")
