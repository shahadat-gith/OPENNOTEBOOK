

import os
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends
from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorDatabase,
)

load_dotenv()


MONGODB_URI = os.environ["MONGODB_URI"]
DB_NAME = os.environ["DB_NAME"]


client: AsyncIOMotorClient = AsyncIOMotorClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000,
)

db: AsyncIOMotorDatabase = client[DB_NAME]


def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency — return the shared MongoDB database handle."""
    return db


Db = Annotated[
    AsyncIOMotorDatabase,
    Depends(get_db),
]


async def init_db() -> None:
    """Create MongoDB indexes during application startup.

    Startup must not crash the app when MongoDB is temporarily unreachable
    (e.g. Atlas network-access misconfiguration); indexes are re-attempted on
    the next restart.
    """

    from urllib.parse import urlsplit

    from models import Message, Notebook, Source, User

    try:
        await db[User.Collection].create_index(
            "email",
            unique=True,
        )

        await db[Notebook.Collection].create_index(
            [
                ("owner_id", 1),
                ("updated_at", -1),
            ]
        )

        await db[Source.Collection].create_index(
            "notebook_id",
        )

        await db[Message.Collection].create_index(
            "notebook_id",
        )
    except Exception as error:  # noqa: BLE001 — startup must not crash the app
        try:
            host = urlsplit(MONGODB_URI).hostname or MONGODB_URI
        except ValueError:
            host = MONGODB_URI
        print(
            f"[opennotebook] MongoDB unreachable at {host} (db={db.name}) "
            f"- starting without indexes: {error}"
        )


async def close_db() -> None:
    """Close the MongoDB connection pool."""
    client.close()