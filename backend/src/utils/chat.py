"""Shared helpers for the chat (ask) endpoints.

Everything the chat endpoints need lives here: prompt assembly, citation
parsing, SSE serialization, greeting detection and assistant-message
building. The streaming/HTTP concerns stay in ``api/v1/chat.py``.
"""

import json
import re
from typing import Any

from models.message import Citation, Message
from schemas.chat import MessageOut

# ---------------------------------------------------------------------------
# Prompt assembly
# ---------------------------------------------------------------------------

CITATION_RE = re.compile(r"\[\[citation:(\d+)\]\]")

SYSTEM_PROMPT = (
    "You are OpenNotebook, an AI assistant that answers questions using only "
    "the user's uploaded documents.\n\n"
    "Rules:\n"
    "1. Ground every claim in the provided context passages. Never answer from "
    "outside knowledge.\n"
    "2. After each claim, cite the passage that supports it using the "
    "[[citation:n]] marker, where n matches the numbered [n] context passage.\n"
    "3. If the context does not contain the answer, say you could not find it "
    "in the uploaded documents. Never guess or invent.\n"
    "4. Use markdown: **bold** for key terms, short paragraphs, and lists only "
    "when they help.\n"
    "5. Be concise and direct. Reply in the same language as the question."
)


def format_chunks(chunks: list[dict]) -> str:
    """Render retrieved chunks as numbered context passages."""

    return "\n\n".join(
        f"[{i}] (Source: {chunk['filename']}, "
        f"page {chunk['page']})\n{chunk['text']}"
        for i, chunk in enumerate(chunks, start=1)
    )


def build_messages(
    question: str,
    history: list,
    chunks: list[dict],
) -> list[dict]:
    """Build the OpenAI-style message list for a grounded answer.

    ``history`` holds prior messages (the current question is passed
    separately); ``chunks`` are the retrieved context passages.
    """

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]

    # Short conversational memory: the most recent turns only.
    for message in history[-6:]:
        messages.append(
            {
                "role": message.role,
                "content": message.content,
            }
        )

    messages.append(
        {
            "role": "user",
            "content": (
                f"Context passages from the user's documents:\n\n"
                f"{format_chunks(chunks)}\n\n"
                f"Question: {question}\n\n"
                "Answer the question using ONLY the context above. Cite each "
                "claim with the matching [[citation:n]] marker."
            ),
        }
    )

    return messages


def parse_citations(
    content: str,
    chunks: list[dict],
) -> tuple[str, list[dict]]:
    """Extract [[citation:n]] markers from a model answer.

    Markers are renumbered to a dense 1..k sequence and each referenced chunk
    is turned into citation metadata (index, source, quote, page, relevance)
    so the frontend can render citation cards. Returns the cleaned content
    and the citation list (dicts ready for the ``Citation`` model).
    """

    if not chunks:
        return content, []

    # Chunk numbers actually referenced, in first-appearance order.
    seen: list[int] = []

    for match in CITATION_RE.finditer(content):
        number = int(match.group(1))

        if 1 <= number <= len(chunks) and number not in seen:
            seen.append(number)

    if not seen:
        # No valid citations — strip any stray markers entirely.
        return CITATION_RE.sub("", content), []

    renumber = {
        old: new
        for new, old in enumerate(seen, start=1)
    }

    def _replace(match: re.Match) -> str:
        number = int(match.group(1))

        if number not in renumber:
            return ""

        return f"[[citation:{renumber[number]}]]"

    clean = CITATION_RE.sub(_replace, content)

    citations = []

    for old in seen:
        chunk = chunks[old - 1]

        quote = chunk["text"].strip().replace("\n", " ")

        if len(quote) > 320:
            quote = quote[:320].rsplit(" ", 1)[0] + "…"

        citations.append(
            {
                "index": renumber[old],
                "source_id": chunk["source_id"],
                "source_name": chunk["filename"],
                "quote": quote,
                "page": chunk.get("page"),
                "relevance": round(chunk.get("score", 0.0), 3),
            }
        )

    return clean, citations


# ---------------------------------------------------------------------------
# Endpoint helpers
# ---------------------------------------------------------------------------

MAX_CHUNKS = 8

NO_SOURCES_CONTENT = (
    "This notebook doesn't have any processed sources yet. "
    "Upload a PDF and wait for it to finish processing, "
    "then ask me again."
)

NO_MATCH_CONTENT = (
    "I couldn't find anything relevant in this notebook's sources "
    "to answer that. Try rephrasing your question, or upload more "
    "documents for better coverage."
)

# Simple greetings get a friendly canned reply instead of a RAG lookup.
# Optional trailing "there" ("hi there") and trailing punctuation are allowed.
GREETING_RE = re.compile(
    r"^(hi+|hello+|hey+|yo|howdy|hola|namaste|greetings|"
    r"good (morning|afternoon|evening)|what'?s up|sup)"
    r"( there)?[\s!.,?]*$",
    re.IGNORECASE,
)


def sse_event(payload: dict) -> str:
    """Serialize a server-sent event (``data: {json}\\n\\n``)."""

    return f"data: {json.dumps(payload)}\n\n"


def message_payload(message: Message) -> dict:
    """MessageOut serialized for the ``done`` SSE event."""

    return MessageOut.model_validate(
        message
    ).model_dump(mode="json")


def match_greeting(question: str) -> str | None:
    """Return a capitalized greeting word when the question is a greeting."""

    match = GREETING_RE.match(question.strip())

    if not match:
        return None

    return match.group(1).strip().capitalize()


def greeting_content(
    question: str,
    *,
    has_sources: bool,
) -> str | None:
    """Canned reply for plain greetings, or ``None`` when not a greeting.

    The reply adapts to whether the notebook has processed sources.
    """

    greeting = match_greeting(question)

    if not greeting:
        return None

    if has_sources:
        return (
            f"{greeting}! What can I help you with "
            "from the sources you uploaded?"
        )

    return f"{greeting}! Please upload some sources to ask questions."


def chunks_from_points(points: list[Any]) -> list[dict]:
    """Map Qdrant query result points to chunk dicts."""

    return [
        {
            "source_id": point.payload["source_id"],
            "filename": point.payload["filename"],
            "page": point.payload.get("page"),
            "text": point.payload["text"],
            "score": float(point.score or 0.0),
        }
        for point in points
    ]


def assistant_message(
    *,
    notebook_id: str,
    content: str,
    chunks: list[dict],
    model: str | None = None,
) -> Message:
    """Build a complete assistant message from raw content + retrieved chunks.

    Citation markers in ``content`` are parsed and renumbered, citation
    metadata is derived from ``chunks``, and ``source_ids`` are collected.
    With an empty ``chunks`` list the content is kept verbatim with no
    citations (used for canned replies).
    """

    clean, citation_data = parse_citations(
        content,
        chunks,
    )

    citations = [
        Citation(**item)
        for item in citation_data
    ]

    cited_ids = {
        item["source_id"]
        for item in citation_data
    }

    source_ids = sorted(cited_ids) or sorted(
        {
            chunk["source_id"]
            for chunk in chunks[:3]
        }
    )

    return Message(
        notebook_id=notebook_id,
        role="assistant",
        content=clean,
        source_ids=source_ids,
        citations=citations,
        model=model,
    )
