from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from datetime import datetime, date
from model import Employee, Leave
from database import SessionLocal
from router.auth import get_current_user, bcrypt_context
from pydantic import BaseModel
from typing import Optional
from fastapi import Request
from fastapi.templating import Jinja2Templates

router = APIRouter(
    prefix='/settings',
    tags=['settings']
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Pydantic models for individual settings management
class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str


class UpdatePhoneRequest(BaseModel):
    phone: str

class UpdateAddressRequest(BaseModel):
    address: str
    
db_dependency = Depends(get_db) 
templates = Jinja2Templates(directory="templates")   
    
# pages


@router.get("/settings-page")
def render_settings_page_alt(request: Request):
    return templates.TemplateResponse("settings_page.html", {"request": request})





# endpoints

@router.get("/profile")
async def get_profile(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile information"""
    
    user = db.query(Employee).filter(Employee.id == current_user.id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "id": user.id,
        "employee_id": user.employee_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone": user.phone,
        "address": user.address,
        "role": user.role,
        "is_active": user.is_active,
        "salary": user.salary,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None
    }


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user's password"""
    
    # Validate password confirmation
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )
    
    # Get user from database
    user = db.query(Employee).filter(Employee.id == current_user.id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify old password
    if not bcrypt_context.verify(password_data.old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Old password is incorrect"
        )
    
    # Validate new password strength (minimum 6 characters)
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )
    
    # Hash and update password
    user.password_hash = bcrypt_context.hash(password_data.new_password)
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Password changed successfully",
        "email": user.email
    }


@router.post("/update-phone")
async def update_phone(
    phone_data: UpdatePhoneRequest,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's phone number"""
    
    # Validate phone number is not empty
    if not phone_data.phone or not phone_data.phone.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number cannot be empty"
        )
    
    # Get user from database
    user = db.query(Employee).filter(Employee.id == current_user.id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update phone number
    user.phone = phone_data.phone.strip()
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Phone number updated successfully",
        "phone": user.phone
    }


@router.post("/update-address")
async def update_address(
    address_data: UpdateAddressRequest,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's address"""
    
    # Validate address is not empty
    if not address_data.address or not address_data.address.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Address cannot be empty"
        )
    
    # Get user from database
    user = db.query(Employee).filter(Employee.id == current_user.id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update address
    user.address = address_data.address.strip()
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Address updated successfully",
        "address": user.address
    }