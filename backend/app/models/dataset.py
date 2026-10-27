from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Dataset(Base):
    """
    Module 11: Dataset Management System
    Stores metadata and parsed previews of uploaded HR workforce datasets.
    """
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    row_count = Column(Integer, default=0)
    features_count = Column(Integer, default=0)
    status = Column(String(50), default="PROCESSED")  # PROCESSED, TRAINED, FAILED
    description = Column(Text, nullable=True)
    preview_data = Column(JSON, nullable=True)  # Stores first 5-10 records as JSON for instant UI preview
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    uploader = relationship("User")
