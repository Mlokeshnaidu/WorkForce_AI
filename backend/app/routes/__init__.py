from app.routes.auth import router as auth_router
from app.routes.departments import router as departments_router
from app.routes.employees import router as employees_router
from app.routes.attendance import router as attendance_router
from app.routes.leaves import router as leaves_router
from app.routes.payrolls import router as payrolls_router
from app.routes.notifications import router as notifications_router
from app.routes.chats import router as chats_router
from app.routes.documents import router as documents_router
from app.routes.ai_analytics import router as ai_router
from app.routes.interventions import router as interventions_router
from app.routes.tasks import router as tasks_router
from app.routes.performance import router as performance_router
from app.routes.reports import router as reports_router
from app.routes.audit import router as audit_router

__all__ = [
    "auth_router",
    "departments_router",
    "employees_router",
    "attendance_router",
    "leaves_router",
    "payrolls_router",
    "notifications_router",
    "chats_router",
    "documents_router",
    "ai_router",
    "interventions_router",
    "tasks_router",
    "performance_router",
    "reports_router",
    "audit_router"
]
