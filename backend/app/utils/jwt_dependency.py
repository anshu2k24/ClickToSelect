from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if "user_id" not in payload:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        return payload

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


def require_roles(*allowed_roles: str):

    def dependency(user=Depends(get_current_user)):

        role = user.get("role")

        if role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        return user

    return dependency