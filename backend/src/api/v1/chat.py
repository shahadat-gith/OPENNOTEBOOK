"""Chat endpoints.

    POST /api/v1/ask          → SSE stream         (ask a question, streamed)
    GET  /api/v1/ask          → list[MessageOut]   (conversation history)

SSE events (JSON payloads after each `data: ` line):

    {"type": "delta", "content": "..."}     streamed answer fragments
    {"type": "done",  "message": {...}}     final persisted message + citations
    {"type": "error", "detail": "..."}      terminal failure
"""

import asyncio

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from configs.llm import CHAT_MODEL, llm
from models import Source
from models.message import Message
from schemas.chat import AskRequest, MessageOut
from services import (
    embed_query,
    get_notebook,
    list_messages,
    save_message,
    search_chunks,
)
from utils import (
    MAX_CHUNKS,
    NO_MATCH_CONTENT,
    NO_SOURCES_CONTENT,
    CurrentUser,
    Db,
    assistant_message,
    build_messages,
    chunks_from_points,
    greeting_content,
    message_payload,
    sse_event,
)

router = APIRouter(
    prefix="/ask",
    tags=["chat"],
)


@router.post(
    "",
    response_class=StreamingResponse,
)
async def ask(
    payload: AskRequest,
    current_user: CurrentUser,
    db: Db,
) -> StreamingResponse:
    """Stream a grounded, cited answer as server-sent events.

    Both the user question and the final assistant answer are persisted, so
    the conversation survives reloads (see GET /ask).
    """

    notebook = await get_notebook(
        db,
        payload.notebook_id,
        current_user.id,
    )

    if notebook is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notebook not found",
        )

    # History is fetched before saving the new question so the current turn
    # isn't duplicated inside the prompt.
    history = await list_messages(
        db,
        payload.notebook_id,
        limit=20,
    )

    user_message = Message(
        notebook_id=payload.notebook_id,
        role="user",
        content=payload.question,
    )
    await save_message(db, user_message)

    # Nothing to retrieve yet — avoid a guaranteed-miss embedding call.
    ready_count = await db[Source.Collection].count_documents(
        {
            "notebook_id": payload.notebook_id,
            "owner_id": current_user.id,
            "status": "ready",
        }
    )

    async def event_stream():
        try:
            # A plain greeting gets a friendly canned reply — no embedding or
            # LLM call, and the response adapts to whether sources exist.
            greeting = greeting_content(
                payload.question,
                has_sources=ready_count > 0,
            )

            if greeting:
                yield await _done(
                    db,
                    assistant_message(
                        notebook_id=payload.notebook_id,
                        content=greeting,
                        chunks=[],
                    ),
                )
                return

            if ready_count == 0:
                yield await _done(
                    db,
                    assistant_message(
                        notebook_id=payload.notebook_id,
                        content=NO_SOURCES_CONTENT,
                        chunks=[],
                    ),
                )
                return

            # Embed the question and retrieve the most relevant chunks.
            query_vector = await embed_query(payload.question)

            points = await asyncio.to_thread(
                search_chunks,
                notebook_id=payload.notebook_id,
                query_vector=query_vector,
                limit=MAX_CHUNKS,
            )

            chunks = chunks_from_points(points)

            if not chunks:
                yield await _done(
                    db,
                    assistant_message(
                        notebook_id=payload.notebook_id,
                        content=NO_MATCH_CONTENT,
                        chunks=[],
                    ),
                )
                return

            # Stream the grounded answer token by token.
            stream = await llm.chat.completions.create(
                model=CHAT_MODEL,
                messages=build_messages(
                    payload.question,
                    history,
                    chunks,
                ),
                temperature=0.2,
                max_tokens=1200,
                stream=True,
            )

            parts: list[str] = []

            async for chunk in stream:
                # Usage-only chunks carry no choices.
                if not chunk.choices:
                    continue

                delta = chunk.choices[0].delta
                piece = delta.content if delta else None

                if not piece:
                    continue

                parts.append(piece)

                yield sse_event(
                    {
                        "type": "delta",
                        "content": piece,
                    }
                )

            content = "".join(parts).strip()

            if not content:
                raise RuntimeError("Empty model response")

            # Parse citations and persist the completed answer.
            assistant = assistant_message(
                notebook_id=payload.notebook_id,
                content=content,
                chunks=chunks,
                model=CHAT_MODEL,
            )
            await save_message(db, assistant)

            yield sse_event(
                {
                    "type": "done",
                    "message": message_payload(assistant),
                }
            )

        # Note: asyncio.CancelledError is a BaseException, so it bypasses
        # the handler below and propagates to cancel the stream on disconnect.
        except Exception as error:
            print(
                f"[opennotebook] Ask failed for notebook "
                f"{payload.notebook_id}: {error}"
            )
            yield sse_event(
                {
                    "type": "error",
                    "detail": (
                        "Could not generate an answer. "
                        "Please try again."
                    ),
                }
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get(
    "",
    response_model=list[MessageOut],
)
async def message_history(
    current_user: CurrentUser,
    db: Db,
    notebook_id: str = Query(...),
) -> list[MessageOut]:
    """Full conversation history for a notebook the user owns."""

    notebook = await get_notebook(
        db,
        notebook_id,
        current_user.id,
    )

    if notebook is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notebook not found",
        )

    messages = await list_messages(
        db,
        notebook_id,
        limit=200,
    )

    return [
        MessageOut.model_validate(message)
        for message in messages
    ]


async def _done(
    db,
    assistant: Message,
) -> str:
    """Persist a canned/complete assistant message and emit its done event."""

    await save_message(db, assistant)

    return sse_event(
        {
            "type": "done",
            "message": message_payload(assistant),
        }
    )
