from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from app.core.database import Base


class MLModelArtifact(Base):
    """
    Module 12: Machine Learning Model Management
    Tracks trained Scikit-Learn models, hyperparameters, and evaluation metrics.
    """
    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), default="WorkForce Random Forest Attrition Predictor")
    version = Column(String(50), default="v1.0.0")
    algorithm = Column(String(100), default="RandomForestClassifier")
    accuracy = Column(Float, default=0.0)
    precision_score = Column(Float, default=0.0)
    recall_score = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    roc_auc = Column(Float, default=0.0)
    training_sample_count = Column(Integer, default=0)
    feature_importances = Column(JSON, nullable=True)  # Dictionary of feature -> importance weight
    is_active = Column(Boolean, default=True)
    trained_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
