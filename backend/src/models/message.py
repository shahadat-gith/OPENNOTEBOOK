"""Message document model (MongoDB collection: ``messages``)."""

from datetime import datetime
from typing import ClassVar, Literal

from pydantic import BaseModel, Field, field_validator

from .common import ensure_utc, new_id, utcnow


class Citation(BaseModel):
    """A passage a cited answer is grounded on."""

    id: str = Field(default_factory=new_id)
    index: int
    source_id: str
    source_name: str
    quote: str
    page: int | None = None
    relevance: float = Field(default=0.0, ge=0.0, le=1.0)


class Message(BaseModel):
    """One entry in a notebook's chat history."""

    Collection: ClassVar[str] = "messages"

    id: str = Field(default_factory=new_id)
    notebook_id: str
    role: Literal["user", "assistant"]
    status: Literal["streaming", "complete"] = "complete"
    content: str
    source_ids: list[str] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utcnow)

    @field_validator("created_at", mode="before")
    @classmethod
    def _attach_utc(cls, v):
        return ensure_utc(v)

    def to_document(self) -> dict:
        """MongoDB document — the model ``id`` lives in ``_id``."""
        doc = self.model_dump()
        doc["_id"] = doc.pop("id")
        return doc

    @classmethod
    def from_document(cls, doc: dict) -> "Message":
        doc = dict(doc)
        doc["id"] = doc.pop("_id")
        return cls.model_validate(doc)
