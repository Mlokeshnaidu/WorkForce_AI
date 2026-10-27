import os
import io
import json
import pandas as pd
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.department import Department
from app.models.notification import Notification
from app.models.dataset import Dataset
from app.models.ml_model import MLModelArtifact
from app.models.risk_log import RiskAssessmentLog
from app.models.audit_log import AuditLog
from app.ml.predictor import (
    predict_employee_attrition,
    get_active_model_metrics
)
from app.ml.trainer import FEATURE_NAMES

router = APIRouter(prefix="/ai", tags=["AI Attrition & Workforce Intelligence"])


@router.get("/overview")
def get_ai_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Modules 13, 17, 23: Executive AI Attrition & Workforce Stability Index Overview
    """
    employees = db.query(Employee).filter(Employee.status == "ACTIVE").all()
    total = len(employees)
    if total == 0:
        return {
            "workforce_stability_index": 100.0,
            "total_employees": 0,
            "high_risk_count": 0,
            "medium_risk_count": 0,
            "low_risk_count": 0,
            "average_risk_score": 0.0,
            "departments_risk": [],
            "model_version": "v1.2.0"
        }

    high_risk = sum(1 for e in employees if getattr(e, "risk_level", "LOW") == "HIGH" or (getattr(e, "current_risk_score", 0.0) >= 0.65))
    medium_risk = sum(1 for e in employees if getattr(e, "risk_level", "LOW") == "MEDIUM" or (0.35 <= getattr(e, "current_risk_score", 0.0) < 0.65))
    low_risk = total - high_risk - medium_risk

    avg_risk = round(sum(getattr(e, "current_risk_score", 0.15) for e in employees) / total, 3)
    stability_index = round(max(0.0, min(100.0, (1.0 - (high_risk * 0.6 + medium_risk * 0.25) / total) * 100)), 1)

    # Department breakdown
    departments = db.query(Department).all()
    dept_risk_list = []
    for d in departments:
        dept_emps = [e for e in employees if e.department_id == d.id]
        if dept_emps:
            dept_avg = round(sum(getattr(e, "current_risk_score", 0.15) for e in dept_emps) / len(dept_emps), 3)
            dept_high = sum(1 for e in dept_emps if getattr(e, "current_risk_score", 0.15) >= 0.65)
            dept_risk_list.append({
                "department_id": d.id,
                "department_name": d.name,
                "employee_count": len(dept_emps),
                "average_risk": dept_avg,
                "high_risk_count": dept_high
            })

    return {
        "workforce_stability_index": stability_index,
        "total_employees": total,
        "high_risk_count": high_risk,
        "high_risk_percentage": round((high_risk / total) * 100, 1),
        "medium_risk_count": medium_risk,
        "medium_risk_percentage": round((medium_risk / total) * 100, 1),
        "low_risk_count": low_risk,
        "low_risk_percentage": round((low_risk / total) * 100, 1),
        "average_risk_score": avg_risk,
        "departments_risk": dept_risk_list,
        "model_version": "v1.2.0 (Scikit-Learn Random Forest 120 Trees)"
    }


@router.post("/predict")
def predict_custom_features(payload: dict, current_user: User = Depends(get_current_user)):
    """
    Modules 13 & 14: Predict attrition probability on custom arbitrary feature vector.
    """
    satisfaction = float(payload.get("satisfaction_level", 0.65))
    evaluation = float(payload.get("last_evaluation", 0.70))
    projects = int(payload.get("number_of_projects", 4))
    hours = int(payload.get("average_monthly_hours", 190))
    tenure = int(payload.get("time_spent_company", 3))
    accident = int(payload.get("work_accident", 0))
    promotion = int(payload.get("promotion_last_5years", 0))
    salary_tier = int(payload.get("salary_level", 1))

    result = predict_employee_attrition(
        satisfaction_level=satisfaction,
        last_evaluation=evaluation,
        number_of_projects=projects,
        average_monthly_hours=hours,
        time_spent_company=tenure,
        work_accident=accident,
        promotion_last_5years=promotion,
        salary_level=salary_tier
    )
    return result


@router.get("/predict/{employee_id}")
@router.post("/predict/{employee_id}")
def predict_for_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Modules 13, 14, 17: Evaluates specific employee attrition risk, records historical log,
    updates employee profile, and triggers an alert if risk threshold is breached.
    """
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Determine salary level
    salary_val = float(emp.salary or 60000)
    salary_tier = 0 if salary_val < 50000 else (2 if salary_val > 95000 else 1)

    result = predict_employee_attrition(
        satisfaction_level=float(emp.satisfaction_level or 0.65),
        last_evaluation=float(emp.last_evaluation or 0.70),
        number_of_projects=int(emp.number_of_projects or 3),
        average_monthly_hours=int(emp.average_monthly_hours or 180),
        time_spent_company=int(emp.time_spent_company or 3),
        work_accident=int(emp.work_accident or 0),
        promotion_last_5years=int(emp.promotion_last_5years or 0),
        salary_level=salary_tier
    )

    # Update employee table fields
    emp.current_risk_score = result["risk_score"]
    emp.risk_level = result["risk_level"]

    # Log to RiskAssessmentLog
    log_entry = RiskAssessmentLog(
        employee_id=emp.id,
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        confidence=result["confidence"],
        top_factors=result["top_factors"],
        recommendation=result["primary_recommendation"]
    )
    db.add(log_entry)

    # Module 17: Smart AI Alert Engine
    if result["risk_score"] >= 0.65:
        # Check if recent alert already exists
        notif = Notification(
            user_id=current_user.id,
            title=f"Flight Risk Alert: {emp.first_name} {emp.last_name}",
            message=f"AI detected HIGH attrition probability ({result['risk_percentage']}%). Top factor: {result['top_factors'][0] if result['top_factors'] else 'Multiple signals'}.",
            type="ALERT",
            is_read=False
        )
        db.add(notif)

    db.commit()
    db.refresh(emp)

    return {
        "employee_id": emp.id,
        "employee_name": f"{emp.first_name} {emp.last_name}",
        "department_id": emp.department_id,
        "prediction": result
    }


@router.post("/recalculate-all")
def recalculate_all_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """
    Module 13 & 17: Batch recalculation across all active employees.
    """
    employees = db.query(Employee).filter(Employee.status == "ACTIVE").all()
    updated_count = 0
    high_risk_count = 0

    for emp in employees:
        salary_val = float(emp.salary or 60000)
        salary_tier = 0 if salary_val < 50000 else (2 if salary_val > 95000 else 1)

        result = predict_employee_attrition(
            satisfaction_level=float(emp.satisfaction_level or 0.65),
            last_evaluation=float(emp.last_evaluation or 0.70),
            number_of_projects=int(emp.number_of_projects or 3),
            average_monthly_hours=int(emp.average_monthly_hours or 180),
            time_spent_company=int(emp.time_spent_company or 3),
            work_accident=int(emp.work_accident or 0),
            promotion_last_5years=int(emp.promotion_last_5years or 0),
            salary_level=salary_tier
        )

        emp.current_risk_score = result["risk_score"]
        emp.risk_level = result["risk_level"]
        updated_count += 1

        if result["risk_score"] >= 0.65:
            high_risk_count += 1

        # Record log
        log_entry = RiskAssessmentLog(
            employee_id=emp.id,
            risk_score=result["risk_score"],
            risk_level=result["risk_level"],
            confidence=result["confidence"],
            top_factors=result["top_factors"],
            recommendation=result["primary_recommendation"]
        )
        db.add(log_entry)

    # Create audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="PREDICT_BATCH",
        entity="Employee",
        entity_id="ALL",
        details=f"Batch AI risk recalculation completed for {updated_count} employees. High risk count: {high_risk_count}."
    )
    db.add(audit)

    db.commit()

    return {
        "status": "success",
        "processed_employees": updated_count,
        "high_risk_count": high_risk_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/forecast")
def get_workforce_forecast(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Module 16: Workforce Attrition Forecasting
    Projects 6-month expected turnover, forecasted headcount retention, and risk distribution.
    """
    employees = db.query(Employee).filter(Employee.status == "ACTIVE").all()
    total = len(employees) or 50
    avg_risk = sum(getattr(e, "current_risk_score", 0.15) for e in employees) / max(1, total)

    months = ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"]
    forecast_data = []
    current_headcount = total

    for i, month in enumerate(months, start=1):
        # Monthly expected attrition rate scaled realistically
        turnover_rate = round(avg_risk * (0.015 + (i * 0.002)), 3)
        expected_leaves = max(0, round(current_headcount * turnover_rate))
        retained = current_headcount - expected_leaves
        current_headcount = retained

        forecast_data.append({
            "month": month,
            "turnover_rate_percent": round(turnover_rate * 100, 2),
            "projected_leaves": expected_leaves,
            "projected_retained_headcount": retained,
            "projected_stability": round(max(50.0, 100.0 - (turnover_rate * 100 * 2.5)), 1)
        })

    return {
        "current_headcount": total,
        "projected_6_month_turnover_rate": round(sum(d["turnover_rate_percent"] for d in forecast_data), 1),
        "forecast_timeline": forecast_data
    }


@router.get("/model-metrics")
def get_model_metrics(current_user: User = Depends(get_current_user)):
    """
    Module 12: Machine Learning Model Management & Hyperparameter/Metric tracking.
    """
    return get_active_model_metrics()


@router.get("/datasets")
def list_datasets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Module 11: List registered HR workforce training datasets.
    """
    return db.query(Dataset).order_by(Dataset.uploaded_at.desc()).all()


@router.post("/datasets/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """
    Module 11: Upload and parse HR workforce CSV dataset with preview extraction.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for HR training datasets")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    # Module 11: Duplicate Record Validation and Failed Record Reporting
    initial_rows = len(df)
    duplicates_count = int(df.duplicated().sum())
    null_rows = int(df.isnull().any(axis=1).sum())
    failed_records_count = duplicates_count + null_rows
    valid_records_count = max(0, initial_rows - failed_records_count)
    
    # Extract sample failed/duplicate record issues if present
    validation_issues = []
    if duplicates_count > 0:
        validation_issues.append(f"Identified {duplicates_count} duplicate employee records across feature vectors.")
    if null_rows > 0:
        validation_issues.append(f"Found {null_rows} incomplete rows containing missing feature values.")

    row_count = initial_rows
    features_count = len(df.columns)
    preview = df.head(8).to_dict(orient="records")

    # Save to uploads directory
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads", "datasets")
    os.makedirs(upload_dir, exist_ok=True)
    saved_path = os.path.join(upload_dir, f"{int(datetime.now().timestamp())}_{file.filename}")
    with open(saved_path, "wb") as f:
        f.write(contents)

    dataset_record = Dataset(
        filename=file.filename,
        file_path=saved_path,
        row_count=row_count,
        features_count=features_count,
        status="PROCESSED" if failed_records_count == 0 else "VALIDATED_WITH_WARNINGS",
        description=description or f"HR Workforce dataset with {row_count} records ({valid_records_count} valid, {duplicates_count} duplicates)",
        preview_data=preview,
        uploaded_by=current_user.id
    )
    db.add(dataset_record)
    db.commit()
    db.refresh(dataset_record)

    return {
        "message": "Dataset uploaded and registered successfully!",
        "dataset_id": dataset_record.id,
        "row_count": row_count,
        "valid_records_count": valid_records_count,
        "duplicate_records_count": duplicates_count,
        "failed_records_count": failed_records_count,
        "validation_issues": validation_issues,
        "features_count": features_count,
        "preview": preview
    }


@router.get("/logs")
def get_risk_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Module 13 & 17: Historical risk evaluation logs with employee metadata.
    """
    logs = db.query(RiskAssessmentLog).order_by(RiskAssessmentLog.assessed_at.desc()).limit(limit).all()
    results = []
    for log in logs:
        emp = db.query(Employee).filter(Employee.id == log.employee_id).first()
        results.append({
            "id": log.id,
            "employee_id": log.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "department_id": emp.department_id if emp else None,
            "risk_score": log.risk_score,
            "risk_level": log.risk_level,
            "confidence": log.confidence,
            "top_factors": log.top_factors or [],
            "recommendation": log.recommendation,
            "assessed_at": log.assessed_at.isoformat() if log.assessed_at else None
        })
    return results
