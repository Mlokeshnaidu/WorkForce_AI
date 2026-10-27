from typing import List, Optional
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.attendance import Attendance, ShiftType, AttendanceStatus
from app.schemas.attendance import AttendanceCheckIn, AttendanceCheckOut, AttendanceResponse

router = APIRouter(prefix="/attendance", tags=["Attendance & Shift Management (Module 4)"])


@router.post("/check-in", response_model=AttendanceResponse)
def check_in(
    data: AttendanceCheckIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record employee check-in and assign shift."""
    today = date.today()
    record = db.query(Attendance).filter(
        Attendance.employee_id == data.employee_id,
        Attendance.date == today
    ).first()

    now = datetime.now(timezone.utc)
    if record and record.check_in:
        raise HTTPException(status_code=400, detail="Employee has already checked in today.")

    if not record:
        record = Attendance(
            employee_id=data.employee_id,
            date=today,
            check_in=now,
            shift_type=data.shift_type or ShiftType.MORNING,
            status=AttendanceStatus.PRESENT,
            notes=data.notes
        )
        db.add(record)
    else:
        record.check_in = now
        record.shift_type = data.shift_type or ShiftType.MORNING
        record.status = AttendanceStatus.PRESENT
        record.notes = data.notes

    db.commit()
    db.refresh(record)

    emp = db.query(Employee).filter(Employee.id == record.employee_id).first()
    return AttendanceResponse(
        id=record.id,
        employee_id=record.employee_id,
        date=record.date,
        check_in=record.check_in,
        check_out=record.check_out,
        work_hours=record.work_hours,
        overtime_hours=record.overtime_hours,
        status=record.status,
        shift_type=record.shift_type,
        notes=record.notes,
        employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
    )


@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    data: AttendanceCheckOut,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record employee check-out, calculate total working hours and overtime."""
    today = date.today()
    record = db.query(Attendance).filter(
        Attendance.employee_id == data.employee_id,
        Attendance.date == today
    ).first()

    if not record or not record.check_in:
        raise HTTPException(status_code=400, detail="Cannot check out without checking in first.")

    now = datetime.now(timezone.utc)
    record.check_out = now

    # Calculate hours worked
    check_in_dt = record.check_in
    if check_in_dt.tzinfo is None:
        check_in_dt = check_in_dt.replace(tzinfo=timezone.utc)
    duration_seconds = (now - check_in_dt).total_seconds()
    hours = round(duration_seconds / 3600.0, 2)
    record.work_hours = max(0.0, hours)

    # Standard shift is 8.0 hours. Excess is overtime!
    record.overtime_hours = round(max(0.0, record.work_hours - 8.0), 2)
    if data.notes:
        record.notes = data.notes

    db.commit()
    db.refresh(record)

    emp = db.query(Employee).filter(Employee.id == record.employee_id).first()
    return AttendanceResponse(
        id=record.id,
        employee_id=record.employee_id,
        date=record.date,
        check_in=record.check_in,
        check_out=record.check_out,
        work_hours=record.work_hours,
        overtime_hours=record.overtime_hours,
        status=record.status,
        shift_type=record.shift_type,
        notes=record.notes,
        employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
    )


@router.get("/today/{employee_id}")
def get_today_status(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get check-in status for specific employee today."""
    today = date.today()
    record = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        Attendance.date == today
    ).first()

    if not record:
        return {"checked_in": False, "checked_out": False, "record": None}

    return {
        "checked_in": bool(record.check_in),
        "checked_out": bool(record.check_out),
        "work_hours": record.work_hours,
        "overtime_hours": record.overtime_hours,
        "shift_type": record.shift_type,
        "check_in_time": record.check_in.isoformat() if record.check_in else None,
        "check_out_time": record.check_out.isoformat() if record.check_out else None
    }


@router.get("/history", response_model=List[AttendanceResponse])
def get_attendance_history(
    employee_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve attendance logs with flexible filtering."""
    query = db.query(Attendance)
    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    if status_filter:
        query = query.filter(Attendance.status == status_filter)
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)

    records = query.order_by(Attendance.date.desc(), Attendance.id.desc()).offset(skip).limit(limit).all()

    results = []
    for r in records:
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
        results.append(AttendanceResponse(
            id=r.id,
            employee_id=r.employee_id,
            date=r.date,
            check_in=r.check_in,
            check_out=r.check_out,
            work_hours=r.work_hours,
            overtime_hours=r.overtime_hours,
            status=r.status,
            shift_type=r.shift_type,
            notes=r.notes,
            employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
        ))
    return results


@router.get("/stats/summary")
def get_attendance_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Attendance summary for the dashboard: present today, total overtime, average hours."""
    today = date.today()
    total_active_employees = db.query(Employee).filter(Employee.status == "ACTIVE").count()
    present_today = db.query(Attendance).filter(Attendance.date == today, Attendance.check_in.isnot(None)).count()
    total_overtime = db.query(func.sum(Attendance.overtime_hours)).scalar() or 0.0
    avg_hours = db.query(func.avg(Attendance.work_hours)).filter(Attendance.work_hours > 0).scalar() or 0.0

    return {
        "date": today.isoformat(),
        "total_workforce": total_active_employees,
        "present_today": present_today,
        "attendance_rate": round((present_today / max(1, total_active_employees)) * 100, 1),
        "total_overtime_hours": round(float(total_overtime), 1),
        "average_work_hours": round(float(avg_hours), 1)
    }
