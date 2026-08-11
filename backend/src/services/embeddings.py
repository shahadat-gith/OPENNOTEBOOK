

def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of chunks."""
    raise NotImplementedError


def embed_query(query: str) -> list[float]:
    """Embed a single user question."""
    raise NotImplementedError
