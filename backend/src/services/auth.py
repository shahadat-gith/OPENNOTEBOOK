"""Authentication business logic against MongoDB."""

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from models.common import utcnow
from models.user import User
from utils.security import hash_password, verify_password


def normalize_email(email: str) -> str:
    """Canonical form for storage and lookup (prevents duplicate accounts)."""
    return email.strip().lower()


async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> User | None:
    doc = await db[User.Collection].find_one({"email": normalize_email(email)})
    return User.from_document(doc) if doc else None


async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> User | None:
    doc = await db[User.Collection].find_one({"_id": user_id})
    return User.from_document(doc) if doc else None


async def create_user(
    db: AsyncIOMotorDatabase,
    name: str,
    email: str,
    password: str,
) -> User:
    """Create a user with a hashed password. Raises ValueError if email is taken."""
    email = normalize_email(email)

    if await get_user_by_email(db, email):
        raise ValueError("Email already registered")

    user = User(
        name=name.strip(),
        email=email,
        password_hash=hash_password(password),
    )

    try:
        await db[User.Collection].insert_one(user.to_document())
    except DuplicateKeyError as error:
        # The unique email index backs up the check above under concurrency.
        raise ValueError("Email already registered") from error

    return user


async def authenticate_user(
    db: AsyncIOMotorDatabase,
    email: str,
    password: str,
) -> User | None:
    """Return the user if the credentials match, else None."""
    user = await get_user_by_email(db, email)

    if not user or not verify_password(password, user.password_hash):
        return None

    return user


async def update_last_login(db: AsyncIOMotorDatabase, user_id: str) -> None:
    """Record the sign-in time on the user document."""
    await db[User.Collection].update_one(
        {"_id": user_id},
        {"$set": {"last_login_at": utcnow(), "updated_at": utcnow()}},
    )
