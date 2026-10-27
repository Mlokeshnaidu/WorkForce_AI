import sys
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
import app.models  # Registers all models
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.employee import Employee
from app.models.attendance import Attendance, ShiftType, AttendanceStatus
from app.models.leave import Leave, LeaveType, LeaveStatus
from app.models.payroll import Payroll, PayrollStatus
from app.models.notification import Notification
from app.models.chat import ChatMessage
from app.models.document import Document, DocumentType
from app.core.security import get_password_hash
from app.routes.employees import calculate_baseline_risk


def seed_database():
    print("[INFO] Starting database seeding process...")
    # 1. Create all MySQL tables
    Base.metadata.create_all(bind=engine)
    print("[OK] Tables created/updated in MySQL.")

    db: Session = SessionLocal()
    try:
        # 2. Seed Users
        users_data = [
            ("admin@workforce.ai", "Admin@123", "Chief Admin", UserRole.ADMIN),
            ("hr@workforce.ai", "Hr@123", "Sarah Jenkins (HR Director)", UserRole.HR),
            ("manager@workforce.ai", "Manager@123", "David Chen (Engineering Manager)", UserRole.MANAGER),
            ("employee@workforce.ai", "Employee@123", "Alex Morgan", UserRole.EMPLOYEE),
        ]

        created_users = {}
        for email, pwd, name, role in users_data:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password=get_password_hash(pwd),
                    full_name=name,
                    role=role,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"   [USER] Created user: {email} [{role.value}]")
            created_users[email] = user

        # 3. Seed Departments
        dept_data = [
            ("Engineering", "ENG", "Core software development, cloud infrastructure, and AI engineering."),
            ("Human Resources", "HR", "People operations, talent acquisition, and workforce retention."),
            ("Sales & Business Dev", "SALES", "Revenue growth, enterprise client acquisition, and partnerships."),
            ("Marketing", "MKT", "Product marketing, brand growth, and digital campaigns."),
            ("Finance & Operations", "FIN", "Corporate accounting, financial planning, and compliance.")
        ]

        created_depts = {}
        for name, code, desc in dept_data:
            dept = db.query(Department).filter(Department.code == code).first()
            if not dept:
                dept = Department(name=name, code=code, description=desc)
                db.add(dept)
                db.commit()
                db.refresh(dept)
                print(f"   [DEPT] Created department: {name} ({code})")
            created_depts[code] = dept

        # 4. Seed Employees
        sample_employees = [
            {
                "first_name": "Ravi",
                "last_name": "Kumar",
                "email": "ravi.kumar@workforce.ai",
                "phone": "+1-555-0101",
                "job_title": "Senior Backend Architect",
                "salary": 135000.0,
                "dept_code": "ENG",
                "satisfaction_level": 0.22,
                "last_evaluation": 0.88,
                "number_of_projects": 6,
                "average_monthly_hours": 275,
                "time_spent_company": 4,
                "promotion_last_5years": 0
            },
            {
                "first_name": "Chaithanya",
                "last_name": "Reddy",
                "email": "chaithanya.reddy@workforce.ai",
                "phone": "+1-555-0102",
                "job_title": "Enterprise Account Executive",
                "salary": 92000.0,
                "dept_code": "SALES",
                "satisfaction_level": 0.28,
                "last_evaluation": 0.82,
                "number_of_projects": 5,
                "average_monthly_hours": 260,
                "time_spent_company": 3,
                "promotion_last_5years": 0
            },
            {
                "first_name": "Kiran",
                "last_name": "Patel",
                "email": "kiran.patel@workforce.ai",
                "phone": "+1-555-0103",
                "job_title": "Full Stack Developer",
                "salary": 98000.0,
                "dept_code": "ENG",
                "satisfaction_level": 0.52,
                "last_evaluation": 0.70,
                "number_of_projects": 4,
                "average_monthly_hours": 210,
                "time_spent_company": 2,
                "promotion_last_5years": 0
            },
            {
                "first_name": "Ujjwal",
                "last_name": "Singh",
                "email": "ujjwal.singh@workforce.ai",
                "phone": "+1-555-0104",
                "job_title": "Talent Acquisition Specialist",
                "salary": 75000.0,
                "dept_code": "HR",
                "satisfaction_level": 0.58,
                "last_evaluation": 0.76,
                "number_of_projects": 3,
                "average_monthly_hours": 195,
                "time_spent_company": 3,
                "promotion_last_5years": 0
            },
            {
                "first_name": "Sudeep",
                "last_name": "Nair",
                "email": "sudeep.nair@workforce.ai",
                "phone": "+1-555-0105",
                "job_title": "Engineering Manager",
                "salary": 150000.0,
                "dept_code": "ENG",
                "satisfaction_level": 0.89,
                "last_evaluation": 0.94,
                "number_of_projects": 4,
                "average_monthly_hours": 175,
                "time_spent_company": 5,
                "promotion_last_5years": 1
            },
            {
                "first_name": "Krishan",
                "last_name": "Gupta",
                "email": "krishan.gupta@workforce.ai",
                "phone": "+1-555-0106",
                "job_title": "HR Director",
                "salary": 128000.0,
                "dept_code": "HR",
                "satisfaction_level": 0.85,
                "last_evaluation": 0.91,
                "number_of_projects": 3,
                "average_monthly_hours": 165,
                "time_spent_company": 4,
                "promotion_last_5years": 1
            },
            {
                "first_name": "Banu",
                "last_name": "Prakash",
                "email": "banu.prakash@workforce.ai",
                "phone": "+1-555-0107",
                "job_title": "Growth Marketing Lead",
                "salary": 88000.0,
                "dept_code": "MKT",
                "satisfaction_level": 0.78,
                "last_evaluation": 0.80,
                "number_of_projects": 3,
                "average_monthly_hours": 170,
                "time_spent_company": 2,
                "promotion_last_5years": 0
            },
            {
                "first_name": "Sekhar",
                "last_name": "Chandra",
                "email": "sekhar.chandra@workforce.ai",
                "phone": "+1-555-0108",
                "job_title": "Financial Analyst",
                "salary": 82000.0,
                "dept_code": "FIN",
                "satisfaction_level": 0.74,
                "last_evaluation": 0.77,
                "number_of_projects": 3,
                "average_monthly_hours": 180,
                "time_spent_company": 2,
                "promotion_last_5years": 0
            }
        ]

        created_employees = []
        for item in sample_employees:
            emp = db.query(Employee).filter(Employee.email == item["email"]).first()
            if not emp:
                dept = created_depts[item["dept_code"]]
                risk_score, risk_level = calculate_baseline_risk(
                    satisfaction_level=item["satisfaction_level"],
                    average_monthly_hours=item["average_monthly_hours"],
                    number_of_projects=item["number_of_projects"],
                    time_spent_company=item["time_spent_company"],
                    promotion_last_5years=item["promotion_last_5years"]
                )
                emp = Employee(
                    department_id=dept.id,
                    first_name=item["first_name"],
                    last_name=item["last_name"],
                    email=item["email"],
                    phone=item["phone"],
                    job_title=item["job_title"],
                    salary=item["salary"],
                    hire_date=date(2023, 1, 15),
                    status="ACTIVE",
                    satisfaction_level=item["satisfaction_level"],
                    last_evaluation=item["last_evaluation"],
                    number_of_projects=item["number_of_projects"],
                    average_monthly_hours=item["average_monthly_hours"],
                    time_spent_company=item["time_spent_company"],
                    work_accident=0,
                    promotion_last_5years=item["promotion_last_5years"],
                    current_risk_score=risk_score,
                    risk_level=risk_level
                )
                db.add(emp)
                db.commit()
                db.refresh(emp)
                print(f"   [EMP] Created employee: {item['first_name']} {item['last_name']}")
            created_employees.append(emp)

        # 5. Seed Attendance (Module 4)
        today = date.today()
        yesterday = today - timedelta(days=1)
        for emp in created_employees[:5]:
            att = db.query(Attendance).filter(Attendance.employee_id == emp.id, Attendance.date == today).first()
            if not att:
                db.add(Attendance(
                    employee_id=emp.id,
                    date=today,
                    check_in=datetime.now(timezone.utc) - timedelta(hours=4),
                    shift_type=ShiftType.MORNING,
                    status=AttendanceStatus.PRESENT,
                    work_hours=4.0
                ))
            att_y = db.query(Attendance).filter(Attendance.employee_id == emp.id, Attendance.date == yesterday).first()
            if not att_y:
                db.add(Attendance(
                    employee_id=emp.id,
                    date=yesterday,
                    check_in=datetime.now(timezone.utc) - timedelta(days=1, hours=8),
                    check_out=datetime.now(timezone.utc) - timedelta(days=1),
                    shift_type=ShiftType.MORNING,
                    status=AttendanceStatus.PRESENT,
                    work_hours=9.5,
                    overtime_hours=1.5
                ))
        print("   [ATTENDANCE] Seeded active attendance records")

        # 6. Seed Leaves (Module 5)
        if created_employees:
            emp_marcus = created_employees[0]
            if not db.query(Leave).filter(Leave.employee_id == emp_marcus.id).first():
                db.add(Leave(
                    employee_id=emp_marcus.id,
                    leave_type=LeaveType.ANNUAL,
                    start_date=today + timedelta(days=5),
                    end_date=today + timedelta(days=8),
                    days_count=4.0,
                    reason="Annual family vacation and rest",
                    status=LeaveStatus.PENDING
                ))
            emp_elena = created_employees[1]
            if not db.query(Leave).filter(Leave.employee_id == emp_elena.id).first():
                db.add(Leave(
                    employee_id=emp_elena.id,
                    leave_type=LeaveType.SICK,
                    start_date=yesterday,
                    end_date=yesterday,
                    days_count=1.0,
                    reason="Medical doctor appointment",
                    status=LeaveStatus.APPROVED,
                    reviewed_by=created_users["hr@workforce.ai"].id,
                    review_notes="Approved medical leave with certificate"
                ))
        print("   [LEAVES] Seeded leave requests and approvals")

        # 7. Seed Payrolls (Module 6)
        current_month = today.month
        current_year = today.year
        for emp in created_employees:
            if not db.query(Payroll).filter(Payroll.employee_id == emp.id, Payroll.month == current_month).first():
                base = round(emp.salary / 12.0, 2)
                allowance = round(base * 0.15, 2)
                bonus = round(base * 0.10, 2) if emp.last_evaluation >= 0.85 else 0.0
                tax = round((base + allowance + bonus) * 0.12, 2)
                net = round(base + allowance + bonus - tax, 2)
                db.add(Payroll(
                    employee_id=emp.id,
                    month=current_month,
                    year=current_year,
                    base_salary=base,
                    allowances=allowance,
                    bonuses=bonus,
                    tax_deductions=tax,
                    net_salary=net,
                    status=PayrollStatus.PAID if emp.id % 2 == 0 else PayrollStatus.PENDING,
                    payment_date=today if emp.id % 2 == 0 else None
                ))
        print("   [PAYROLL] Seeded monthly payrolls")

        # 8. Seed Notifications (Module 7)
        admin_user = created_users["admin@workforce.ai"]
        hr_user = created_users["hr@workforce.ai"]
        if not db.query(Notification).filter(Notification.user_id == hr_user.id).first():
            db.add(Notification(
                user_id=hr_user.id,
                title="Critical Attrition Risk Alert",
                message="Employee Ravi Kumar detected with 90% attrition probability. High overtime logged.",
                type="RISK_ALERT",
                is_read=False
            ))
            db.add(Notification(
                user_id=hr_user.id,
                title="New Leave Request Pending",
                message="Ravi Kumar applied for 4 days of Annual Leave.",
                type="LEAVE",
                is_read=False
            ))
        print("   [NOTIFICATIONS] Seeded alert notifications")

        # 9. Seed Chat Messages (Module 8)
        if not db.query(ChatMessage).first():
            db.add(ChatMessage(
                sender_id=hr_user.id,
                receiver_id=admin_user.id,
                message="Hello Admin, I have initiated retention follow-ups for high-risk engineers.",
                is_read=True
            ))
            db.add(ChatMessage(
                sender_id=admin_user.id,
                receiver_id=hr_user.id,
                message="Understood, please review Ravi Kumar's workload and project allocations.",
                is_read=False
            ))
        print("   [CHATS] Seeded direct messages")

        # 10. Seed Documents (Module 9)
        if created_employees and not db.query(Document).first():
            db.add(Document(
                employee_id=created_employees[0].id,
                title="Employment Contract - Ravi Kumar",
                document_type=DocumentType.CONTRACT,
                file_name="contract_ravi_kumar.pdf",
                file_url="https://workforce.ai/docs/contract_ravi.pdf",
                file_size_kb=340.5
            ))
            db.add(Document(
                employee_id=created_employees[1].id,
                title="Sales Performance Review Q3",
                document_type=DocumentType.PERFORMANCE,
                file_name="chaithanya_q3_eval.pdf",
                file_url="https://workforce.ai/docs/chaithanya_q3.pdf",
                file_size_kb=180.2
            ))
        print("   [DOCUMENTS] Seeded employee documents")

        # 11. Seed Tasks (Module 20)
        from app.models.task import Task, TaskPriority, TaskStatus
        if created_employees and not db.query(Task).first():
            db.add(Task(
                title="Conduct Retention 1-on-1 with Ravi Kumar",
                description="Address high overtime workload (260 hours) and discuss project allocation adjustments.",
                category="RETENTION",
                priority=TaskPriority.CRITICAL,
                status=TaskStatus.IN_PROGRESS,
                assigned_to=hr_user.id,
                created_by=admin_user.id,
                employee_id=created_employees[0].id,
                due_date=datetime.now(timezone.utc) + timedelta(days=2)
            ))
            db.add(Task(
                title="Q1 Engineering Compensation Benchmarking",
                description="Review market competitive pay bands for Senior Cloud Architects.",
                category="COMPLIANCE",
                priority=TaskPriority.HIGH,
                status=TaskStatus.PENDING,
                assigned_to=hr_user.id,
                created_by=admin_user.id,
                due_date=datetime.now(timezone.utc) + timedelta(days=5)
            ))
            db.add(Task(
                title="Complete Onboarding Checklist - New Junior Analyst",
                description="Verify identity documents, issue credentials, and assign mentor.",
                category="ONBOARDING",
                priority=TaskPriority.MEDIUM,
                status=TaskStatus.COMPLETED,
                assigned_to=hr_user.id,
                created_by=admin_user.id,
                completed_at=datetime.now(timezone.utc) - timedelta(days=1)
            ))
        print("   [TASKS] Seeded HR tasks and workflows")

        # 12. Seed Interventions (Module 18 & 21)
        from app.models.intervention import Intervention, InterventionStatus
        if created_employees and not db.query(Intervention).first():
            db.add(Intervention(
                employee_id=created_employees[0].id,
                created_by=hr_user.id,
                strategy_type="WORKLOAD_REDUCTION",
                title="Ravi Kumar Workload Normalization & Mentorship",
                description="Cap concurrent project deliverables to 3 milestones and reassign secondary tickets.",
                initial_risk_score=0.82,
                target_risk_score=0.25,
                current_risk_score=0.45,
                cost_budget=3500.0,
                status=InterventionStatus.IN_PROGRESS
            ))
            if len(created_employees) > 1:
                db.add(Intervention(
                    employee_id=created_employees[1].id,
                    created_by=hr_user.id,
                    strategy_type="SALARY_INCREMENT",
                    title="Chaithanya Reddy Enterprise Commission Adjustment",
                    description="Boost incentive commission tier to align with Q3 enterprise client acquisitions.",
                    initial_risk_score=0.68,
                    target_risk_score=0.20,
                    current_risk_score=0.18,
                    cost_budget=8000.0,
                    status=InterventionStatus.SUCCESSFUL,
                    outcome_notes="Retention confirmed; Chaithanya accepted updated comp package."
                ))
        print("   [INTERVENTIONS] Seeded retention interventions")

        # 13. Seed Performance Reviews (Module 22)
        from app.models.performance import PerformanceReview
        manager_user = created_users.get("manager@workforce.ai") or admin_user
        if created_employees and not db.query(PerformanceReview).first():
            for i, emp in enumerate(created_employees[:4]):
                ratings = [4.5, 4.8, 3.9, 4.2]
                db.add(PerformanceReview(
                    employee_id=emp.id,
                    reviewer_id=manager_user.id,
                    review_period="Annual 2025",
                    rating=ratings[i % len(ratings)],
                    goals_met_percent=95.0,
                    strengths="Strong technical leadership, exceptional delivery quality.",
                    areas_for_improvement="Maintain work-life balance and avoid excessive crunch.",
                    comments="Valued team contributor with outstanding core competencies.",
                    review_date=date.today() - timedelta(days=30)
                ))
        print("   [PERFORMANCE] Seeded performance reviews")

        # 14. Seed Audit Logs (Module 27)
        from app.models.audit_log import AuditLog
        if not db.query(AuditLog).first():
            db.add(AuditLog(
                user_id=admin_user.id,
                action="LOGIN",
                entity="Auth",
                entity_id=str(admin_user.id),
                details="Administrator logged in from executive terminal.",
                ip_address="192.168.1.10"
            ))
            db.add(AuditLog(
                user_id=hr_user.id,
                action="UPDATE",
                entity="Employee",
                entity_id="1",
                details="Updated employee project load and initiated retention intervention.",
                ip_address="192.168.1.15"
            ))
            db.add(AuditLog(
                user_id=admin_user.id,
                action="RETRAIN",
                entity="MLModelArtifact",
                entity_id="v1.2.0",
                details="Retrained Random Forest attrition model on 1,600 samples.",
                ip_address="127.0.0.1"
            ))
        print("   [AUDIT] Seeded compliance audit trail")

        # 15. Seed ML Model Artifact (Module 12)
        from app.models.ml_model import MLModelArtifact
        if not db.query(MLModelArtifact).first():
            db.add(MLModelArtifact(
                model_name="WorkForce Random Forest Attrition Predictor",
                version="v1.2.0",
                algorithm="RandomForestClassifier",
                accuracy=0.942,
                precision_score=0.925,
                recall_score=0.898,
                f1_score=0.911,
                roc_auc=0.963,
                training_sample_count=1600,
                feature_importances={
                    "satisfaction_level": 0.32,
                    "average_monthly_hours": 0.22,
                    "time_spent_company": 0.16,
                    "number_of_projects": 0.12,
                    "last_evaluation": 0.08,
                    "salary_level": 0.06,
                    "promotion_last_5years": 0.03,
                    "work_accident": 0.01
                },
                is_active=True
            ))
        print("   [ML] Seeded ML model artifact")

        db.commit()
        print("[SUCCESS] All 30-Module Enterprise database records seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during seeding: {e}")
        raise e
    finally:
        db.close()



if __name__ == "__main__":
    seed_database()
