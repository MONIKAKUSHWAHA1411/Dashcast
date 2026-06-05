import secrets
import string

ALPHABET = string.ascii_lowercase + string.digits


def generate_slug(length: int = 7) -> str:
    """Generate a random URL-safe slug of the given length."""
    return "".join(secrets.choice(ALPHABET) for _ in range(length))
