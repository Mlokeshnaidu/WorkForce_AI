from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.database import Base


class PerformanceReview(Base):
    """
    Module 22: Performance Review & Appraisal Tracking
    Records periodic reviews, KPIs, manager ratings, and goal attainment.
    """
    __tablename__ = "performance_reviews"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    review_period = Column(String(50), nullable=False)  # e.g., "Q1 2026", "Annual 2025"
    rating = Column(Float, nullable=False)  # 1.0 to 5.0
    goals_met_percent = Column(Float, default=100.0)  # 0 to 100
    strengths = Column(Text, nullable=True)
    areas_for_improvement = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    review_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", foreign_keys=[employee_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])
