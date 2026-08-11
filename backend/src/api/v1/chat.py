"""Chat endpoints.

    POST /api/v1/ask → AnswerOut
"""

from fastapi import APIRouter

from schemas.chat import AnswerOut, AskRequest

router = APIRouter(prefix="/ask", tags=["chat"])


@router.post("", response_model=AnswerOut)
async def ask(payload: AskRequest) -> AnswerOut:
    """Retrieve relevant passages and produce a cited answer."""
    raise NotImplementedError("TODO: implement RAG pipeline (or SQS ask job)")
