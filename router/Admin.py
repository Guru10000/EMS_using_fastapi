from fastapi import APIRouter, Depends, HTTPException, Request, status, Form
from sqlalchemy.orm import Session
from datetime import date, datetime
from model import Employee, Department, EmployeeCreate, DepartmentCreate, Salary, Attendance, Leave
from router.auth import get_current_user, bcrypt_context
from database import SessionLocal
from typing import Annotated
from fastapi.templating import Jinja2Templates
from sqlalchemy import func


router = APIRouter(
    prefix='/admin',
    tags=['admin']
)



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Depends(get_db)
templates = Jinja2Templates(directory="templates")


# pages
@router.get("/admin-dashboard")
def render_admin_dashboard(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    return templates.TemplateResponse("admin-dashboard.html", {"request": request})

@router.get("/employee-list")
def render_employee_list(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("employee_list.html", {"request": request})

@router.get("/view_employee")
def render_view_employee(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("view.html", {"request": request})

@router.get("/create-employee")
def render_create_employee(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("add_new_employee.html", {"request": request})

@router.get("/department-list")
def render_employee_list(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("department_list.html", {"request": request})

@router.get("/create-department")
def render_create_department(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("create_department.html", {"request": request})

@router.get("/leave-list")
def render_leave_list(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("leave_list.html", {"request": request})

@router.get("/dep_team")
def render_dep_team(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("dep_team.html", {"request": request})

@router.get("/salary-list")
def render_salary_list(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("salary_page.html", {"request": request})

@router.get("/employee-salary")
def render_employee_salary(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("employee_salary.html", {"request": request})

@router.get("/add-new-salary")
def render_add_salary(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("add_salary.html", {"request": request})

@router.get("/attendance-list")
def render_attendance_list(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("attendance_list.html", {"request": request})

@router.get("/attendance-report")
def render_attendance_report(request: Request, current_user: Employee = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return templates.TemplateResponse("attendance_report.html", {"request": request})


@router.get("/settings-page")
def render_settings_page_alt(request: Request):
    return templates.TemplateResponse("settings_page.html", {"request": request})

# enpoints

@router.post("/employees")
async def create_employee(
    request: Request,
    employee_data: EmployeeCreate,
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    # Admin check
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create employees"
        )

    # Duplicate check
    existing_employee = db.query(Employee).filter(
        (Employee.employee_id == employee_data.employee_id) |
        (Employee.email == employee_data.email)
    ).first()

    if existing_employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee ID or email already exists"
        )

    # ✅ Department is REQUIRED
    if not employee_data.department_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department is required"
        )

    # ✅ Validate department
    department = db.query(Department).filter(
        Department.department_name == employee_data.department_name
    ).first()

    if not department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department does not exist"
        )

    # Hash password
    hashed_password = bcrypt_context.hash(employee_data.password)

    # Convert date_of_birth string to date object
    date_of_birth = None
    if employee_data.date_of_birth:
        try:
            # Try parsing common date formats
            date_of_birth = datetime.strptime(employee_data.date_of_birth, "%d-%m-%Y").date()
        except ValueError:
            try:
                date_of_birth = datetime.strptime(employee_data.date_of_birth, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date format. Use DD-MM-YYYY or YYYY-MM-DD"
                )

    # Create employee
    new_employee = Employee(
        employee_id=employee_data.employee_id,
        first_name=employee_data.first_name,
        last_name=employee_data.last_name,
        email=employee_data.email,
        phone=employee_data.phone,
        department_id=department.id,
        salary=employee_data.salary,
        is_active=employee_data.is_active,
        address=employee_data.address,
        date_of_birth=date_of_birth,
        role=employee_data.role,
        password_hash=hashed_password
    )

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return {
        "message": "Employee created successfully",
        "employee_id": new_employee.id
    }


@router.post("/departments", response_model=None)
async def create_department(
    request: Request,
    department_data: DepartmentCreate,
    db = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    # Check if current user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create departments"
        )
    
    # Check if department name already exists
    existing_department = db.query(Department).filter(Department.department_name == department_data.department_name).first()
    if existing_department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department name already exists"
        )
    
    # Create new department
    new_department = Department(
        department_name=department_data.department_name,
        description=department_data.description
    )
    
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    
    return {"message": "Department created successfully", "department_id": new_department.id}

@router.get("/all_departments")
async def get_all_departments(
    request: Request,
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    # Check if current user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view departments"
        )
    
    departments = db.query(Department).all()
    return departments

@router.get("/department/{department_name}/employees")
async def get_employees_by_department(
    request: Request,
    department_name: str,
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view department employees"
        )
    
    department = db.query(Department).filter(Department.department_name == department_name).first()
    
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    employees = db.query(Employee).filter(Employee.department_id == department.id).all()
    return employees



@router.get("/test")
async def test_auth():
    return {"message": "No auth required"}

@router.get("/all_employees_no_auth")
async def get_all_employees_no_auth(db: Session = db_dependency):
    employees = db.query(Employee).all()
    return employees

@router.get("/all_employees")
async def get_all_employees(
    request: Request,
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    # Check if current user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view employees"
        )
    
    employees = db.query(Employee).all()
    return employees   

@router.get("/employee_fulsalary")
async def get_employee_salary(
    request: Request,
    employee_id: str,
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    # Check if current user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view employee salaries"
        )
    
    salaries = db.query(Salary).filter(Salary.employee_id == employee_id).all()
    return salaries 


@router.post("/add_salary") 
async def add_salary(
    request: Request,
    employee_id: str = Form(...),
    month: str = Form(...),
    basic_salary: float = Form(...),
    deduction: float = Form(default=0.0),
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    # Check if current user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can add salaries"
        )
    
    # Validate employee exists
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Check if salary already exists for this month
    existing_salary = db.query(Salary).filter(
        (Salary.employee_id == employee_id) &
        (Salary.month == month)
    ).first()
    
    if existing_salary:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salary already exists for this employee in this month"
        )
    
    # Calculate net salary
    net_salary = basic_salary - deduction
    
    # Create salary record
    new_salary = Salary(
        employee_id=employee_id,
        month=month,
        basic_salary=basic_salary,
        deduction=deduction,
        net_salary=net_salary
    )
    
    db.add(new_salary)
    db.commit()
    db.refresh(new_salary)
    
    return {
        "message": "Salary added successfully",
        "salary_id": new_salary.id,
        "net_salary": net_salary
    }


@router.post("/update_attendance")
async def update_attendance(
    request: Request,
    employee_id: str = Form(...),
    status: str = Form(...),
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    # Check if current user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update attendance"
        )
    
    # Validate employee exists
    employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Validate status
    valid_statuses = ['present', 'absent', 'late']
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    # Check if attendance already exists for today
    from datetime import date
    today = date.today()
    existing_attendance = db.query(Attendance).filter(
        (Attendance.employee_id == employee_id) &
        (func.date(Attendance.date) == today)
    ).first()
    
    if existing_attendance:
        # Update existing attendance
        existing_attendance.status = status
        db.commit()
        return {
            "message": "Attendance updated successfully",
            "attendance_id": existing_attendance.id,
            "status": status
        }
    else:
        # Create new attendance record
        new_attendance = Attendance(
            employee_id=employee_id,
            status=status
        )
        
        db.add(new_attendance)
        db.commit()
        db.refresh(new_attendance)
        
        return {
            "message": "Attendance recorded successfully",
            "attendance_id": new_attendance.id,
            "status": status
        } 
        

@router.get("/attendance_report")
async def get_attendance_report(
    request: Request,
    start_date: str = None,
    end_date: str = None,
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    # Check if current user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view attendance reports"
        )
    
    from datetime import datetime, date
    
    # Set default date range (last 30 days if not provided)
    if not start_date:
        start_date = (date.today() - datetime.timedelta(days=30)).strftime('%Y-%m-%d')
    if not end_date:
        end_date = date.today().strftime('%Y-%m-%d')
    
    try:
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Query attendance records with employee details
    attendance_records = db.query(Attendance, Employee).join(
        Employee, Attendance.employee_id == Employee.employee_id
    ).filter(
        func.date(Attendance.date) >= start_date_obj,
        func.date(Attendance.date) <= end_date_obj
    ).order_by(Attendance.date.desc()).all()
    
    # Format the response
    report_data = []
    for attendance, employee in attendance_records:
        report_data.append({
            "id": attendance.id,
            "employee_id": attendance.employee_id,
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "department_id": employee.department_id,
            "date": attendance.date.strftime('%Y-%m-%d'),
            "status": attendance.status
        })
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_records": len(report_data),
        "attendance_data": report_data
    }


@router.get("/all_salaries")
async def get_all_salaries(
    request: Request,
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    # Check if current user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view salaries"
        )
    
    salaries = db.query(Salary).all()
    return salaries


@router.put("/leaves/{leave_id}/approve")
async def approve_leave(
    request: Request,
    leave_id: int,
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can approve leaves"
        )
    
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave not found"
        )
    
    leave.status = "approved"
    db.commit()
    
    return {"message": "Leave approved successfully"}


@router.put("/leaves/{leave_id}/reject")
async def reject_leave(
    request: Request,
    leave_id: int,
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can reject leaves"
        )
    
    leave = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave not found"
        )
    
    leave.status = "rejected"
    db.commit()
    
    return {"message": "Leave rejected successfully"}


@router.get("/leaves")
async def get_all_leaves(
    request: Request,
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view all leaves"
        )
    
    leaves = db.query(Leave).all()
    return leaves

@router.get("/dashboard-stats")
async def get_dashboard_stats(
    request: Request,
    db: Session = db_dependency,
    current_user: Employee = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view dashboard stats"
        )
    
    from datetime import date
    today = date.today()
    
    # Total employees
    total_employees = db.query(Employee).count()
    
    # Total departments
    total_departments = db.query(Department).count()
    
    # Today's attendance
    today_attendance = db.query(Attendance).filter(
        func.date(Attendance.date) == today,
        Attendance.status == 'present'
    ).count()
    
    # Pending leaves
    pending_leaves = db.query(Leave).filter(Leave.status == 'pending').count()
    
    return {
        "total_employees": total_employees,
        "total_departments": total_departments,
        "today_attendance": today_attendance,
        "pending_leaves": pending_leaves
    }
