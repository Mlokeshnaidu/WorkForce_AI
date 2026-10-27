"""
WorkForce AI Pro Machine Learning Engine
Module 12: Scikit-Learn Attrition Prediction Pipeline
"""
from app.ml.predictor import predict_employee_attrition, get_active_model_metrics
from app.ml.trainer import train_attrition_model

__all__ = ["predict_employee_attrition", "get_active_model_metrics", "train_attrition_model"]
