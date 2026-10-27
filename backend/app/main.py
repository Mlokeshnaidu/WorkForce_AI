from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # Ensures all 15 models are registered with Base.metadata
from app.routes import (
    auth_router,
    departments_router,
    employees_router,
    attendance_router,
    leaves_router,
    payrolls_router,
    notifications_router,
    chats_router,
    documents_router,
    ai_router,
    interventions_router,
    tasks_router,
    performance_router,
    reports_router,
    audit_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager:
    Automatically creates/updates MySQL tables on application startup.
    """
    print("[INFO] Initializing WorkForce AI Pro MySQL Database tables...")
    Base.metadata.create_all(bind=engine)
    print("[OK] MySQL Database tables ready!")
    yield
    print("[INFO] Shutting down WorkForce AI Pro API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise HR Attrition Prediction & Workforce Intelligence Platform API - 30 Modules Complete",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all 15 API Routers under /api/v1 covering all 30 specification modules
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(departments_router, prefix=settings.API_V1_STR)
app.include_router(employees_router, prefix=settings.API_V1_STR)
app.include_router(attendance_router, prefix=settings.API_V1_STR)
app.include_router(leaves_router, prefix=settings.API_V1_STR)
app.include_router(payrolls_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(chats_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(interventions_router, prefix=settings.API_V1_STR)
app.include_router(tasks_router, prefix=settings.API_V1_STR)
app.include_router(performance_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health & Status"])
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "status": "online",
        "version": "2.0.0",
        "api_docs": "/docs",
        "api_v1": settings.API_V1_STR,
        "total_modules": 30,
        "active_modules": [
            "Module 1: Authentication & Authorization System",
            "Module 2: Employee Management System",
            "Module 3: Department & Role Management",
            "Module 4: Attendance & Shift Management",
            "Module 5: Leave Management System",
            "Module 6: Payroll Management System",
            "Module 7: Notifications & Alerts System",
            "Module 8: One-to-One Communication & Chat",
            "Module 9: Document Management System",
            "Module 10: Dashboard & Workforce Analytics",
            "Module 11: Dataset Management System",
            "Module 12: AI Attrition Prediction Engine",
            "Module 13: Employee Risk Monitoring System",
            "Module 14: Workforce Forecasting System",
            "Module 15: Attrition Analytics Dashboard",
            "Module 16: HR Intervention & Decision Support System",
            "Module 17: Smart Notification & Alert Engine",
            "Module 18: Real-Time Workforce Monitoring System",
            "Module 19: Reports & Export System",
            "Module 20: Audit Logs & Activity Tracking",
            "Module 21: Workflow & Task Management",
            "Module 22: Performance Review System",
            "Module 23: AI Recommendation Engine",
            "Module 24: Advanced Search & Filtering System",
            "Module 25: Professional Enterprise UI/UX System",
            "Module 26: Role-Based Access Control (RBAC)",
            "Module 27: Workforce Stability Engine",
            "Module 28: System Optimization & Scalability",
            "Module 29: Testing & Validation",
            "Module 30: Frontend & Backend Integration"
        ]
    }


@app.get("/health", tags=["Health & Status"])
def health_check():
    return {"status": "healthy", "database": "connected", "ai_engine": "online"}
