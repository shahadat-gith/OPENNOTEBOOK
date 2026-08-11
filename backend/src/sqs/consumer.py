"""SQS consumer for source-processing jobs."""

import asyncio
import json

from configs import QUEUE_URL, get_db, sqs
from models import Source
from models.common import utcnow
from services import embed_texts, insert_chunks

from .helpers import acknowledge_message, extract_and_chunk


db = get_db()

BATCH_SIZE = 32


class PermanentMessageError(Exception):
    """Error for messages that should not be retried."""


async def process_message(
    message: dict,
) -> None:
    """Process a single source-processing message."""

    body = json.loads(message["Body"])

    if body.get("event") != "source.processing":
        raise PermanentMessageError(
            f"Unknown event: {body.get('event')}"
        )

    source_id = body["source_id"]
    notebook_id = body["notebook_id"]

    print(
        f"[opennotebook] Processing "
        f"source={source_id} notebook={notebook_id}"
    )

    source = await db[Source.Collection].find_one(
        {
            "_id": source_id,
            "notebook_id": notebook_id,
        }
    )

    if not source:
        raise PermanentMessageError(
            f"Source not found: {source_id}"
        )

    s3_key = source.get("s3_key")

    if not s3_key:
        raise PermanentMessageError(
            f"Source has no S3 key: {source_id}"
        )

    try:
        await db[Source.Collection].update_one(
            {"_id": source_id},
            {
                "$set": {
                    "status": "processing",
                    "error": None,
                    "updated_at": utcnow(),
                }
            },
        )

        page_count, chunks = await asyncio.to_thread(
            extract_and_chunk,
            s3_key=s3_key,
            source_id=source_id,
            notebook_id=notebook_id,
            filename=source["name"],
        )

        if not chunks:
            raise PermanentMessageError(
                "No readable text found in PDF"
            )

        for start in range(
            0,
            len(chunks),
            BATCH_SIZE,
        ):
            batch = chunks[start : start + BATCH_SIZE]

            embeddings = await embed_texts(
                [chunk["text"] for chunk in batch]
            )

            points = [
                {
                    "notebook_id": notebook_id,
                    "source_id": source_id,
                    "filename": source["name"],
                    "page": chunk["page"],
                    "chunk_index": chunk["chunk_index"],
                    "text": chunk["text"],
                    "embedding": embedding,
                }
                for chunk, embedding in zip(
                    batch,
                    embeddings,
                )
            ]

            await asyncio.to_thread(
                insert_chunks,
                points,
            )

        await db[Source.Collection].update_one(
            {"_id": source_id},
            {
                "$set": {
                    "status": "ready",
                    "page_count": page_count,
                    "chunk_count": len(chunks),
                    "error": None,
                    "updated_at": utcnow(),
                }
            },
        )

        print(
            f"[opennotebook] Finished "
            f"source={source_id} "
            f"chunks={len(chunks)} "
            f"pages={page_count}"
        )

    except PermanentMessageError:
        raise

    except Exception as error:
        await db[Source.Collection].update_one(
            {"_id": source_id},
            {
                "$set": {
                    "status": "failed",
                    "error": str(error),
                    "updated_at": utcnow(),
                }
            },
        )

        raise


async def consume() -> None:
    """Continuously poll SQS for source-processing jobs."""

    print(
        f"[opennotebook] SQS consumer started - {QUEUE_URL}"
    )

    last_error = None

    while True:
        try:
            response = await asyncio.to_thread(
                sqs.receive_message,
                QueueUrl=QUEUE_URL,
                MaxNumberOfMessages=10,
                WaitTimeSeconds=20,
                VisibilityTimeout=300,
            )

        except Exception as error:
            error_message = str(error)

            if error_message != last_error:
                print(
                    "[opennotebook] SQS receive failed "
                    f"(retrying in 5s): {error_message}"
                )
                last_error = error_message

            await asyncio.sleep(5)
            continue

        last_error = None

        messages = response.get("Messages", [])

        for message in messages:
            try:
                await process_message(message)

            except PermanentMessageError as error:
                print(
                    "[opennotebook] "
                    f"Acknowledging dead message: {error}"
                )

                await acknowledge_message(message)

            except Exception as error:
                print(
                    "[opennotebook] "
                    f"Failed to process message "
                    f"(will retry): {error}"
                )

            else:
                await acknowledge_message(message)