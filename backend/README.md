# OpenNotebook — Backend

FastAPI backend backed by **MongoDB** (async via [Motor](https://www.mongodb.com/docs/drivers/motor/)).

## Structure

```
src/
├── main.py            # entry point (uvicorn), CORS, /health, lifespan
├── api/v1/            # routers: auth, notebooks, sources, chat
├── configs/           # db (Motor client) + env-driven configuration
├── middlewares/       # auth + logging middleware
├── models/            # MongoDB document models (Pydantic)
├── schemas/           # API request/response schemas (Pydantic)
├── services/          # business logic: auth, notebook, rag pipeline stubs
├── llm/               # LLM provider wrapper + prompts (RAG pipeline)
├── sqs/               # SQS client / producer / consumer (async RAG pipeline)
└── utils/             # shared deps (Db, get_current_user) + password/JWT security
```

## Setup

```bash
cd backend
uv sync

# MongoDB — either run it locally, or set your Atlas connection string:
cp .env.example .env   # then edit MONGODB_URI (e.g. mongodb+srv://…) and
                       # DB_NAME (the database name).
```

## Run

Either command works from the `backend` directory (configuration comes from `.env`):

```bash
uv run uvicorn main:app --app-dir src --reload
# or
uv run uvicorn src.main:app --reload
```

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Test

Tests run against an in-memory MongoDB mock (no server needed):

```bash
uv run pytest
```

> Note: the `tests/` folder was removed; the dev deps (`pytest`, `mongomock-motor`) are still declared for when it comes back.

## Troubleshooting

**Server starts but the log says `MongoDB unreachable`** — the app boots
anyway (DB requests fail until connectivity returns). If you use Atlas:

1. Atlas → **Network Access** → add your current IP (or `0.0.0.0/0` for dev).
   A missing allowlist entry shows up as an abrupt
   `SSL handshake failed: tlsv1 alert internal error` — not a clean timeout.
2. Atlas → **Database Access** → confirm the user in `MONGODB_URI` exists.
3. Set the database name via the `DB_NAME` env var in `.env`
   (e.g. `DB_NAME=opennotebook`).
4. Restart the server — a successful start logs
   `MongoDB connected … indexes ready`.

## API

| Method | Path                  | Auth   | Description              |
| ------ | --------------------- | ------ | ------------------------ |
| POST   | `/api/v1/auth/signup` | —      | Create account (201/409) |
| POST   | `/api/v1/auth/login`  | —      | Get JWT (Bearer token)   |
| POST   | `/api/v1/auth/logout` | —      | Stateless no-op          |
| GET    | `/api/v1/auth/me`     | Bearer | Current user             |
| GET    | `/api/v1/notebooks`   | Bearer | List user's notebooks    |
| POST   | `/api/v1/notebooks`   | Bearer | Create a notebook        |
