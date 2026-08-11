"""Source endpoints.

    POST   /api/v1/sources        → SourceOut (multipart PDF upload)
    DELETE /api/v1/sources/{id}   → {status: ok}
"""

from fastapi import APIRouter, File, Query, UploadFile

from schemas import SourceOut
from configs import upload_to_s3

router = APIRouter(prefix="/sources", tags=["sources"])


@router.post("", response_model=SourceOut, status_code=201)
async def upload_source(
    file: UploadFile = File(...),
    notebook_id: str | None = Query(default=None),
) -> SourceOut:
    raise NotImplementedError("TODO: implement upload + SQS ingest job")


@router.delete("/{source_id}")
async def delete_source(source_id: str) -> dict[str, str]:
    raise NotImplementedError("TODO: implement via source_service")
