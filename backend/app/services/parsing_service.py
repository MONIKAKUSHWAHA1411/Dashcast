"""
parsing_service.py
~~~~~~~~~~~~~~~~~~
Extract raw text from uploaded QA report files so it can be passed to the
LLM for metric extraction.
"""

import io
import json
import logging

logger = logging.getLogger(__name__)

_CSV_ROW_LIMIT = 200
_EXCEL_ROW_LIMIT = 200
_PDF_CHAR_LIMIT = 8_000
_JSON_CHAR_LIMIT = 6_000


def extract_raw_text(file_bytes: bytes, file_type: str) -> str:
    """Return a plain-text representation of *file_bytes*.

    Args:
        file_bytes: Raw uploaded file content.
        file_type:  One of ``"csv"``, ``"xlsx"``, ``"pdf"``, ``"json"``.

    Returns:
        A UTF-8 string suitable for passing to the LLM, possibly truncated.

    Raises:
        ValueError: When *file_type* is not supported.
    """
    file_type = file_type.lower().strip(".")

    if file_type == "csv":
        return _extract_csv(file_bytes)
    elif file_type in ("xlsx", "xls"):
        return _extract_excel(file_bytes)
    elif file_type == "pdf":
        return _extract_pdf(file_bytes)
    elif file_type == "json":
        return _extract_json(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {file_type!r}")


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _extract_csv(file_bytes: bytes) -> str:
    import pandas as pd  # local import keeps startup fast

    buf = io.BytesIO(file_bytes)
    try:
        df = pd.read_csv(buf, nrows=_CSV_ROW_LIMIT)
    except Exception:
        # Fallback: try UTF-8 then latin-1
        buf.seek(0)
        df = pd.read_csv(buf, nrows=_CSV_ROW_LIMIT, encoding="latin-1")

    return df.to_csv(index=False)


def _extract_excel(file_bytes: bytes) -> str:
    import pandas as pd

    buf = io.BytesIO(file_bytes)
    xl = pd.ExcelFile(buf)
    parts = []
    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name, nrows=_EXCEL_ROW_LIMIT)
        parts.append(f"=== Sheet: {sheet_name} ===")
        parts.append(df.to_csv(index=False))

    return "\n".join(parts)


def _extract_pdf(file_bytes: bytes) -> str:
    import fitz  # PyMuPDF

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    texts = []
    for page in doc:
        texts.append(page.get_text())
    doc.close()

    full_text = "\n".join(texts)
    if len(full_text) > _PDF_CHAR_LIMIT:
        full_text = full_text[:_PDF_CHAR_LIMIT]
        logger.debug("PDF text truncated to %d chars.", _PDF_CHAR_LIMIT)

    return full_text


def _extract_json(file_bytes: bytes) -> str:
    try:
        parsed = json.loads(file_bytes.decode("utf-8"))
    except json.JSONDecodeError:
        # Return raw text if parsing fails
        raw = file_bytes.decode("utf-8", errors="replace")
        return raw[:_JSON_CHAR_LIMIT]

    serialised = json.dumps(parsed, indent=2)
    if len(serialised) > _JSON_CHAR_LIMIT:
        serialised = serialised[:_JSON_CHAR_LIMIT]
        logger.debug("JSON text truncated to %d chars.", _JSON_CHAR_LIMIT)

    return serialised
