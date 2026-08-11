"""MongoDB: async Motor client, database handle, and FastAPI dependency."""

import logging
import os
from typing import Annotated
from urllib.parse import urlsplit

from fastapi import Depends
from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorDatabase,
)


logger = logging.getLogger("opennotebook.db")


MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is not set")


client: AsyncIOMotorClient = AsyncIOMotorClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000,
)


DB_NAME = os.getenv("DB_NAME")

if not DB_NAME:
    raise RuntimeError("DB_NAME is not set")


db: AsyncIOMotorDatabase = client[DB_NAME]


def _uri_host(uri: str) -> str:
    """Host part of the URI only — never log credentials."""
    try:
        return urlsplit(uri).hostname or uri
    except ValueError:
        return uri


def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency — returns the shared MongoDB database handle."""
    return db


Db = Annotated[
    AsyncIOMotorDatabase,
    Depends(get_db),
]


async def init_db() -> None:
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
        logger.info("MongoDB connected at %s — indexes ready", _uri_host(MONGODB_URI))
    except Exception as error:  # noqa: BLE001 — startup must not crash the app
        logger.warning(
            "MongoDB unreachable at %s (db=%s) — starting without indexes: %s. "
            "If using Atlas, check Network Access allows this machine's IP.",
            _uri_host(MONGODB_URI),
            db.name,
            error,
        )


async def close_db() -> None:
    """Close the underlying MongoDB connection pool."""
    client.close()
