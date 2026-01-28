from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from datetime import datetime, date
from model import Employee, Leave, Salary, Attendance
from database import SessionLocal
from router.auth import get_current_user, bcrypt_context
from pydantic import BaseModel
from typing import Optional
from fastapi import Request
from fastapi.templating import Jinja2Templates


router = APIRouter(
    prefix='/employee',
    tags=['employee']
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
    
    
templates = Jinja2Templates(directory="templates")


# pages
@router.get("/employee-dashboard")
def render_employee_dashboard(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employee privileges required."
        )
    return templates.TemplateResponse("employee_dashboard.html", {"request": request})

@router.get("/view-profile")
def render_view_profile(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "employee":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("view_profile.html", {"request": request})

@router.get("/my-leaves-page")
def render_my_leaves_page(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "employee":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("leave-page.html", {"request": request})

@router.get("/leave-page")
def render_apply_leave_page(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "employee":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("leave_page.html", {"request": request})

@router.get("/apply-leave-page")
def render_apply_leave_page(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "employee":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("apply_leave.html", {"request": request})

@router.get("/my-salary-page")
def render_my_salary_page(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "employee":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("my_salary.html", {"request": request})



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


@router.post("/apply-leave")
async def apply_leave(
    leave_type: str = Form(...),
    start_date: date = Form(...),
    end_date: date = Form(...),
    reason: Optional[str] = Form(None),
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Apply for leave using form data with date picker"""
    
    # Get user from database
    user = db.query(Employee).filter(Employee.id == current_user.id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate leave_type
    valid_leave_types = ['annual', 'sick', 'personal', 'maternity', 'unpaid']
    if leave_type.lower() not in valid_leave_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid leave type. Allowed types: {', '.join(valid_leave_types)}"
        )
    
    # Validate dates
    today = date.today()
    if start_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be in the past"
        )
    
    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date cannot be before start date"
        )
    
    # Check for overlapping leave applications
    overlapping_leave = db.query(Leave).filter(
        (Leave.employee_id == user.employee_id) &
        (Leave.status.in_(['pending', 'approved'])) &
        ((Leave.start_date <= end_date) & (Leave.end_date >= start_date))
    ).first()
    
    if overlapping_leave:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending or approved leave application for these dates"
        )
    
    # Create leave application
    new_leave = Leave(
        employee_id=user.employee_id,  # Use string employee_id instead of integer id
        leave_type=leave_type.lower(),
        start_date=start_date,
        end_date=end_date,
        status='pending',
        reason=reason
    )
    
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    
    # Calculate number of days
    num_days = (end_date - start_date).days + 1
    
    return {
        "message": "Leave application submitted successfully",
        "leave_id": new_leave.id,
        "status": "pending",
        "leave_type": new_leave.leave_type,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "number_of_days": num_days
    }


@router.get("/my-leaves")
async def get_my_leaves(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all leave applications for current user"""
    
    user = db.query(Employee).filter(Employee.id == current_user.id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    leaves = db.query(Leave).filter(Leave.employee_id == user.employee_id).all()
    
    return {
        "employee_id": user.employee_id,
        "total_applications": len(leaves),
        "leaves": [
            {
                "id": leave.id,
                "leave_type": leave.leave_type,
                "start_date": leave.start_date.isoformat(),
                "end_date": leave.end_date.isoformat(),
                "status": leave.status,
                "reason": leave.reason,
                "days": (leave.end_date - leave.start_date).days + 1
            }
            for leave in leaves
        ]
    }


@router.get("/dashboard-stats")
async def get_employee_dashboard_stats(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for current employee"""
    
    user = db.query(Employee).filter(Employee.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    from datetime import datetime, timedelta
    from sqlalchemy import func, extract
    
    # Current month for attendance calculation
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    # Get attendance count for current month
    monthly_attendance = db.query(Attendance).filter(
        Attendance.employee_id == user.employee_id,
        extract('month', Attendance.date) == current_month,
        extract('year', Attendance.date) == current_year,
        Attendance.status == 'present'
    ).count()
    
    # Get total leave applications
    total_leaves = db.query(Leave).filter(Leave.employee_id == user.employee_id).count()
    
    # Calculate leave balance (assuming 30 days annual leave)
    approved_leaves = db.query(Leave).filter(
        Leave.employee_id == user.employee_id,
        Leave.status == 'approved',
        extract('year', Leave.start_date) == current_year
    ).all()
    
    used_leave_days = sum([(leave.end_date - leave.start_date).days + 1 for leave in approved_leaves])
    leave_balance = max(0, 30 - used_leave_days)  # 30 days annual leave
    
    # Get latest salary
    latest_salary = db.query(Salary).filter(
        Salary.employee_id == user.employee_id
    ).order_by(Salary.month.desc()).first()
    
    current_salary = latest_salary.net_salary if latest_salary else user.salary or 0
    
    return {
        "employee_status": "Active" if user.is_active else "Inactive",
        "monthly_attendance": monthly_attendance,
        "leave_balance": leave_balance,
        "current_salary": current_salary,
        "total_leaves": total_leaves
    }


@router.get("/my-salaries")
async def get_my_salaries(
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all salary records for current user"""
    
    user = db.query(Employee).filter(Employee.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    salaries = db.query(Salary).filter(Salary.employee_id == user.employee_id).all()
    
    return {
        "employee_id": user.employee_id,
        "total_salaries": len(salaries),
        "salaries": [
            {
                "id": salary.id,
                "employee_id": salary.employee_id,
                "month": salary.month,
                "basic_salary": salary.basic_salary,
                "deduction": salary.deduction,
                "net_salary": salary.net_salary
            }
            for salary in salaries
        ]
    }
    
    
    
