from fastapi import APIRouter, status

from schemas.notebook import NotebookCreate, NotebookOut
from services.notebook import count_sources, create_notebook, list_notebooks
from utils.deps import CurrentUser, Db

router = APIRouter(prefix="/notebooks", tags=["notebooks"])

@router.get("", response_model=list[NotebookOut])
async def list_user_notebooks(
    current_user: CurrentUser,
    db: Db,
) -> list[NotebookOut]:

    notebooks = await list_notebooks(db, current_user.id)

    return [
        NotebookOut(
            id=n.id,
            title=n.title,
            description=n.description,
            source_count=await count_sources(db, n.id),
            created_at=n.created_at,
            updated_at=n.updated_at,
        )
        for n in notebooks
    ]

@router.post("", response_model=NotebookOut, status_code=status.HTTP_201_CREATED)
async def create(
    payload: NotebookCreate,
    current_user: CurrentUser,
    db: Db,
) -> NotebookOut:

    notebook = await create_notebook(
        db,
        current_user.id,
        payload.title,
        payload.description,
    )

    return NotebookOut(
        id=notebook.id,
        title=notebook.title,
        description=notebook.description,
        source_count=0,
        created_at=notebook.created_at,
        updated_at=notebook.updated_at,
    )

