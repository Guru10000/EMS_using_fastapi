from sqlalchemy import Column, Integer, String, Date, Float, Text, Boolean, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.sql import func
from database import Base
from pydantic import BaseModel
from typing import Optional
from datetime import date
from sqlalchemy.orm import relationship

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default='employee')  # admin, manager, employee
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    address = Column(String(255), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    salary = Column(Float, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    department = relationship("Department", back_populates="employees")
    attendances = relationship("Attendance", back_populates="employee")
    leaves = relationship("Leave", back_populates="employee")
    salaries = relationship("Salary", back_populates="employee")
    
    def __repr__(self):
        return f"<Employee(id={self.id}, employee_id={self.employee_id}, first_name={self.first_name}, last_name={self.last_name}, role={self.role})>"






class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    department_name= Column(String(100), unique=True, nullable=False)
    description = Column(Text)

    employees = relationship("Employee", back_populates="department")

    def __repr__(self):
        return f"<Department(id={self.id}, name={self.department_name})>"
    
    
class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), ForeignKey("employees.id"), nullable=False)
    date = Column(DateTime, default=func.now(), nullable=False)
    status = Column(String(20), nullable=False)  # e.g., 'present', 'absent', 'late'
    
    # Relationship
    employee = relationship("Employee", back_populates="attendances")

    def __repr__(self):
        return f"<Attendance(id={self.id}, employee_id={self.employee_id}, date={self.date}, status={self.status})>"


class Leave(Base):
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), ForeignKey("employees.id"), nullable=False)
    leave_type = Column(String(50), nullable=False)  # e.g., 'annual', 'sick', 'personal'
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), default='pending', nullable=False)  # 'pending', 'approved', 'rejected'
    reason = Column(Text)

    # Relationship
    employee = relationship("Employee", back_populates="leaves")

    # Constraint to ensure end_date is not before start_date and start_date is not before current date
    __table_args__ = (
        CheckConstraint('end_date >= start_date', name='check_end_date_after_start'),
        CheckConstraint('start_date >= CURRENT_DATE', name='check_start_date_not_past'),
    )

    def __repr__(self):
        return f"<Leave(id={self.id}, employee_id={self.employee_id}, leave_type={self.leave_type}, status={self.status})>"


class Salary(Base):
    __tablename__ = "salaries"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), ForeignKey("employees.id"), nullable=False)
    month = Column(String(7), nullable=False)  # Format: 'YYYY-MM'
    basic_salary = Column(Float, nullable=False)
    deduction = Column(Float, default=0.0, nullable=False)
    net_salary = Column(Float, nullable=False)

    # Relationship
    employee = relationship("Employee", back_populates="salaries")

    def __repr__(self):
        return f"<Salary(id={self.id}, employee_id={self.employee_id}, month={self.month}, net_salary={self.net_salary})>"


class EmployeeCreate(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    department_name: Optional[str] = None
    salary: Optional[float] = None
    is_active: bool = True
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    role: str
    password: str  # Plain password, will be hashed


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department_name: Optional[str] = None
    salary: Optional[float] = None
    is_active: Optional[bool] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None


class EmployeeResponse(BaseModel):
    id: int
    employee_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    role: str
    is_active: bool
    department_id: Optional[int]
    address: Optional[str]
    date_of_birth: Optional[date]
    salary: Optional[float]
    created_at: Optional[str]
    updated_at: Optional[str]
    
    class Config:
        from_attributes = True


class AttendanceCreate(BaseModel):
    employee_id: str
    status: str


class AttendanceResponse(BaseModel):
    id: int
    employee_id: str
    date: str
    status: str
    
    class Config:
        from_attributes = True


class LeaveCreate(BaseModel):
    employee_id: str
    leave_type: str
    start_date: date
    end_date: date
    reason: Optional[str] = None


class LeaveResponse(BaseModel):
    id: int
    employee_id: str
    leave_type: str
    start_date: date
    end_date: date
    status: str
    reason: Optional[str]
    
    class Config:
        from_attributes = True


class SalaryCreate(BaseModel):
    employee_id: str
    month: str
    basic_salary: float
    deduction: Optional[float] = 0.0


class SalaryResponse(BaseModel):
    id: int
    employee_id: str
    month: str
    basic_salary: float
    deduction: float
    net_salary: float
    
    class Config:
        from_attributes = True


class DepartmentCreate(BaseModel):
    department_name: str
    description: Optional[str] = None
