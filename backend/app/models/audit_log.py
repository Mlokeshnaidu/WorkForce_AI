from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuditLog(Base):
    """
    Module 27: Audit Logging & Compliance System
    Immutable event trail for security, compliance, data modifications, and user actions.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, PREDICT, EXPORT
    entity = Column(String(100), nullable=False)  # Employee, Payroll, AIModel, Leave, Auth
    entity_id = Column(String(100), nullable=True)  # ID or reference of affected entity
    details = Column(Text, nullable=True)  # Human-readable summary
    metadata_json = Column(JSON, nullable=True)  # Extra context e.g., IP address, before/after values
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User")
