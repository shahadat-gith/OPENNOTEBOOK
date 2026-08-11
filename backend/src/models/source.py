from datetime import datetime
from typing import ClassVar, Literal

from pydantic import BaseModel, Field, field_validator

from .common import ensure_utc, new_id, utcnow




SourceType = Literal["pdf", "docx", "txt"]
SourceStatus = Literal[
    "uploading",
    "processing",
    "ready",
    "failed",
]


class Source(BaseModel):
    """A document uploaded to a notebook."""

    Collection: ClassVar[str] = "sources"

    id: str = Field(default_factory=new_id)

    # Ownership / grouping
    notebook_id: str
    owner_id: str

    # File information
    name: str
    type: SourceType = "pdf"
    size_bytes: int = Field(default=0, ge=0)
    s3_key: str

    # Processing state
    status: SourceStatus = "uploading"
    page_count: int = Field(default=0, ge=0)
    chunk_count: int = Field(default=0, ge=0)

    # Processing error
    error: str | None = None

    # Timestamps
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def _attach_utc(cls, value: datetime) -> datetime:
        return ensure_utc(value)

    def touch(self) -> None:
        """Update the modification timestamp."""
        self.updated_at = utcnow()

    def mark_processing(self) -> None:
        """Mark the source as currently being processed."""
        self.status = "processing"
        self.error = None
        self.touch()

    def mark_ready(
        self,
        *,
        page_count: int,
        chunk_count: int,
    ) -> None:
        """Mark the source as successfully processed."""
        self.status = "ready"
        self.page_count = page_count
        self.chunk_count = chunk_count
        self.error = None
        self.touch()

    def mark_failed(self, error: str) -> None:
        """Mark the source as failed during processing."""
        self.status = "failed"
        self.error = error
        self.touch()

    def to_document(self) -> dict:
        """Convert the model to a MongoDB document."""
        document = self.model_dump()
        document["_id"] = document.pop("id")
        return document

    @classmethod
    def from_document(cls, document: dict) -> "Source":
        """Create a Source model from a MongoDB document."""
        document = dict(document)
        document["id"] = document.pop("_id")
        return cls.model_validate(document)
