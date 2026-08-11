

import os

from dotenv import load_dotenv

from configs import llm


load_dotenv()


MODEL = os.environ["OPENROUTER_EMBEDDING_MODEL"]


async def embed_texts(
    texts: list[str],
) -> list[list[float]]:
    """Generate embeddings for multiple texts."""

    if not texts:
        return []

    response = await llm.embeddings.create(
        model=MODEL,
        input=texts,
    )

    return [
        item.embedding
        for item in response.data
    ]


async def embed_query(
    text: str,
) -> list[float]:
    """Generate an embedding for a single query."""

    embeddings = await embed_texts([text])

    return embeddings[0]

