"""Helpers for SQS source-processing jobs."""

import asyncio
import os
import tempfile

import pymupdf

from configs import QUEUE_URL, sqs
from services import chunk_text
from services.s3 import download_from_s3


def extract_and_chunk(
    *,
    s3_key: str,
    source_id: str,
    notebook_id: str,
    filename: str,
) -> tuple[int, list[dict]]:
    """Download a PDF from S3, extract pages, and chunk the text."""

    with tempfile.NamedTemporaryFile(
        suffix=".pdf",
        delete=False,
    ) as temp_file:
        temp_path = temp_file.name

    page_count = 0
    all_chunks: list[dict] = []

    try:
        download_from_s3(
            s3_key,
            temp_path,
        )

        document = pymupdf.open(temp_path)

        try:
            page_count = document.page_count

            for page_number, page in enumerate(
                document,
                start=1,
            ):
                chunks = chunk_text(
                    page.get_text("text"),
                    page=page_number,
                )

                for chunk in chunks:
                    chunk.update(
                        {
                            "source_id": source_id,
                            "notebook_id": notebook_id,
                            "filename": filename,
                        }
                    )

                all_chunks.extend(chunks)

        finally:
            document.close()

    finally:
        try:
            os.unlink(temp_path)
        except FileNotFoundError:
            pass

    return page_count, all_chunks


async def acknowledge_message(
    message: dict,
) -> None:
    """Delete a successfully processed SQS message."""

    try:
        await asyncio.to_thread(
            sqs.delete_message,
            QueueUrl=QUEUE_URL,
            ReceiptHandle=message["ReceiptHandle"],
        )
    except Exception as error:
        print(
            f"[opennotebook] Failed to acknowledge message: {error}"
        )