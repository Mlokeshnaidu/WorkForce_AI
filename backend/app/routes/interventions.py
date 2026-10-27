from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.intervention import Intervention, InterventionStatus
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/interventions", tags=["Retention Interventions & Strategy Tracker"])


@router.get("/")
def list_interventions(
    status_filter: Optional[str] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Modules 18 & 21: Lists all active and completed retention initiatives.
    """
    query = db.query(Intervention)
    if status_filter:
        query = query.filter(Intervention.status == status_filter)
    if employee_id:
        query = query.filter(Intervention.employee_id == employee_id)

    interventions = query.order_by(Intervention.created_at.desc()).all()
    results = []
    for item in interventions:
        emp = db.query(Employee).filter(Employee.id == item.employee_id).first()
        results.append({
            "id": item.id,
            "employee_id": item.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "job_title": emp.job_title if emp else "",
            "strategy_type": item.strategy_type,
            "title": item.title,
            "description": item.description,
            "initial_risk_score": item.initial_risk_score,
            "target_risk_score": item.target_risk_score,
            "current_risk_score": item.current_risk_score or item.initial_risk_score,
            "cost_budget": item.cost_budget,
            "status": item.status.value if hasattr(item.status, "value") else str(item.status),
            "outcome_notes": item.outcome_notes,
            "start_date": item.start_date.isoformat() if item.start_date else None,
            "resolved_date": item.resolved_date.isoformat() if item.resolved_date else None,
            "created_at": item.created_at.isoformat() if item.created_at else None
        })
    return results


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_intervention(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """
    Creates a prescriptive retention intervention for an employee.
    """
    emp_id = payload.get("employee_id")
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_intervention = Intervention(
        employee_id=emp_id,
        created_by=current_user.id,
        strategy_type=payload.get("strategy_type", "SALARY_INCREMENT"),
        title=payload.get("title", f"Retention plan for {emp.first_name}"),
        description=payload.get("description", ""),
        initial_risk_score=float(payload.get("initial_risk_score", emp.current_risk_score or 0.70)),
        target_risk_score=float(payload.get("target_risk_score", 0.25)),
        current_risk_score=float(payload.get("current_risk_score", emp.current_risk_score or 0.70)),
        cost_budget=float(payload.get("cost_budget", 0.0)),
        status=InterventionStatus.IN_PROGRESS
    )
    db.add(new_intervention)

    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE",
        entity="Intervention",
        entity_id=str(emp_id),
        details=f"Created {new_intervention.strategy_type} retention plan for {emp.first_name} {emp.last_name}"
    )
    db.add(audit)

    db.commit()
    db.refresh(new_intervention)
    return {"message": "Retention plan created successfully", "id": new_intervention.id}


@router.put("/{intervention_id}")
def update_intervention(
    intervention_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """
    Updates intervention status, outcome notes, and new risk level.
    """
    item = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Intervention plan not found")

    if "status" in payload:
        new_status = payload["status"]
        item.status = getattr(InterventionStatus, new_status, item.status)
        if new_status in ["SUCCESSFUL", "FAILED", "CANCELLED"]:
            item.resolved_date = datetime.now(timezone.utc)
    if "current_risk_score" in payload:
        item.current_risk_score = float(payload["current_risk_score"])
    if "outcome_notes" in payload:
        item.outcome_notes = payload["outcome_notes"]
    if "cost_budget" in payload:
        item.cost_budget = float(payload["cost_budget"])

    db.commit()
    return {"message": "Intervention updated successfully"}
