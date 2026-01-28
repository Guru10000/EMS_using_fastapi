from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from router import auth, Admin, employee, settings
from database import engine, Base, SessionLocal
from model import Employee,Department
from router.auth import bcrypt_context
from contextlib import asynccontextmanager
from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"])

def get_password_hash(password: str):
    return pwd_context.hash(password)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting lifespan")
    # 🔹 STARTUP CODE
    print("Creating tables")
    Base.metadata.create_all(bind=engine)
    print("Tables created")
    
    db = SessionLocal()
    print("DB session created")
    
    try:
        # 1️⃣ Ensure default department exists
        admin_dept = db.query(Department).filter(
            Department.department_name == "Administration"
        ).first()

        if not admin_dept:
            admin_dept = Department(
                department_name="Administration",
                description="System administrators"
            )
            db.add(admin_dept)
            db.commit()
            db.refresh(admin_dept)
    
        # 2️⃣ Ensure at least one admin user exists
        
    

        admin = db.query(Employee).filter(Employee.role == "admin").first()
        print("Admin queried")

        if not admin:
            print("Creating admin")
            admin_user = Employee(
                employee_id="ADMIN001",
                first_name="System",
                last_name="Admin",
                email="admin@ems.com",
                password_hash=get_password_hash("admin123"),
                role="admin",
                department_id=admin_dept.id,
                is_active=True
            )
            db.add(admin_user)
            print("Admin added")
            db.commit()
            print("Committed")
            
            db.refresh(admin_user)
    finally:
        db.close()
        print("DB closed")

    yield   # 🔹 APP RUNS HERE

    # 🔹 SHUTDOWN CODE (optional)
    print("Application shutting down")

app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(Admin.router)
app.include_router(employee.router)
app.include_router(settings.router)

@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI application!"}
