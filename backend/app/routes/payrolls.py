from typing import List, Optional
from datetime import date
import io
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.department import Department
from app.models.payroll import Payroll, PayrollStatus
from app.schemas.payroll import PayrollGenerate, PayrollUpdateStatus, PayrollResponse

router = APIRouter(prefix="/payrolls", tags=["Payroll Management System (Module 6)"])


@router.post("/generate", response_model=List[PayrollResponse])
def generate_monthly_payroll(
    data: PayrollGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """
    Generate payroll for all active employees for specified month and year.
    Calculates Base, Allowances (15%), Deductions (12%), and Net Pay.
    """
    active_employees = db.query(Employee).filter(Employee.status == "ACTIVE").all()
    created_payrolls = []

    for emp in active_employees:
        existing = db.query(Payroll).filter(
            Payroll.employee_id == emp.id,
            Payroll.month == data.month,
            Payroll.year == data.year
        ).first()

        if existing:
            created_payrolls.append(existing)
            continue

        monthly_base = round(emp.salary / 12.0, 2)
        allowance = round(monthly_base * 0.15, 2)
        bonus = 0.0
        # If employee has high evaluation, add performance bonus
        if emp.last_evaluation >= 0.85:
            bonus = round(monthly_base * 0.10, 2)

        gross = monthly_base + allowance + bonus
        tax = round(gross * 0.12, 2)
        net = round(gross - tax, 2)

        payroll = Payroll(
            employee_id=emp.id,
            month=data.month,
            year=data.year,
            base_salary=monthly_base,
            allowances=allowance,
            bonuses=bonus,
            tax_deductions=tax,
            net_salary=net,
            status=PayrollStatus.PENDING
        )
        db.add(payroll)
        created_payrolls.append(payroll)

    db.commit()

    # Format response
    results = []
    for p in created_payrolls:
        db.refresh(p)
        emp = db.query(Employee).filter(Employee.id == p.employee_id).first()
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp else None
        results.append(PayrollResponse(
            id=p.id,
            employee_id=p.employee_id,
            month=p.month,
            year=p.year,
            base_salary=p.base_salary,
            allowances=p.allowances,
            bonuses=p.bonuses,
            tax_deductions=p.tax_deductions,
            net_salary=p.net_salary,
            status=p.status,
            payment_date=p.payment_date,
            created_at=p.created_at,
            employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            job_title=emp.job_title if emp else None,
            department_name=dept.name if dept else None
        ))
    return results


@router.get("/", response_model=List[PayrollResponse])
def list_payrolls(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    employee_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List payroll records with multi-filter support."""
    query = db.query(Payroll)
    if month:
        query = query.filter(Payroll.month == month)
    if year:
        query = query.filter(Payroll.year == year)
    if employee_id:
        query = query.filter(Payroll.employee_id == employee_id)
    if status_filter:
        query = query.filter(Payroll.status == status_filter.upper())

    payrolls = query.order_by(Payroll.year.desc(), Payroll.month.desc(), Payroll.id.desc()).offset(skip).limit(limit).all()

    results = []
    for p in payrolls:
        emp = db.query(Employee).filter(Employee.id == p.employee_id).first()
        dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp else None
        results.append(PayrollResponse(
            id=p.id,
            employee_id=p.employee_id,
            month=p.month,
            year=p.year,
            base_salary=p.base_salary,
            allowances=p.allowances,
            bonuses=p.bonuses,
            tax_deductions=p.tax_deductions,
            net_salary=p.net_salary,
            status=p.status,
            payment_date=p.payment_date,
            created_at=p.created_at,
            employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
            job_title=emp.job_title if emp else None,
            department_name=dept.name if dept else None
        ))
    return results


@router.put("/{payroll_id}/status", response_model=PayrollResponse)
def update_payroll_status(
    payroll_id: int,
    data: PayrollUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """Mark payroll as PAID or PROCESSING with payment date."""
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    payroll.status = data.status.upper()
    if data.status.upper() == PayrollStatus.PAID:
        payroll.payment_date = data.payment_date or date.today()

    db.commit()
    db.refresh(payroll)

    emp = db.query(Employee).filter(Employee.id == payroll.employee_id).first()
    dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp else None
    return PayrollResponse(
        id=payroll.id,
        employee_id=payroll.employee_id,
        month=payroll.month,
        year=payroll.year,
        base_salary=payroll.base_salary,
        allowances=payroll.allowances,
        bonuses=payroll.bonuses,
        tax_deductions=payroll.tax_deductions,
        net_salary=payroll.net_salary,
        status=payroll.status,
        payment_date=payroll.payment_date,
        created_at=payroll.created_at,
        employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
        job_title=emp.job_title if emp else None,
        department_name=dept.name if dept else None
    )


@router.get("/stats/summary")
def get_payroll_summary(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Total payroll expenditure, total taxes withheld, paid vs pending counts."""
    query = db.query(Payroll)
    if month:
        query = query.filter(Payroll.month == month)
    if year:
        query = query.filter(Payroll.year == year)

    total_disbursed = query.filter(Payroll.status == PayrollStatus.PAID).with_entities(func.sum(Payroll.net_salary)).scalar() or 0.0
    total_tax = query.with_entities(func.sum(Payroll.tax_deductions)).scalar() or 0.0
    total_pending = query.filter(Payroll.status != PayrollStatus.PAID).with_entities(func.sum(Payroll.net_salary)).scalar() or 0.0

    return {
        "total_paid_net": round(float(total_disbursed), 2),
        "total_tax_withheld": round(float(total_tax), 2),
        "total_pending_net": round(float(total_pending), 2),
        "total_records": query.count(),
        "paid_count": query.filter(Payroll.status == PayrollStatus.PAID).count(),
        "pending_count": query.filter(Payroll.status != PayrollStatus.PAID).count()
    }


@router.get("/{payroll_id}/payslip")
def get_payslip_detail(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 6: Detailed breakdown and metadata for payslip generation."""
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    emp = db.query(Employee).filter(Employee.id == payroll.employee_id).first()
    dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp else None

    return {
        "payslip_id": f"PAY-{payroll.year}-{payroll.month:02d}-{payroll.id:04d}",
        "payroll_id": payroll.id,
        "employee_id": payroll.employee_id,
        "employee_name": f"{emp.first_name} {emp.last_name}" if emp else "Unknown",
        "job_title": emp.job_title if emp else "Staff",
        "department_name": dept.name if dept else "General",
        "month": payroll.month,
        "year": payroll.year,
        "period": f"{payroll.month:02d}/{payroll.year}",
        "earnings": {
            "base_salary": payroll.base_salary,
            "allowances": payroll.allowances,
            "bonuses": payroll.bonuses,
            "gross_earnings": round(payroll.base_salary + payroll.allowances + payroll.bonuses, 2)
        },
        "deductions": {
            "tax_deductions": payroll.tax_deductions,
            "total_deductions": payroll.tax_deductions
        },
        "net_salary": payroll.net_salary,
        "status": payroll.status.value if hasattr(payroll.status, "value") else str(payroll.status),
        "payment_date": payroll.payment_date.isoformat() if payroll.payment_date else None
    }


@router.get("/{payroll_id}/payslip/pdf")
def download_payslip_pdf(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 6: Generates downloadable individual Employee Payslip PDF."""
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    emp = db.query(Employee).filter(Employee.id == payroll.employee_id).first()
    dept = db.query(Department).filter(Department.id == emp.department_id).first() if emp else None
    emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Employee"

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    elements = []
    styles = getSampleStyleSheet()

    # Header
    title_style = ParagraphStyle(
        'PayslipTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#059669'),
        spaceAfter=4
    )
    elements.append(Paragraph("WorkForce AI Pro — Official Payslip", title_style))
    elements.append(Paragraph(f"Pay Cycle: Month {payroll.month}, {payroll.year}  |  Doc Ref: PAY-{payroll.year}-{payroll.month:02d}-{payroll.id:04d}", styles['Normal']))
    elements.append(Spacer(1, 15))

    # Employee Information Table
    info_data = [
        ["Employee ID:", str(payroll.employee_id), "Department:", dept.name if dept else "N/A"],
        ["Employee Name:", emp_name, "Designation:", emp.job_title if emp else "N/A"],
        ["Payment Status:", payroll.status.value if hasattr(payroll.status, "value") else str(payroll.status), "Disbursement Date:", payroll.payment_date.isoformat() if payroll.payment_date else "Pending Settlement"]
    ]
    info_table = Table(info_data, colWidths=[110, 160, 110, 160])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))

    # Compensation Breakdown Table
    gross = payroll.base_salary + payroll.allowances + payroll.bonuses
    breakdown_data = [
        ["Earnings Item", "Amount (Rs. / INR)", "Deductions Item", "Amount (Rs. / INR)"],
        ["Basic Monthly Salary", f"Rs. {payroll.base_salary:,.2f}", "Tax Withholding (12%)", f"Rs. {payroll.tax_deductions:,.2f}"],
        ["Standard Allowances (+15%)", f"Rs. {payroll.allowances:,.2f}", "-", "-"],
        ["Performance Incentive / Bonus", f"Rs. {payroll.bonuses:,.2f}", "-", "-"],
        ["Total Gross Earnings", f"Rs. {gross:,.2f}", "Total Deductions", f"Rs. {payroll.tax_deductions:,.2f}"],
        ["Net Take-Home Pay", f"Rs. {payroll.net_salary:,.2f}", "", ""]
    ]
    table = Table(breakdown_data, colWidths=[170, 100, 170, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#065f46')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#f1f5f9')),
        ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 5), (1, 5), colors.HexColor('#ecfdf5')),
        ('TEXTCOLOR', (0, 5), (1, 5), colors.HexColor('#065f46')),
        ('FONTNAME', (0, 5), (1, 5), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 5), (1, 5), 11),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 25))

    elements.append(Paragraph("This is an electronically generated official document from WorkForce AI Pro. No signature required.", styles['Italic']))
    doc.build(elements)
    pdf_content = buffer.getvalue()

    filename = f"payslip_{payroll.year}_{payroll.month:02d}_{payroll.employee_id}.pdf"
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

