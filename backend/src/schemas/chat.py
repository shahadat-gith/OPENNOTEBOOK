"""Chat request/response schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from models.message import Citation


class AskRequest(BaseModel):
    """Request to ask a question about a notebook."""

    question: str = Field(
        min_length=1,
        max_length=10_000,
    )
    notebook_id: str


class AnswerOut(BaseModel):
    """Assistant answer returned to the client."""

    id: str
    content: str
    created_at: datetime
    source_ids: list[str] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)


class MessageOut(BaseModel):
    """Persisted chat message returned by the history endpoint."""

    id: str
    role: Literal["user", "assistant"]
    status: Literal[
        "streaming",
        "complete",
        "failed",
    ]

    content: str
    source_ids: list[str] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)