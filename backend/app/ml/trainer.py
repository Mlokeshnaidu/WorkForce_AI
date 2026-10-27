import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "attrition_model.pkl")
DATASET_PATH = os.path.join(MODEL_DIR, "hr_attrition_dataset.csv")

FEATURE_NAMES = [
    "satisfaction_level",
    "last_evaluation",
    "number_of_projects",
    "average_monthly_hours",
    "time_spent_company",
    "work_accident",
    "promotion_last_5years",
    "salary_level"  # 0=low, 1=medium, 2=high
]


def generate_synthetic_dataset(num_samples: int = 1500) -> pd.DataFrame:
    """
    Generates a realistic enterprise HR dataset based on empirical attrition patterns
    (e.g., IBM HR analytics & Kaggle HR datasets).
    """
    np.random.seed(42)

    # 1. Satisfaction Level (0.09 - 1.0)
    satisfaction = np.random.beta(a=5, b=2.5, size=num_samples)
    satisfaction = np.clip(satisfaction, 0.05, 1.0)

    # 2. Last Evaluation (0.36 - 1.0)
    evaluation = np.random.beta(a=6, b=3, size=num_samples)
    evaluation = np.clip(evaluation, 0.30, 1.0)

    # 3. Number of Projects (2 - 7)
    projects = np.random.choice([2, 3, 4, 5, 6, 7], size=num_samples, p=[0.15, 0.30, 0.28, 0.16, 0.08, 0.03])

    # 4. Average Monthly Hours (96 - 310)
    hours = np.random.normal(loc=200, scale=45, size=num_samples).astype(int)
    hours = np.clip(hours, 96, 310)

    # 5. Time Spent at Company (2 - 10 years)
    tenure = np.random.choice([2, 3, 4, 5, 6, 7, 8, 10], size=num_samples, p=[0.22, 0.35, 0.18, 0.12, 0.06, 0.03, 0.02, 0.02])

    # 6. Work Accident (0 or 1)
    accidents = np.random.binomial(n=1, p=0.14, size=num_samples)

    # 7. Promotion in last 5 years (0 or 1)
    promotions = np.random.binomial(n=1, p=0.03, size=num_samples)

    # 8. Salary Level (0=Low, 1=Medium, 2=High)
    salaries = np.random.choice([0, 1, 2], size=num_samples, p=[0.48, 0.43, 0.09])

    # Attrition Logic (Ground Truth Formulation with realistic noise)
    # Primary drivers: low satisfaction, extreme hours (>250), high tenure without promotion, low salary
    attrition_prob = (
        (1.0 - satisfaction) * 0.45 +
        ((hours - 160) / 150.0).clip(0, 1) * 0.25 +
        (tenure >= 4).astype(float) * (1.0 - promotions) * 0.15 +
        (salaries == 0).astype(float) * 0.10 +
        ((projects >= 6) | (projects <= 2)).astype(float) * 0.15
    )
    attrition_prob += np.random.normal(0, 0.08, size=num_samples)
    attrition_prob = np.clip(attrition_prob, 0.0, 1.0)
    left = (attrition_prob > 0.48).astype(int)

    df = pd.DataFrame({
        "satisfaction_level": np.round(satisfaction, 2),
        "last_evaluation": np.round(evaluation, 2),
        "number_of_projects": projects,
        "average_monthly_hours": hours,
        "time_spent_company": tenure,
        "work_accident": accidents,
        "promotion_last_5years": promotions,
        "salary_level": salaries,
        "left": left
    })

    return df


def train_attrition_model(dataset_path: str = None) -> Dict[str, Any]:
    """
    Trains a high-performance Scikit-Learn Random Forest Classifier
    on HR attrition data and saves the artifact to disk.
    """
    if dataset_path and os.path.exists(dataset_path):
        df = pd.read_csv(dataset_path)
    else:
        df = generate_synthetic_dataset(num_samples=1600)
        df.to_csv(DATASET_PATH, index=False)

    # Prepare features and target
    X = df[FEATURE_NAMES]
    y = df["left"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    # Train Random Forest Classifier
    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=10,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced"
    )
    clf.fit(X_train, y_train)

    # Evaluate predictions
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc = float(roc_auc_score(y_test, y_proba))

    # Calculate feature importances
    importances = {
        name: round(float(imp), 4)
        for name, imp in zip(FEATURE_NAMES, clf.feature_importances_)
    }
    # Sort descending
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

    # Save model artifact
    model_artifact = {
        "model": clf,
        "feature_names": FEATURE_NAMES,
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc, 4),
            "total_samples": len(df),
            "test_samples": len(X_test)
        },
        "feature_importances": sorted_importances,
        "version": "v1.2.0"
    }

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model_artifact, f)

    return model_artifact
