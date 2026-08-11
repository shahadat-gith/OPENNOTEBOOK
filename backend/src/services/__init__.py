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

__all__ = [
    "normalize_email",
    "get_user_by_email",
    "get_user_by_id",
    "create_user",
    "authenticate_user",
    "update_last_login",
    "embed_query",
    "embed_texts",
    "count_sources",
    "create_notebook",
    "get_notebook",
    "list_notebooks",
]
