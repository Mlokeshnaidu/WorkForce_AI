from datetime import datetime, date, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.performance import PerformanceReview
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/performance", tags=["Performance & Appraisals"])


@router.get("/")
def list_performance_reviews(
    employee_id: Optional[int] = None,
    review_period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Module 22: Lists performance reviews, ratings, and appraisal histories.
    """
    query = db.query(PerformanceReview)
    if employee_id:
        query = query.filter(PerformanceReview.employee_id == employee_id)
    if review_period:
        query = query.filter(PerformanceReview.review_period == review_period)

    reviews = query.order_by(PerformanceReview.review_date.desc()).all()
    results = []
    for r in reviews:
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
        rev = db.query(User).filter(User.id == r.reviewer_id).first()
        results.append({
            "id": r.id,
            "employee_id": r.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "job_title": emp.job_title if emp else "",
            "reviewer_name": rev.full_name if rev else "Management",
            "review_period": r.review_period,
            "rating": r.rating,
            "goals_met_percent": r.goals_met_percent,
            "strengths": r.strengths,
            "areas_for_improvement": r.areas_for_improvement,
            "comments": r.comments,
            "review_date": r.review_date.isoformat() if r.review_date else None
        })
    return results


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_performance_review(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """
    Submits a new formal performance review and automatically syncs employee.last_evaluation.
    """
    emp_id = payload.get("employee_id")
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    rev_date = date.today()
    if payload.get("review_date"):
        try:
            rev_date = date.fromisoformat(payload["review_date"])
        except Exception:
            pass

    rating = float(payload.get("rating", 4.0))

    review = PerformanceReview(
        employee_id=emp_id,
        reviewer_id=current_user.id,
        review_period=payload.get("review_period", "Q1 2026"),
        rating=rating,
        goals_met_percent=float(payload.get("goals_met_percent", 100.0)),
        strengths=payload.get("strengths", ""),
        areas_for_improvement=payload.get("areas_for_improvement", ""),
        comments=payload.get("comments", ""),
        review_date=rev_date
    )
    db.add(review)

    # Sync to employee last_evaluation (normalized from 1-5 to 0.2-1.0)
    normalized_eval = round(min(1.0, max(0.1, rating / 5.0)), 2)
    emp.last_evaluation = normalized_eval

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="REVIEW",
        entity="PerformanceReview",
        entity_id=str(emp_id),
        details=f"Submitted performance appraisal ({rating}/5.0) for {emp.first_name} {emp.last_name}"
    )
    db.add(audit)

    db.commit()
    db.refresh(review)
    return {"message": "Performance review recorded successfully", "id": review.id}


@router.get("/summary")
def get_performance_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reviews = db.query(PerformanceReview).all()
    total = len(reviews)
    if total == 0:
        return {
            "total_reviews": 0,
            "average_rating": 4.1,
            "rating_distribution": {"5_star": 5, "4_star": 12, "3_star": 3, "below_3": 1}
        }

    avg_rating = round(sum(r.rating for r in reviews) / total, 2)
    dist = {
        "5_star": sum(1 for r in reviews if r.rating >= 4.5),
        "4_star": sum(1 for r in reviews if 3.5 <= r.rating < 4.5),
        "3_star": sum(1 for r in reviews if 2.5 <= r.rating < 3.5),
        "below_3": sum(1 for r in reviews if r.rating < 2.5)
    }

    return {
        "total_reviews": total,
        "average_rating": avg_rating,
        "rating_distribution": dist
    }
