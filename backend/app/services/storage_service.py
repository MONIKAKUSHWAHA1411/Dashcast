import logging
from functools import lru_cache
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_s3_client():
    """Return a cached boto3 S3 client, configured for MinIO if an endpoint URL is set."""
    kwargs = {
        "aws_access_key_id": settings.S3_ACCESS_KEY or None,
        "aws_secret_access_key": settings.S3_SECRET_KEY or None,
    }
    if settings.S3_ENDPOINT_URL:
        # MinIO or other S3-compatible storage
        kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
    return boto3.client("s3", **kwargs)


def ensure_bucket_exists() -> None:
    """Create the configured S3 bucket if it does not already exist.

    Silently succeeds when the bucket already exists, or when running
    against real AWS where we expect the bucket to be pre-created.
    """
    client = _get_s3_client()
    bucket = settings.S3_BUCKET
    try:
        client.head_bucket(Bucket=bucket)
        logger.debug("Bucket '%s' already exists.", bucket)
    except ClientError as exc:
        error_code = exc.response["Error"]["Code"]
        if error_code in ("404", "NoSuchBucket"):
            try:
                client.create_bucket(Bucket=bucket)
                logger.info("Created bucket '%s'.", bucket)
            except ClientError as create_exc:
                logger.warning(
                    "Could not create bucket '%s': %s", bucket, create_exc
                )
        else:
            logger.warning(
                "Unexpected error checking bucket '%s': %s", bucket, exc
            )


def upload_file(file_bytes: bytes, key: str, content_type: str) -> str:
    """Upload *file_bytes* to S3 under *key* and return the key.

    Args:
        file_bytes: Raw file content.
        key: S3 object key (path inside the bucket).
        content_type: MIME type, e.g. ``"text/csv"``.

    Returns:
        The S3 object key that was written.
    """
    client = _get_s3_client()
    client.put_object(
        Bucket=settings.S3_BUCKET,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    logger.info("Uploaded file to s3://%s/%s", settings.S3_BUCKET, key)
    return key


def download_file(key: str) -> bytes:
    """Download an object from S3 and return its raw bytes.

    Args:
        key: S3 object key.

    Returns:
        The object's raw bytes.
    """
    client = _get_s3_client()
    response = client.get_object(Bucket=settings.S3_BUCKET, Key=key)
    return response["Body"].read()


def get_presigned_url(key: str, expires: int = 3600) -> str:
    """Generate a pre-signed GET URL for an S3 object.

    Args:
        key: S3 object key.
        expires: URL validity in seconds (default 1 hour).

    Returns:
        The pre-signed HTTPS URL as a string.
    """
    client = _get_s3_client()
    url = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": key},
        ExpiresIn=expires,
    )
    return url
