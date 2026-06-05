"""
llm_service.py
~~~~~~~~~~~~~~
Uses the Anthropic Claude API to extract structured QA metrics from raw
report text.  When ANTHROPIC_API_KEY is not configured, returns a mock
payload so the rest of the pipeline keeps working in development.
"""

import json
import logging
from typing import Any, Dict

from app.config import settings

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You are a QA metrics extraction engine. "
    "Extract QA metrics from the provided report text. "
    "Respond ONLY with valid JSON matching the schema. "
    "Use null for missing fields."
)

_SCHEMA_DESCRIPTION = """
Return a single JSON object with exactly these fields:
{
  "report_type": "selenium|playwright|junit|testng|jira|defect|generic",
  "execution_date": "YYYY-MM-DD or null",
  "sprint": "string or null",
  "total_tests": "integer or null",
  "passed": "integer or null",
  "failed": "integer or null",
  "skipped": "integer or null",
  "pass_rate": "float or null",
  "duration_seconds": "float or null",
  "test_suite_name": "string or null",
  "severity_counts": {"critical": 0, "high": 0, "medium": 0, "low": 0},
  "module_failures": [{"module": "string", "failures": "integer"}],
  "daily_trend": [{"date": "YYYY-MM-DD", "passed": "integer", "failed": "integer"}]
}
"""

_MOCK_METRICS: Dict[str, Any] = {
    "report_type": "generic",
    "execution_date": None,
    "sprint": None,
    "total_tests": None,
    "passed": None,
    "failed": None,
    "skipped": None,
    "pass_rate": None,
    "duration_seconds": None,
    "test_suite_name": "Mock Report (no API key)",
    "severity_counts": {"critical": 0, "high": 0, "medium": 0, "low": 0},
    "module_failures": [],
    "daily_trend": [],
}


def _call_claude(client, user_message: str) -> str:
    """Send a single extraction request and return the text response."""
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )
    return message.content[0].text


def extract_metrics(raw_text: str) -> Dict[str, Any]:
    """Extract structured QA metrics from *raw_text* using Claude.

    Falls back gracefully:
    - If ANTHROPIC_API_KEY is empty → returns ``_MOCK_METRICS``.
    - If the first LLM call returns invalid JSON → retries once with a
      clarification prompt.
    - If the second attempt also fails → returns an empty dict.

    Args:
        raw_text: Plain-text content extracted from the uploaded report.

    Returns:
        A dict containing the extracted metrics (may be empty on total failure).
    """
    if not settings.ANTHROPIC_API_KEY:
        logger.warning(
            "ANTHROPIC_API_KEY is not set; returning mock metrics for testing."
        )
        return _MOCK_METRICS.copy()

    import anthropic  # local import so the module loads without the SDK installed

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    user_message = (
        f"{_SCHEMA_DESCRIPTION}\n\n"
        f"Here is the QA report content:\n\n{raw_text}"
    )

    # --- First attempt ---
    try:
        response_text = _call_claude(client, user_message)
        return _parse_json_response(response_text)
    except json.JSONDecodeError as first_exc:
        logger.warning("First LLM response was not valid JSON: %s", first_exc)

    # --- Retry with clarification ---
    retry_message = (
        user_message
        + "\n\nYour previous response could not be parsed as JSON. "
        "Please respond with ONLY a valid JSON object and no other text."
    )
    try:
        response_text = _call_claude(client, retry_message)
        return _parse_json_response(response_text)
    except json.JSONDecodeError as second_exc:
        logger.error(
            "Second LLM response was also not valid JSON: %s", second_exc
        )
        return {}
    except Exception as exc:
        logger.error("LLM extraction failed on retry: %s", exc)
        return {}


def _parse_json_response(text: str) -> Dict[str, Any]:
    """Extract a JSON object from *text*, stripping markdown fences if present."""
    stripped = text.strip()

    # Strip ```json ... ``` or ``` ... ``` wrappers
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        # Remove first and last fence lines
        inner_lines = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        stripped = "\n".join(inner_lines).strip()

    return json.loads(stripped)
