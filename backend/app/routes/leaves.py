from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.leave import Leave, LeaveStatus, LeaveType
from app.schemas.leave import LeaveCreate, LeaveReview, LeaveResponse

router = APIRouter(prefix="/leaves", tags=["Leave Management System (Module 5)"])


@router.post("/", response_model=LeaveResponse, status_code=status.HTTP_201_CREATED)
def apply_leave(
    leave_in: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Apply for employee leave (Pending approval)."""
    emp = db.query(Employee).filter(Employee.id == leave_in.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    if leave_in.end_date < leave_in.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")

    # Calculate days if not provided
    days = (leave_in.end_date - leave_in.start_date).days + 1
    new_leave = Leave(
        employee_id=leave_in.employee_id,
        leave_type=leave_in.leave_type,
        start_date=leave_in.start_date,
        end_date=leave_in.end_date,
        days_count=max(1.0, float(days)),
        reason=leave_in.reason,
        status=LeaveStatus.PENDING
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)

    return LeaveResponse(
        id=new_leave.id,
        employee_id=new_leave.employee_id,
        leave_type=new_leave.leave_type,
        start_date=new_leave.start_date,
        end_date=new_leave.end_date,
        days_count=new_leave.days_count,
        reason=new_leave.reason,
        status=new_leave.status,
        reviewed_by=new_leave.reviewed_by,
        review_notes=new_leave.review_notes,
        created_at=new_leave.created_at,
        employee_name=f"{emp.first_name} {emp.last_name}"
    )


@router.get("/", response_model=List[LeaveResponse])
def list_leaves(
    employee_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List leave requests with optional status and employee filtering."""
    query = db.query(Leave)
    if employee_id:
        query = query.filter(Leave.employee_id == employee_id)
    if status_filter:
        query = query.filter(Leave.status == status_filter.upper())

    leaves = query.order_by(Leave.id.desc()).offset(skip).limit(limit).all()

    results = []
    for l in leaves:
        emp = db.query(Employee).filter(Employee.id == l.employee_id).first()
        results.append(LeaveResponse(
            id=l.id,
            employee_id=l.employee_id,
            leave_type=l.leave_type,
            start_date=l.start_date,
            end_date=l.end_date,
            days_count=l.days_count,
            reason=l.reason,
            status=l.status,
            reviewed_by=l.reviewed_by,
            review_notes=l.review_notes,
            created_at=l.created_at,
            employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
        ))
    return results


@router.put("/{leave_id}/review", response_model=LeaveResponse)
def review_leave(
    leave_id: int,
    review_data: LeaveReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR, UserRole.MANAGER]))
):
    """Approve or Reject a pending leave request (Restricted to HR, Managers, Admin)."""
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    new_status = review_data.status.upper()
    if new_status not in [LeaveStatus.APPROVED, LeaveStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Status must be either APPROVED or REJECTED")

    leave.status = new_status
    leave.reviewed_by = current_user.id
    leave.review_notes = review_data.review_notes

    db.commit()
    db.refresh(leave)

    emp = db.query(Employee).filter(Employee.id == leave.employee_id).first()
    return LeaveResponse(
        id=leave.id,
        employee_id=leave.employee_id,
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        days_count=leave.days_count,
        reason=leave.reason,
        status=leave.status,
        reviewed_by=leave.reviewed_by,
        review_notes=leave.review_notes,
        created_at=leave.created_at,
        employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
    )


@router.get("/balances/{employee_id}")
def get_leave_balances(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculates remaining leave balances for employee."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Standard annual entitlements:
    entitlements = {
        "ANNUAL": 20.0,
        "SICK": 10.0,
        "CASUAL": 5.0,
        "UNPAID": 30.0
    }

    # Sum approved leaves taken
    approved_leaves = db.query(
        Leave.leave_type,
        func.sum(Leave.days_count)
    ).filter(
        Leave.employee_id == employee_id,
        Leave.status == LeaveStatus.APPROVED
    ).group_by(Leave.leave_type).all()

    used = {lt: 0.0 for lt in entitlements}
    for lt, total_days in approved_leaves:
        if lt in used:
            used[lt] = float(total_days or 0.0)

    breakdown = []
    for lt, total in entitlements.items():
        used_days = used[lt]
        remaining = max(0.0, total - used_days)
        breakdown.append({
            "leave_type": lt,
            "entitled": total,
            "used": used_days,
            "remaining": remaining
        })

    return {
        "employee_id": employee_id,
        "employee_name": f"{emp.first_name} {emp.last_name}",
        "balances": breakdown
    }
