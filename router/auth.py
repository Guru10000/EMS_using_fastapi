from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from model import Employee
from database import SessionLocal
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm
from typing import Annotated
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi.templating import Jinja2Templates

router = APIRouter(
    prefix='/auth',
    tags=['auth']
)
    

SECRET_KEY = '5c0a8d6370428e3d20b4810f181e2ec5c6bfe2837249e0781eb6f1077a96df3d'
ALGORITHM = 'HS256'

oauth2_bearer =  OAuth2PasswordBearer(tokenUrl="auth/token")
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
        
db_dependency = Annotated[Session, Depends(get_db)]

templates = Jinja2Templates(directory="templates")


@router.get("/login-page")
def render_login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/")
def redirect_to_login():
    return RedirectResponse(url="/auth/login-page")

def authenticate_user(email: str, password: str,db):
    print(f"Trying to authenticate: {email}")
    user = db.query(Employee).filter(Employee.email == email).first()
    if not user:
        print("User not found")
        return False
    print(f"User found: {user.email}, role: {user.role}")
    print(f"Stored hash: {user.password_hash[:20]}...")
    if not bcrypt_context.verify(password, user.password_hash):
        print("Password verification failed")
        return False
    print("Authentication successful")
    return user



def create_access_token(email: str, user_id: int, role: str, expires_delta: timedelta):
    payload = {
        "sub": email,
        "id": user_id,
        "role": role,
        "exp": datetime.utcnow() + expires_delta
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    request: Request,
    db: db_dependency
):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        email: str = payload.get("sub")

        if user_id is None or email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(Employee).filter(Employee.id == user_id).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@router.post("/login")
async def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # Write to a log file to ensure we can see if this is called
    with open("login_debug.txt", "a") as f:
        f.write(f"LOGIN CALLED: {email} at {datetime.now()}\n")
    
    print("=== LOGIN ENDPOINT HIT ===")
    print(f"Login attempt - Email: {email}, Password: {password}")
    user = authenticate_user(email, password, db)

    if not user:
        print("Authentication failed")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    print(f"Login successful for user: {user.email}, role: {user.role}")
    access_token = create_access_token(
        user.email,
        user.id,
        user.role,
        timedelta(minutes=60)
    )

    # Redirect based on user role
    role = user.role.strip().lower()
    print(f"Original role: '{user.role}', Normalized role: '{role}'")
    
    if role == "admin":
        redirect_url = "/admin/admin-dashboard"
        print("Redirecting to admin dashboard")
    elif role == "employee":
        redirect_url = "/employee/employee-dashboard"
        print("Redirecting to employee dashboard")
    else:
        print(f"Unknown role: '{role}'")
        raise HTTPException(status_code=403, detail="Invalid role")

    response = RedirectResponse(
        url=redirect_url,
        status_code=status.HTTP_302_FOUND
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=3600
    )

    return response



@router.get("/test-redirect/{email}")
async def test_redirect_get(email: str, db: Session = Depends(get_db)):
    """Simple GET test to check redirect logic"""
    user = db.query(Employee).filter(Employee.email == email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = user.role.strip().lower()
    
    if role == "admin":
        redirect_url = "/admin/admin-dashboard"
    elif role == "employee":
        redirect_url = "/employee/employee-dashboard"
    else:
        raise HTTPException(status_code=403, detail="Invalid role")
    
    return RedirectResponse(url=redirect_url, status_code=302)


@router.post("/test-login")
async def test_login(
    email: str = Form(...),
    db: Session = Depends(get_db)
):
    """Test endpoint to check role-based redirect logic"""
    user = db.query(Employee).filter(Employee.email == email).first()
    
    if not user:
        return {"error": "User not found"}
    
    role = user.role.strip().lower()
    
    if role == "admin":
        redirect_url = "/admin/admin-dashboard"
    elif role == "employee":
        redirect_url = "/employee/employee-dashboard"
    else:
        redirect_url = "/unknown"
    
    return {
        "email": user.email,
        "original_role": user.role,
        "normalized_role": role,
        "redirect_url": redirect_url
    }


@router.get("/debug-users")
async def debug_users(db: Session = Depends(get_db)):
    users = db.query(Employee).all()
    return [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "role_repr": repr(user.role)
        }
        for user in users
    ]


@router.get("/me")
async def get_me(
    request: Request,
    current_user: Employee = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name
    }







