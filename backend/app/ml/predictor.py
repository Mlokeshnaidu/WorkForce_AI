import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from app.ml.trainer import MODEL_PATH, FEATURE_NAMES, train_attrition_model

# Cached model artifact in memory
_LOADED_ARTIFACT = None


def get_model():
    global _LOADED_ARTIFACT
    if _LOADED_ARTIFACT is not None:
        return _LOADED_ARTIFACT

    if not os.path.exists(MODEL_PATH):
        # Auto-train and generate model on first use
        _LOADED_ARTIFACT = train_attrition_model()
    else:
        try:
            with open(MODEL_PATH, "rb") as f:
                _LOADED_ARTIFACT = pickle.load(f)
        except Exception:
            _LOADED_ARTIFACT = train_attrition_model()

    return _LOADED_ARTIFACT


def reload_model():
    global _LOADED_ARTIFACT
    _LOADED_ARTIFACT = None
    return get_model()


def get_active_model_metrics() -> Dict[str, Any]:
    artifact = get_model()
    return {
        "version": artifact.get("version", "v1.2.0"),
        "algorithm": "RandomForestClassifier (120 Trees)",
        "metrics": artifact.get("metrics", {}),
        "feature_importances": artifact.get("feature_importances", {}),
        "features": FEATURE_NAMES
    }


def analyze_risk_factors(
    satisfaction: float,
    evaluation: float,
    projects: int,
    hours: int,
    tenure: int,
    promotion: int,
    salary_level: int
) -> Tuple[List[str], List[str]]:
    factors = []
    recommendations = []

    if satisfaction < 0.35:
        factors.append(f"Critical job dissatisfaction ({int(satisfaction * 100)}% satisfaction score)")
        recommendations.append("Schedule executive retention 1-on-1 within 48 hours to identify burnout factors.")
    elif satisfaction < 0.60:
        factors.append(f"Moderate employee dissatisfaction ({int(satisfaction * 100)}%)")

    if hours > 240:
        excess = hours - 160
        factors.append(f"Severe overtime workload ({hours} hrs/month, +{excess}h above normal)")
        recommendations.append("Reallocate active project deliverables to alleviate weekly work pressure.")
    elif hours < 130:
        factors.append(f"Disengagement indicator: low monthly hours ({hours} hrs/month)")

    if projects >= 6:
        factors.append(f"Over-leveraged on {projects} concurrent enterprise projects")
        recommendations.append(f"Cap active workload to maximum 4 concurrent milestones.")
    elif projects <= 2:
        factors.append(f"Under-utilized: only {projects} active projects")

    if tenure >= 3 and promotion == 0:
        factors.append(f"Stagnant tenure: {tenure} years without promotional advancement")
        recommendations.append("Evaluate career progression roadmap and promotion eligibility.")

    if salary_level == 0:
        factors.append("Below-market compensation tier (Low bracket)")
        recommendations.append("Conduct compensation benchmarking review for salary adjustment.")

    if not factors:
        factors.append("Workforce health indicators are in healthy operational range")
        recommendations.append("Maintain quarterly feedback rhythms and recognition.")

    return factors, recommendations


def predict_employee_attrition(
    satisfaction_level: float,
    last_evaluation: float,
    number_of_projects: int,
    average_monthly_hours: int,
    time_spent_company: int,
    work_accident: int = 0,
    promotion_last_5years: int = 0,
    salary_level: int = 1
) -> Dict[str, Any]:
    """
    Executes Scikit-Learn inference to compute attrition probability,
    risk category, confidence score, and prescriptive recommendations.
    """
    artifact = get_model()
    clf = artifact["model"]

    # Input feature vector
    input_df = pd.DataFrame([{
        "satisfaction_level": float(satisfaction_level),
        "last_evaluation": float(last_evaluation),
        "number_of_projects": int(number_of_projects),
        "average_monthly_hours": int(average_monthly_hours),
        "time_spent_company": int(time_spent_company),
        "work_accident": int(work_accident),
        "promotion_last_5years": int(promotion_last_5years),
        "salary_level": int(salary_level)
    }])[FEATURE_NAMES]

    probabilities = clf.predict_proba(input_df)[0]
    # Class 1 is attrition ('left')
    risk_score = round(float(probabilities[1]), 3)

    if risk_score >= 0.65:
        risk_level = "HIGH"
    elif risk_score >= 0.35:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Confidence score based on decision boundary distance
    confidence = round(float(abs(risk_score - 0.5) * 2), 2)
    confidence = max(0.65, min(0.99, confidence))

    factors, recs = analyze_risk_factors(
        satisfaction_level,
        last_evaluation,
        number_of_projects,
        average_monthly_hours,
        time_spent_company,
        promotion_last_5years,
        salary_level
    )

    return {
        "risk_score": risk_score,
        "risk_percentage": round(risk_score * 100, 1),
        "risk_level": risk_level,
        "confidence": confidence,
        "top_factors": factors,
        "recommendations": recs,
        "primary_recommendation": recs[0] if recs else "Maintain current management cadence."
    }
