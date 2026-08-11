"""FastAPI application entry point.

Run with (from the ``backend`` directory):

    uv run uvicorn main:app --app-dir src --reload
    # or
    uv run uvicorn src.main:app --reload
"""

import os
import sys

# Make the `src` package's modules importable no matter how uvicorn is
# invoked: `main:app --app-dir src` puts `src` on sys.path itself, while
# `src.main:app` does not.
_SRC_DIR = os.path.dirname(os.path.abspath(__file__))
if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)

from dotenv import load_dotenv

# Load .env BEFORE any app module reads its configuration — configs.db and
# utils.security read env vars at import time.
load_dotenv()

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.v1.router import api_router
from configs import close_db, init_db
from middlewares.auth_middleware import AuthMiddleware


APP_NAME = os.getenv("APP_NAME", "OpenNotebook")

DEBUG = os.getenv(
    "DEBUG",
    "true",
).lower() in ("1", "true", "yes", "on")


CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""

    await init_db()

    yield

    await close_db()


def create_app() -> FastAPI:
    """Build the FastAPI application."""

    app = FastAPI(
        title=APP_NAME,
        version="0.1.0",
        debug=DEBUG,
        lifespan=lifespan,
    )

    app.add_middleware(AuthMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(
        api_router,
        prefix="/api/v1",
    )

    @app.get("/health", tags=["health"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
