

def run_ingest_worker() -> None:
    """Consume ingest jobs from the ingest queue."""
    raise NotImplementedError


def run_ask_worker() -> None:
    """Consume ask jobs from the ask queue."""
    raise NotImplementedError
