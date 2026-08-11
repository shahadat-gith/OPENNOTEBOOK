"""Source document model (MongoDB collection: ``sources``)."""

from datetime import datetime
from typing import ClassVar, Literal

from pydantic import BaseModel, Field, field_validator

from .common import ensure_utc, new_id, utcnow


class Source(BaseModel):
    """A file the user uploaded to a notebook (PDF for now)."""

    Collection: ClassVar[str] = "sources"

    id: str = Field(default_factory=new_id)
    notebook_id: str
    owner_id: str
    name: str
    type: Literal["pdf", "docx", "txt"] = "pdf"
    status: Literal["uploading", "processing", "ready", "failed"] = "uploading"
    size_bytes: int = 0
    page_count: int = 0
    error: str | None = None
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def _attach_utc(cls, v):
        return ensure_utc(v)

    def to_document(self) -> dict:
        """MongoDB document — the model ``id`` lives in ``_id``."""
        doc = self.model_dump()
        doc["_id"] = doc.pop("id")
        return doc

    @classmethod
    def from_document(cls, doc: dict) -> "Source":
        doc = dict(doc)
        doc["id"] = doc.pop("_id")
        return cls.model_validate(doc)
