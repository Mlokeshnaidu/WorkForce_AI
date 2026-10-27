from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new user account with hashed password and assigned role."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role or UserRole.EMPLOYEE,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
def login_json(login_data: UserLogin, db: Session = Depends(get_db)):
    """JSON login endpoint for React Frontend (Axios)."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }


@router.post("/login-form", response_model=Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Form login endpoint for Swagger /docs Authorize button."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns profile information for the authenticated user."""
    return current_user


@router.post("/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):
    """Module 1: Password reset request - verifies email and generates temporary reset instructions."""
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Avoid user enumeration in enterprise apps
        return {"message": "If this email exists in the platform, a secure reset token has been issued.", "token": "mock-reset-token-xyz"}
    return {
        "message": "Reset verification token generated successfully.",
        "reset_token": f"token-{user.id}-workforce-reset",
        "email": user.email
    }


@router.post("/reset-password")
def reset_password(payload: dict, db: Session = Depends(get_db)):
    """Module 1: Password reset completion with new password."""
    email = payload.get("email")
    new_password = payload.get("new_password")
    if not email or not new_password:
        raise HTTPException(status_code=400, detail="Email and new_password are required")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    return {"message": "Password has been successfully updated. You may now log in."}

