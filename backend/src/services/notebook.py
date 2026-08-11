"""Notebook business logic against MongoDB."""

from motor.motor_asyncio import AsyncIOMotorDatabase

from models.notebook import Notebook
from models.source import Source


async def list_notebooks(
    db: AsyncIOMotorDatabase,
    owner_id: str,
) -> list[Notebook]:
    cursor = db[Notebook.Collection].find({"owner_id": owner_id}).sort("updated_at", -1)
    return [Notebook.from_document(doc) async for doc in cursor]


async def get_notebook(
    db: AsyncIOMotorDatabase,
    notebook_id: str,
    owner_id: str,
) -> Notebook | None:
    doc = await db[Notebook.Collection].find_one(
        {"_id": notebook_id, "owner_id": owner_id}
    )
    return Notebook.from_document(doc) if doc else None


async def create_notebook(
    db: AsyncIOMotorDatabase,
    owner_id: str,
    title: str,
    description: str = "",
) -> Notebook:
    notebook = Notebook(
        owner_id=owner_id,
        title=title.strip(),
        description=description.strip(),
    )
    await db[Notebook.Collection].insert_one(notebook.to_document())
    return notebook


async def count_sources(db: AsyncIOMotorDatabase, notebook_id: str) -> int:
    return await db[Source.Collection].count_documents({"notebook_id": notebook_id})
