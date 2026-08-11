

def get_client():
    """Return a shared boto3 SQS client."""
    raise NotImplementedError


def get_queue_url(queue_name: str) -> str:
    """Resolve a queue name to its URL (or read from env vars)."""
    raise NotImplementedError
