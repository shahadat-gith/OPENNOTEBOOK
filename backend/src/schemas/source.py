"""Source request/response schemas."""

from datetime import datetime

from pydantic import BaseModel


class SourceOut(BaseModel):
    id: str
    name: str
    type: str = "pdf"
    status: str
    size_bytes: int = 0
    page_count: int = 0
    error: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
