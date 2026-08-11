

def publish_ingest_job(source_id: str, s3_key: str) -> None:
    """Queue a PDF ingestion job."""
    raise NotImplementedError


def publish_ask_job(notebook_id: str, question: str) -> None:
    """Queue an answer-generation job."""
    raise NotImplementedError
