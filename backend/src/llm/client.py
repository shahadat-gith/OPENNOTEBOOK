"""LLM client wrapper.

TODO: implement a thin client for the chosen provider (OpenAI, Anthropic,
Bedrock, …) driven by the `LLM_PROVIDER` / `LLM_MODEL` env vars.
"""


def generate(prompt: str, **kwargs) -> str:
    """Run a single completion and return the text."""
    raise NotImplementedError


def stream(prompt: str, **kwargs):
    """Yield completion chunks as they arrive (for streaming answers)."""
    raise NotImplementedError
