from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.employee import Employee
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["Department & Role Management (Module 3)"])


@router.get("/", response_model=List[DepartmentResponse])
def list_departments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all departments with employee counts."""
    departments = db.query(Department).offset(skip).limit(limit).all()
    results = []
    for dept in departments:
        count = db.query(func.count(Employee.id)).filter(Employee.department_id == dept.id).scalar() or 0
        dept_data = DepartmentResponse(
            id=dept.id,
            name=dept.name,
            code=dept.code,
            description=dept.description,
            created_at=dept.created_at,
            employee_count=count
        )
        results.append(dept_data)
    return results


@router.get("/stats/summary")
def get_department_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Department Statistics: Headcount, average salary, and risk distribution per department."""
    departments = db.query(Department).all()
    stats = []
    for dept in departments:
        emp_query = db.query(Employee).filter(Employee.department_id == dept.id)
        count = emp_query.count()
        avg_salary = db.query(func.avg(Employee.salary)).filter(Employee.department_id == dept.id).scalar() or 0.0
        high_risk_count = emp_query.filter(Employee.risk_level == "HIGH").count()
        
        stats.append({
            "department_id": dept.id,
            "department_name": dept.name,
            "department_code": dept.code,
            "total_employees": count,
            "average_salary": round(float(avg_salary), 2),
            "high_risk_employees": high_risk_count
        })
    return {"total_departments": len(departments), "breakdown": stats}


@router.get("/{department_id}", response_model=DepartmentResponse)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single department details."""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    count = db.query(func.count(Employee.id)).filter(Employee.department_id == dept.id).scalar() or 0
    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        created_at=dept.created_at,
        employee_count=count
    )


@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """Create a new department (Restricted to ADMIN and HR)."""
    existing_name = db.query(Department).filter(Department.name == dept_in.name).first()
    if existing_name:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
    
    existing_code = db.query(Department).filter(Department.code == dept_in.code.upper()).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Department with this code already exists")

    dept = Department(
        name=dept_in.name,
        code=dept_in.code.upper(),
        description=dept_in.description
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    
    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        created_at=dept.created_at,
        employee_count=0
    )


@router.put("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    dept_in: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """Update department details (Restricted to ADMIN and HR)."""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    if dept_in.name is not None:
        dept.name = dept_in.name
    if dept_in.code is not None:
        dept.code = dept_in.code.upper()
    if dept_in.description is not None:
        dept.description = dept_in.description

    db.commit()
    db.refresh(dept)
    
    count = db.query(func.count(Employee.id)).filter(Employee.department_id == dept.id).scalar() or 0
    return DepartmentResponse(
        id=dept.id,
        name=dept.name,
        code=dept.code,
        description=dept.description,
        created_at=dept.created_at,
        employee_count=count
    )


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Delete department (Restricted to ADMIN)."""
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    db.delete(dept)
    db.commit()
    return None
