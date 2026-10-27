from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/tasks", tags=["Task & Workflow Management"])


@router.get("/")
def list_tasks(
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    assigned_to: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Module 20: Lists all workflows, retention checklists, and HR operational tasks.
    """
    query = db.query(Task)
    if category:
        query = query.filter(Task.category == category)
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if assigned_to:
        query = query.filter(Task.assigned_to == assigned_to)

    tasks = query.order_by(Task.created_at.desc()).all()
    results = []
    for t in tasks:
        emp = db.query(Employee).filter(Employee.id == t.employee_id).first() if t.employee_id else None
        assignee = db.query(User).filter(User.id == t.assigned_to).first() if t.assigned_to else None
        results.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "priority": t.priority.value if hasattr(t.priority, "value") else str(t.priority),
            "status": t.status.value if hasattr(t.status, "value") else str(t.status),
            "assigned_to": t.assigned_to,
            "assignee_name": assignee.full_name if assignee else "Unassigned",
            "employee_id": t.employee_id,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else None,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
            "created_at": t.created_at.isoformat() if t.created_at else None
        })
    return results


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_task(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new HR workflow or retention task.
    """
    title = payload.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")

    priority_str = payload.get("priority", "MEDIUM")
    priority_enum = getattr(TaskPriority, priority_str, TaskPriority.MEDIUM)

    due_dt = None
    if payload.get("due_date"):
        try:
            due_dt = datetime.fromisoformat(payload["due_date"].replace("Z", "+00:00"))
        except Exception:
            pass

    new_task = Task(
        title=title,
        description=payload.get("description", ""),
        category=payload.get("category", "HR_OPERATION"),
        priority=priority_enum,
        status=TaskStatus.PENDING,
        assigned_to=payload.get("assigned_to", current_user.id),
        created_by=current_user.id,
        employee_id=payload.get("employee_id"),
        due_date=due_dt
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return {"message": "Task created successfully", "id": new_task.id}


@router.put("/{task_id}")
def update_task(
    task_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates status, assignee, or completion timestamp.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if "status" in payload:
        new_status = payload["status"]
        task.status = getattr(TaskStatus, new_status, task.status)
        if new_status == "COMPLETED":
            task.completed_at = datetime.now(timezone.utc)
    if "priority" in payload:
        task.priority = getattr(TaskPriority, payload["priority"], task.priority)
    if "assigned_to" in payload:
        task.assigned_to = payload["assigned_to"]
    if "title" in payload:
        task.title = payload["title"]
    if "description" in payload:
        task.description = payload["description"]

    db.commit()
    return {"message": "Task updated successfully"}


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}


@router.get("/stats")
def get_task_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tasks = db.query(Task).all()
    total = len(tasks)
    pending = sum(1 for t in tasks if str(t.status) in ["TaskStatus.PENDING", "PENDING"])
    in_progress = sum(1 for t in tasks if str(t.status) in ["TaskStatus.IN_PROGRESS", "IN_PROGRESS"])
    completed = sum(1 for t in tasks if str(t.status) in ["TaskStatus.COMPLETED", "COMPLETED"])

    return {
        "total_tasks": total,
        "pending": pending,
        "in_progress": in_progress,
        "completed": completed
    }
