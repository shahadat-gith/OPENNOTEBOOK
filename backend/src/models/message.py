"""Message document model (MongoDB collection: `messages`)."""

from datetime import datetime
from typing import ClassVar, Literal

from pydantic import BaseModel, Field, field_validator

from .common import ensure_utc, new_id, utcnow


class Citation(BaseModel):
    """A passage used to ground an assistant answer."""

    id: str = Field(default_factory=new_id)
    index: int
    source_id: str
    source_name: str
    quote: str
    page: int | None = None
    relevance: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
    )


class Message(BaseModel):
    """One entry in a notebook's chat history."""

    Collection: ClassVar[str] = "messages"

    id: str = Field(default_factory=new_id)
    notebook_id: str

    role: Literal["user", "assistant"]

    status: Literal[
        "streaming",
        "complete",
        "failed",
    ] = "complete"

    content: str = ""

    source_ids: list[str] = Field(
        default_factory=list,
    )

    citations: list[Citation] = Field(
        default_factory=list,
    )

    model: str | None = None

    created_at: datetime = Field(
        default_factory=utcnow,
    )

    updated_at: datetime = Field(
        default_factory=utcnow,
    )

    @field_validator(
        "created_at",
        "updated_at",
        mode="before",
    )
    @classmethod
    def _attach_utc(cls, value):
        return ensure_utc(value)

    def to_document(self) -> dict:
        """Convert model to MongoDB document."""

        doc = self.model_dump()
        doc["_id"] = doc.pop("id")
        return doc

    @classmethod
    def from_document(
        cls,
        doc: dict,
    ) -> "Message":
        """Create a Message from a MongoDB document."""

        doc = dict(doc)
        doc["id"] = doc.pop("_id")
        return cls.model_validate(doc)