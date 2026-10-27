from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.models.notification import Notification

router = APIRouter(prefix="/audit", tags=["Audit Logging & Live Activity Feed"])


@router.get("/")
def list_audit_logs(
    entity: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.HR]))
):
    """
    Module 27: Audit logs for compliance, security, and administrative accountability.
    """
    query = db.query(AuditLog)
    if entity:
        query = query.filter(AuditLog.entity == entity)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    results = []
    for l in logs:
        usr = db.query(User).filter(User.id == l.user_id).first() if l.user_id else None
        results.append({
            "id": l.id,
            "user_id": l.user_id,
            "user_name": usr.full_name if usr else "System AI",
            "action": l.action,
            "entity": l.entity,
            "entity_id": l.entity_id,
            "details": l.details,
            "ip_address": l.ip_address or "127.0.0.1",
            "created_at": l.created_at.isoformat() if l.created_at else None
        })
    return results


@router.get("/activity-feed")
def get_live_activity_feed(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Module 30: Live Workforce Activity Feed combining notifications, audits, and real-time operational events.
    """
    feed = []

    # 1. Audit events
    audits = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    for a in audits:
        usr = db.query(User).filter(User.id == a.user_id).first() if a.user_id else None
        feed.append({
            "id": f"audit-{a.id}",
            "type": "AUDIT",
            "title": f"Action: {a.action} on {a.entity}",
            "description": a.details,
            "actor": usr.full_name if usr else "System Automated Engine",
            "timestamp": a.created_at.isoformat() if a.created_at else None,
            "severity": "CRITICAL" if "HIGH" in (a.details or "") else "INFO"
        })

    # 2. System notifications
    notifs = db.query(Notification).order_by(Notification.created_at.desc()).limit(15).all()
    for n in notifs:
        feed.append({
            "id": f"notif-{n.id}",
            "type": "ALERT",
            "title": n.title,
            "description": n.message,
            "actor": "AI Smart Alert Engine",
            "timestamp": n.created_at.isoformat() if n.created_at else None,
            "severity": "CRITICAL" if n.type == "ALERT" else "INFO"
        })

    # Sort combined feed by timestamp descending
    feed.sort(key=lambda x: x["timestamp"] or "", reverse=True)
    return feed[:limit]
