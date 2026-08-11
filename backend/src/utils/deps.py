"""Shared FastAPI dependencies."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from configs import get_db
from models.user import User
from utils.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)

# Database dependency alias shared by all routers that touch MongoDB.
Db = Annotated[AsyncIOMotorDatabase, Depends(get_db)]


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
    db: Db,
) -> User:
    """Resolve the user from the ``Authorization: Bearer <token>`` header."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    user_id = decode_access_token(credentials.credentials)

    if user_id is None:
        raise unauthorized

    # Imported lazily to avoid a module-level cycle:
    # utils.deps → services.auth → utils.security → utils
    from services.auth import get_user_by_id

    user = await get_user_by_id(db, user_id)

    if user is None:
        raise unauthorized

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
