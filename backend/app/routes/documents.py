from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.document import Document, DocumentType
from app.schemas.document import DocumentCreate, DocumentResponse

router = APIRouter(prefix="/documents", tags=["Document Management System (Module 9)"])


@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR, UserRole.MANAGER]))
):
    """Register and store an employee document (Contract, Resume, ID proof, Certificate)."""
    emp = db.query(Employee).filter(Employee.id == doc_in.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_doc = Document(
        employee_id=doc_in.employee_id,
        title=doc_in.title,
        document_type=doc_in.document_type or DocumentType.CONTRACT,
        file_name=doc_in.file_name,
        file_url=doc_in.file_url,
        file_size_kb=doc_in.file_size_kb or 150.0
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return DocumentResponse(
        id=new_doc.id,
        employee_id=new_doc.employee_id,
        title=new_doc.title,
        document_type=new_doc.document_type,
        file_name=new_doc.file_name,
        file_url=new_doc.file_url,
        file_size_kb=new_doc.file_size_kb,
        uploaded_at=new_doc.uploaded_at,
        employee_name=f"{emp.first_name} {emp.last_name}"
    )


@router.get("/employee/{employee_id}", response_model=List[DocumentResponse])
def get_employee_documents(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all documents attached to an employee."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    docs = db.query(Document).filter(Document.employee_id == employee_id).order_by(Document.uploaded_at.desc()).all()
    results = []
    for d in docs:
        results.append(DocumentResponse(
            id=d.id,
            employee_id=d.employee_id,
            title=d.title,
            document_type=d.document_type,
            file_name=d.file_name,
            file_url=d.file_url,
            file_size_kb=d.file_size_kb,
            uploaded_at=d.uploaded_at,
            employee_name=f"{emp.first_name} {emp.last_name}"
        ))
    return results


@router.get("/", response_model=List[DocumentResponse])
def list_all_documents(
    doc_type: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List documents with type filtering."""
    query = db.query(Document)
    if doc_type:
        query = query.filter(Document.document_type == doc_type.upper())

    docs = query.order_by(Document.uploaded_at.desc()).offset(skip).limit(limit).all()
    results = []
    for d in docs:
        emp = db.query(Employee).filter(Employee.id == d.employee_id).first()
        results.append(DocumentResponse(
            id=d.id,
            employee_id=d.employee_id,
            title=d.title,
            document_type=d.document_type,
            file_name=d.file_name,
            file_url=d.file_url,
            file_size_kb=d.file_size_kb,
            uploaded_at=d.uploaded_at,
            employee_name=f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
        ))
    return results


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.HR]))
):
    """Delete document (Restricted to Admin and HR)."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(doc)
    db.commit()
    return None


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Module 9: Download API for employee documents."""
    import os
    from fastapi.responses import FileResponse, Response
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.file_url and os.path.exists(doc.file_url):
        return FileResponse(
            path=doc.file_url,
            filename=doc.file_name,
            media_type="application/octet-stream"
        )

    # If virtual document metadata, generate document summary download
    content = f"""WorkForce AI Pro — Employee Document
Title: {doc.title}
Document Type: {doc.document_type}
Filename: {doc.file_name}
Employee ID: {doc.employee_id}
Uploaded At: {doc.uploaded_at}
Size: {doc.file_size_kb} KB
Verified by WorkForce AI Pro Document Management System.
"""
    return Response(
        content=content.encode("utf-8"),
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={doc.file_name}"}
    )

