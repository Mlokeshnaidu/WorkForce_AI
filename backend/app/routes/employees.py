from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse

router = APIRouter(prefix="/employees", tags=["Employee Management System (Module 2)"])


def calculate_baseline_risk(
    satisfaction_level: float,
    average_monthly_hours: int,
    number_of_projects: int,
    time_spent_company: int,
    promotion_last_5years: int
) -> tuple[float, str]:
    """
    Intelligent heuristic calculation for baseline attrition risk (Module 12 preview).
    Recalculates risk percentage and category whenever employee metrics change.
    """
    risk = (1.0 - satisfaction_level) * 0.45
    
    if average_monthly_hours > 240:
        risk += 0.25
    elif average_monthly_hours < 140:
        risk += 0.15

    if number_of_projects >= 6:
        risk += 0.15
    elif number_of_projects <= 2:
        risk += 0.10

    if time_spent_company >= 4 and promotion_last_5years == 0:
        risk += 0.15

    risk_score = round(max(0.05, min(0.98, risk)), 2)
    if risk_score >= 0.65:
        level = "HIGH"
    elif risk_score >= 0.35:
        level = "MEDIUM"
    else:
        level = "LOW"
    return risk_score, level


@router.get("/", response_model=List[EmployeeResponse])
def list_employees(
    skip: int = 0,
    limit: int = 50,
    q: Optional[str] = Query(None, description="Search by name, email, or job title"),
    department_id: Optional[int] = Query(None, description="Filter by department"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by employment status"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (LOW, MEDIUM, HIGH)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List employees with advanced multi-filter search and pagination."""
    query = db.query(Employee)

    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            or_(
                Employee.first_name.ilike(search_pattern),
                Employee.last_name.ilike(search_pattern),
                Employee.email.ilike(search_pattern),
                Employee.job_title.ilike(search_pattern)
            )
        )
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if status_filter:
        query = query.filter(Employee.status == status_filter)
    if risk_level:
        query = query.filter(Employee.risk_level == risk_level.upper())

    employees = query.order_by(Employee.id.desc()).offset(skip).limit(limit).all()

    # Populate department_name
    results = []
    for emp in employees:
        dept = db.query(Department).filter(Department.id == emp.department_id).first()
        emp_dict = EmployeeResponse(
            id=emp.id,
            user_id=emp.user_id,
            department_id=emp.department_id,
            first_name=emp.first_name,
            last_name=emp.last_name,
            email=emp.email,
            phone=emp.phone,
            job_title=emp.job_title,
            salary=emp.salary,
            hire_date=emp.hire_date,
            status=emp.status,
            satisfaction_level=emp.satisfaction_level,
            last_evaluation=emp.last_evaluation,
            number_of_projects=emp.number_of_projects,
            average_monthly_hours=emp.average_monthly_hours,
            time_spent_company=emp.time_spent_company,
            work_accident=emp.work_accident,
            promotion_last_5years=emp.promotion_last_5years,
            current_risk_score=emp.current_risk_score,
            risk_level=emp.risk_level,
            department_name=dept.name if dept else "Unassigned",
            created_at=emp.created_at
        )
        results.append(emp_dict)
    return results


@router.get("/stats/overview")
def get_workforce_overview_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Workforce statistics for top cards on dashboard."""
    total = db.query(Employee).count()
    active = db.query(Employee).filter(Employee.status == "ACTIVE").count()
    high_risk = db.query(Employee).filter(Employee.risk_level == "HIGH").count()
    medium_risk = db.query(Employee).filter(Employee.risk_level == "MEDIUM").count()
    low_risk = db.query(Employee).filter(Employee.risk_level == "LOW").count()
    avg_satisfaction = db.query(func.avg(Employee.satisfaction_level)).scalar() or 0.0

    return {
        "total_employees": total,
        "active_employees": active,
        "high_risk_count": high_risk,
        "medium_risk_count": medium_risk,
        "low_risk_count": low_risk,
        "average_satisfaction": round(float(avg_satisfaction) * 100, 1),
        "retention_health_score": round(100 - (high_risk / max(1, total) * 100), 1)
    }


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full employee profile by ID."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    dept = db.query(Department).filter(Department.id == emp.department_id).first()
    return EmployeeResponse(
        id=emp.id,
        user_id=emp.user_id,
        department_id=emp.department_id,
        first_name=emp.first_name,
        last_name=emp.last_name,
        email=emp.email,
        phone=emp.phone,
        job_title=emp.job_title,
        salary=emp.salary,
        hire_date=emp.hire_date,
        status=emp.status,
        satisfaction_level=emp.satisfaction_level,
        last_evaluation=emp.last_evaluation,
        number_of_projects=emp.number_of_projects,
        average_monthly_hours=emp.average_monthly_hours,
        time_spent_company=emp.time_spent_company,
        work_accident=emp.work_accident,
        promotion_last_5years=emp.promotion_last_5years,
        current_risk_score=emp.current_risk_score,
        risk_level=emp.risk_level,
        department_name=dept.name if dept else "Unassigned",
        created_at=emp.created_at
    )


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    emp_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR, UserRole.MANAGER]))
):
    """Add a new employee and calculate initial AI risk score."""
    existing = db.query(Employee).filter(Employee.email == emp_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this email already exists")

    dept = db.query(Department).filter(Department.id == emp_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Specified department does not exist")

    # Recalculate baseline risk score
    risk_score, risk_level = calculate_baseline_risk(
        satisfaction_level=emp_in.satisfaction_level or 0.70,
        average_monthly_hours=emp_in.average_monthly_hours or 180,
        number_of_projects=emp_in.number_of_projects or 3,
        time_spent_company=emp_in.time_spent_company or 3,
        promotion_last_5years=emp_in.promotion_last_5years or 0
    )

    new_emp = Employee(
        user_id=emp_in.user_id,
        department_id=emp_in.department_id,
        first_name=emp_in.first_name,
        last_name=emp_in.last_name,
        email=emp_in.email,
        phone=emp_in.phone,
        job_title=emp_in.job_title,
        salary=emp_in.salary,
        hire_date=emp_in.hire_date or date.today(),
        status=emp_in.status or "ACTIVE",
        satisfaction_level=emp_in.satisfaction_level or 0.70,
        last_evaluation=emp_in.last_evaluation or 0.75,
        number_of_projects=emp_in.number_of_projects or 3,
        average_monthly_hours=emp_in.average_monthly_hours or 180,
        time_spent_company=emp_in.time_spent_company or 3,
        work_accident=emp_in.work_accident or 0,
        promotion_last_5years=emp_in.promotion_last_5years or 0,
        current_risk_score=risk_score,
        risk_level=risk_level
    )
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    return EmployeeResponse(
        id=new_emp.id,
        user_id=new_emp.user_id,
        department_id=new_emp.department_id,
        first_name=new_emp.first_name,
        last_name=new_emp.last_name,
        email=new_emp.email,
        phone=new_emp.phone,
        job_title=new_emp.job_title,
        salary=new_emp.salary,
        hire_date=new_emp.hire_date,
        status=new_emp.status,
        satisfaction_level=new_emp.satisfaction_level,
        last_evaluation=new_emp.last_evaluation,
        number_of_projects=new_emp.number_of_projects,
        average_monthly_hours=new_emp.average_monthly_hours,
        time_spent_company=new_emp.time_spent_company,
        work_accident=new_emp.work_accident,
        promotion_last_5years=new_emp.promotion_last_5years,
        current_risk_score=new_emp.current_risk_score,
        risk_level=new_emp.risk_level,
        department_name=dept.name,
        created_at=new_emp.created_at
    )


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    emp_in: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR, UserRole.MANAGER]))
):
    """
    Update employee profile or performance metrics.
    Triggers automatic AI risk recalculation (Expected Flow).
    """
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = emp_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(emp, field, val)

    # Recalculate AI risk score on metric change
    risk_score, risk_level = calculate_baseline_risk(
        satisfaction_level=emp.satisfaction_level,
        average_monthly_hours=emp.average_monthly_hours,
        number_of_projects=emp.number_of_projects,
        time_spent_company=emp.time_spent_company,
        promotion_last_5years=emp.promotion_last_5years
    )
    emp.current_risk_score = risk_score
    emp.risk_level = risk_level

    db.commit()
    db.refresh(emp)

    dept = db.query(Department).filter(Department.id == emp.department_id).first()
    return EmployeeResponse(
        id=emp.id,
        user_id=emp.user_id,
        department_id=emp.department_id,
        first_name=emp.first_name,
        last_name=emp.last_name,
        email=emp.email,
        phone=emp.phone,
        job_title=emp.job_title,
        salary=emp.salary,
        hire_date=emp.hire_date,
        status=emp.status,
        satisfaction_level=emp.satisfaction_level,
        last_evaluation=emp.last_evaluation,
        number_of_projects=emp.number_of_projects,
        average_monthly_hours=emp.average_monthly_hours,
        time_spent_company=emp.time_spent_company,
        work_accident=emp.work_accident,
        promotion_last_5years=emp.promotion_last_5years,
        current_risk_score=emp.current_risk_score,
        risk_level=emp.risk_level,
        department_name=dept.name if dept else "Unassigned",
        created_at=emp.created_at
    )


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """Delete employee record (Restricted to ADMIN and HR)."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(emp)
    db.commit()
    return None
