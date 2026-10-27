from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class DocumentType(str):
    CONTRACT = "CONTRACT"
    RESUME = "RESUME"
    ID_PROOF = "ID_PROOF"
    CERTIFICATE = "CERTIFICATE"
    PERFORMANCE = "PERFORMANCE"
    OTHER = "OTHER"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    document_type = Column(String(30), default=DocumentType.CONTRACT)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_size_kb = Column(Float, default=0.0)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", backref="documents")
