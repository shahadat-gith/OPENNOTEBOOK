from configs import publish_message


def publish_source_processing(
    *,
    source_id: str,
    notebook_id: str,
) -> str:
    return publish_message(
        {
            "event": "source.processing",
            "source_id": source_id,
            "notebook_id": notebook_id,
        }
    )
