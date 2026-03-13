from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user_model import User
from app.schemas.user_schema import UserRegister, UserLogin

from app.utils.auth_utils import hash_password, verify_password, create_access_token


router = APIRouter(prefix="/auth", tags=["Auth"])

DEFAULT_DEV_PASSWORD = "123456"


@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(DEFAULT_DEV_PASSWORD),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "user_id": str(db_user.id),
        "role": db_user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }