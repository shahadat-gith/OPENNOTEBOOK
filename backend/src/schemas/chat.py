"""Chat request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, Field

from models.message import Citation


class AskRequest(BaseModel):
    question: str = Field(min_length=1)
    notebook_id: str | None = None


class AnswerOut(BaseModel):
    id: str
    role: str = "assistant"
    status: str = "complete"
    content: str
    created_at: datetime
    source_ids: list[str] = []
    citations: list[Citation] = []
