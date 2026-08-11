from .auth import (
    authenticate_user,
    create_user,
    get_user_by_email,
    get_user_by_id,
    normalize_email,
    update_last_login,
)

from .embeddings import (
    embed_query,
    embed_texts,
)

from .notebook import (
    count_sources,
    create_notebook,
    get_notebook,
    list_notebooks,
)

from .qdrant import (
    delete_source_chunks,
    insert_chunks,
    search_chunks,
)

from .s3 import (
    delete_from_s3,
    upload_to_s3,
)

from .chunking import(
    chunk_text
)

from .chat import (
    list_messages,
    save_message,
)


__all__ = [
    # Auth
    "normalize_email",
    "get_user_by_email",
    "get_user_by_id",
    "create_user",
    "authenticate_user",
    "update_last_login",

    # Embeddings
    "embed_query",
    "embed_texts",

    # Notebook
    "count_sources",
    "create_notebook",
    "get_notebook",
    "list_notebooks",

    # Qdrant
    "insert_chunks",
    "search_chunks",
    "delete_source_chunks",

    # S3
    "upload_to_s3",
    "delete_from_s3",
    
    # Chunking
    "chunk_text",

    # Chat
    "list_messages",
    "save_message",
]