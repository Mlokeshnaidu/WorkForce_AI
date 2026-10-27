import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
import pandas as pd

from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.department import Department
from app.models.payroll import Payroll
from app.models.attendance import Attendance
from app.models.risk_log import RiskAssessmentLog
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/reports", tags=["Report Generation & Export Center (Module 19)"])


@router.get("/summary")
def get_reports_summary(current_user: User = Depends(get_current_user)):
    """
    Module 19: Report catalog metadata covering CSV, Excel, and PDF formats.
    """
    return [
        {
            "id": "employees",
            "name": "Workforce Master Directory",
            "description": "Comprehensive employee roster including salary, department, tenure, and AI attrition metrics.",
            "formats": ["CSV", "EXCEL", "PDF"],
            "endpoints": {
                "CSV": "/api/v1/reports/employees/csv",
                "EXCEL": "/api/v1/reports/employees/excel",
                "PDF": "/api/v1/reports/employees/pdf"
            }
        },
        {
            "id": "attrition_risk",
            "name": "AI Flight Risk & Retention Report",
            "description": "Prioritized list of employees at flight risk with top risk factors and AI recommendations.",
            "formats": ["CSV", "EXCEL", "PDF"],
            "endpoints": {
                "CSV": "/api/v1/reports/attrition-risks/csv",
                "EXCEL": "/api/v1/reports/attrition-risks/excel",
                "PDF": "/api/v1/reports/attrition-risks/pdf"
            }
        },
        {
            "id": "payroll",
            "name": "Payroll & Compensation Ledger",
            "description": "Historical disbursement records, allowances, tax deductions, and net payouts.",
            "formats": ["CSV", "EXCEL"],
            "endpoints": {
                "CSV": "/api/v1/reports/payroll/csv",
                "EXCEL": "/api/v1/reports/payroll/excel"
            }
        },
        {
            "id": "attendance",
            "name": "Attendance & Overtime Ledger",
            "description": "Daily clock-in/out records, shift assignments, productive hours, and overtime telemetry.",
            "formats": ["CSV", "EXCEL"],
            "endpoints": {
                "CSV": "/api/v1/reports/attendance/csv",
                "EXCEL": "/api/v1/reports/attendance/excel"
            }
        },
        {
            "id": "audit_trail",
            "name": "Enterprise Audit & Compliance Log",
            "description": "Security logs of administrative operations, model retraining events, and logins.",
            "formats": ["CSV"],
            "endpoints": {
                "CSV": "/api/v1/reports/audit/csv"
            }
        }
    ]


@router.get("/employees/csv")
def export_employees_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """Exports workforce roster as CSV download."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Employee ID", "First Name", "Last Name", "Email", "Job Title",
        "Department", "Salary", "Status", "Risk Score", "Risk Level",
        "Satisfaction", "Last Evaluation", "Projects", "Monthly Hours", "Tenure"
    ])

    employees = db.query(Employee).all()
    for e in employees:
        dept = db.query(Department).filter(Department.id == e.department_id).first()
        writer.writerow([
            e.id, e.first_name, e.last_name, e.email, e.job_title,
            dept.name if dept else "N/A", e.salary, e.status,
            e.current_risk_score, e.risk_level, e.satisfaction_level,
            e.last_evaluation, e.number_of_projects, e.average_monthly_hours,
            e.time_spent_company
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=workforce_master_report.csv"}
    )


@router.get("/employees/excel")
def export_employees_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """Module 19: Exports workforce roster as Excel (.xlsx) spreadsheet."""
    employees = db.query(Employee).all()
    data = []
    for e in employees:
        dept = db.query(Department).filter(Department.id == e.department_id).first()
        data.append({
            "Employee ID": e.id,
            "First Name": e.first_name,
            "Last Name": e.last_name,
            "Email": e.email,
            "Job Title": e.job_title,
            "Department": dept.name if dept else "N/A",
            "Salary (₹)": e.salary,
            "Status": e.status,
            "Risk Score": e.current_risk_score,
            "Risk Level": e.risk_level,
            "Satisfaction Level": e.satisfaction_level,
            "Last Evaluation": e.last_evaluation,
            "Monthly Hours": e.average_monthly_hours,
            "Tenure (Years)": e.time_spent_company
        })

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Workforce Directory")
    excel_data = output.getvalue()

    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=workforce_master_report.xlsx"}
    )


@router.get("/employees/pdf")
def export_employees_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """Module 19: Exports workforce roster as printable PDF document."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=14
    )
    elements.append(Paragraph("WorkForce AI Pro — Master Workforce Directory", title_style))
    elements.append(Paragraph("Enterprise Human Resources Intelligence Platform", styles['Normal']))
    elements.append(Spacer(1, 15))

    employees = db.query(Employee).limit(60).all()
    table_data = [["ID", "Name", "Department", "Job Title", "Salary (Rs.)", "Risk Level", "Risk Score", "Status"]]
    for e in employees:
        dept = db.query(Department).filter(Department.id == e.department_id).first()
        table_data.append([
            str(e.id),
            f"{e.first_name} {e.last_name}",
            dept.name if dept else "N/A",
            e.job_title[:20],
            f"Rs. {e.salary:,.0f}",
            e.risk_level,
            f"{e.current_risk_score * 100:.1f}%",
            e.status
        ])

    table = Table(table_data, colWidths=[35, 120, 100, 130, 80, 80, 75, 75])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(table)
    doc.build(elements)
    pdf_data = buffer.getvalue()

    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=workforce_master_report.pdf"}
    )


@router.get("/attrition-risks/csv")
def export_attrition_risks_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """Exports prioritized high/medium flight risk employees with AI factors as CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Employee ID", "Name", "Department", "Job Title", "Risk Score",
        "Risk Level", "Top Factors", "Recommended Retention Action"
    ])

    employees = db.query(Employee).filter(Employee.status == "ACTIVE").order_by(Employee.current_risk_score.desc()).all()
    for e in employees:
        dept = db.query(Department).filter(Department.id == e.department_id).first()
        latest_log = db.query(RiskAssessmentLog).filter(RiskAssessmentLog.employee_id == e.id).order_by(RiskAssessmentLog.assessed_at.desc()).first()
        factors_str = "; ".join(latest_log.top_factors) if latest_log and latest_log.top_factors else "Standard risk profile"
        rec_str = latest_log.recommendation if latest_log else "Monitor quarterly"
        
        writer.writerow([
            e.id, f"{e.first_name} {e.last_name}", dept.name if dept else "N/A",
            e.job_title, e.current_risk_score, e.risk_level, factors_str, rec_str
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ai_attrition_risk_report.csv"}
    )


@router.get("/attrition-risks/excel")
def export_attrition_risks_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """Module 19: Exports AI Flight Risk Intelligence as Excel (.xlsx) spreadsheet."""
    employees = db.query(Employee).filter(Employee.status == "ACTIVE").order_by(Employee.current_risk_score.desc()).all()
    data = []
    for e in employees:
        dept = db.query(Department).filter(Department.id == e.department_id).first()
        latest_log = db.query(RiskAssessmentLog).filter(RiskAssessmentLog.employee_id == e.id).order_by(RiskAssessmentLog.assessed_at.desc()).first()
        data.append({
            "Employee ID": e.id,
            "Name": f"{e.first_name} {e.last_name}",
            "Department": dept.name if dept else "N/A",
            "Job Title": e.job_title,
            "Risk Score": e.current_risk_score,
            "Risk Level": e.risk_level,
            "Top Behavioral Factors": "; ".join(latest_log.top_factors) if latest_log and latest_log.top_factors else "None",
            "Recommended Action": latest_log.recommendation if latest_log else "Monitor quarterly"
        })

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Flight Risk Analysis")
    excel_data = output.getvalue()

    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ai_attrition_risk_report.xlsx"}
    )


@router.get("/attrition-risks/pdf")
def export_attrition_risks_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """Module 19: Exports AI Flight Risk Intelligence as PDF document."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#e11d48'),
        spaceAfter=14
    )
    elements.append(Paragraph("WorkForce AI Pro — Employee Flight Risk & Retention Report", title_style))
    elements.append(Paragraph("Generated by 120-Tree Random Forest Machine Learning Attrition Engine", styles['Normal']))
    elements.append(Spacer(1, 15))

    employees = db.query(Employee).filter(Employee.status == "ACTIVE").order_by(Employee.current_risk_score.desc()).limit(40).all()
    table_data = [["ID", "Name", "Department", "Role", "Risk %", "Tier", "Top Signal", "Prescriptive Retention Action"]]
    for e in employees:
        dept = db.query(Department).filter(Department.id == e.department_id).first()
        latest_log = db.query(RiskAssessmentLog).filter(RiskAssessmentLog.employee_id == e.id).order_by(RiskAssessmentLog.assessed_at.desc()).first()
        top_factor = latest_log.top_factors[0] if latest_log and latest_log.top_factors else "Normal profile"
        rec = latest_log.recommendation[:40] if latest_log else "Monitor quarterly"

        table_data.append([
            str(e.id),
            f"{e.first_name} {e.last_name}",
            dept.name if dept else "N/A",
            e.job_title[:18],
            f"{e.current_risk_score * 100:.1f}%",
            e.risk_level,
            top_factor[:30],
            rec
        ])

    table = Table(table_data, colWidths=[30, 110, 95, 105, 55, 60, 140, 150])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#881337')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#fda4af')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fff1f2')]),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(table)
    doc.build(elements)
    pdf_data = buffer.getvalue()

    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=ai_attrition_risk_report.pdf"}
    )


@router.get("/payroll/csv")
def export_payroll_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """Exports payroll ledger as CSV download."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Payroll ID", "Employee ID", "Name", "Month", "Year",
        "Basic Salary", "Allowances", "Deductions", "Net Salary", "Payment Status"
    ])

    payrolls = db.query(Payroll).order_by(Payroll.year.desc(), Payroll.month.desc()).all()
    for p in payrolls:
        emp = db.query(Employee).filter(Employee.id == p.employee_id).first()
        writer.writerow([
            p.id, p.employee_id, f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            p.month, p.year, p.base_salary, p.allowances, p.tax_deductions,
            p.net_salary, p.status.value if hasattr(p.status, "value") else str(p.status)
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=payroll_ledger_report.csv"}
    )


@router.get("/payroll/excel")
def export_payroll_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """Module 19: Exports payroll ledger as Excel (.xlsx) spreadsheet."""
    payrolls = db.query(Payroll).order_by(Payroll.year.desc(), Payroll.month.desc()).all()
    data = []
    for p in payrolls:
        emp = db.query(Employee).filter(Employee.id == p.employee_id).first()
        data.append({
            "Payroll ID": p.id,
            "Employee ID": p.employee_id,
            "Employee Name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "Month": p.month,
            "Year": p.year,
            "Base Salary (₹)": p.base_salary,
            "Allowances (₹)": p.allowances,
            "Bonuses (₹)": p.bonuses,
            "Tax Deductions (₹)": p.tax_deductions,
            "Net Payout (₹)": p.net_salary,
            "Payment Status": p.status.value if hasattr(p.status, "value") else str(p.status),
            "Payment Date": p.payment_date.isoformat() if p.payment_date else "Pending"
        })

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Payroll Disbursements")
    excel_data = output.getvalue()

    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=payroll_ledger_report.xlsx"}
    )


@router.get("/attendance/csv")
def export_attendance_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """Module 19: Exports Attendance & Overtime Ledger as CSV download."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Record ID", "Employee ID", "Employee Name", "Date",
        "Shift", "Check In", "Check Out", "Work Hours", "Overtime Hours", "Status"
    ])

    records = db.query(Attendance).order_by(Attendance.date.desc()).limit(1000).all()
    for r in records:
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
        writer.writerow([
            r.id, r.employee_id, f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            r.date.isoformat() if r.date else "",
            r.shift_type.value if hasattr(r.shift_type, "value") else str(r.shift_type),
            r.check_in.isoformat() if r.check_in else "N/A",
            r.check_out.isoformat() if r.check_out else "N/A",
            r.work_hours, r.overtime_hours,
            r.status.value if hasattr(r.status, "value") else str(r.status)
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_ledger_report.csv"}
    )


@router.get("/attendance/excel")
def export_attendance_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """Module 19: Exports Attendance & Overtime Ledger as Excel spreadsheet."""
    records = db.query(Attendance).order_by(Attendance.date.desc()).limit(1000).all()
    data = []
    for r in records:
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
        data.append({
            "Record ID": r.id,
            "Employee ID": r.employee_id,
            "Employee Name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            "Date": r.date.isoformat() if r.date else "",
            "Shift Type": r.shift_type.value if hasattr(r.shift_type, "value") else str(r.shift_type),
            "Check-In": r.check_in.isoformat() if r.check_in else "N/A",
            "Check-Out": r.check_out.isoformat() if r.check_out else "N/A",
            "Work Hours": r.work_hours,
            "Overtime Hours": r.overtime_hours,
            "Status": r.status.value if hasattr(r.status, "value") else str(r.status)
        })

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Attendance & Overtime")
    excel_data = output.getvalue()

    return Response(
        content=excel_data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=attendance_ledger_report.xlsx"}
    )


@router.get("/audit/csv")
def export_audit_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Exports compliance audit log as CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Log ID", "User ID", "Action", "Entity", "Entity ID", "Details", "Timestamp"])

    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(1000).all()
    for l in logs:
        writer.writerow([
            l.id, l.user_id, l.action, l.entity, l.entity_id, l.details,
            l.created_at.isoformat() if l.created_at else ""
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=compliance_audit_log.csv"}
    )
