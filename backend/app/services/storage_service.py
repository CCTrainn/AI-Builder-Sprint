"""Supabase Storage 연동.

담당: ROLE-BE-RECORDS
원본 파일은 private bucket에 저장한다.
"""

from pathlib import PurePosixPath

import httpx

from app.core.config import get_settings

BUCKET_NAME = "work-records"


class StorageConfigurationError(RuntimeError):
    """Supabase Storage 환경변수가 준비되지 않은 경우."""


class StorageUploadError(RuntimeError):
    """Supabase Storage 작업이 실패한 경우."""


def build_storage_path(
    *,
    user_id: str,
    workplace_id: str,
    record_id: str,
    extension: str,
) -> str:
    """사용자 파일명과 무관한 ASCII Storage 경로를 만든다."""

    safe_extension = extension.lower().lstrip(".")
    return str(
        PurePosixPath(user_id)
        / workplace_id
        / record_id
        / f"original.{safe_extension}"
    )


def _storage_credentials() -> tuple[str, str]:
    settings = get_settings()
    url = settings.supabase_url.rstrip("/")
    key = settings.supabase_service_role_key.strip()
    if not url or not key:
        raise StorageConfigurationError(
            "SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 backend/.env에 설정해 주세요."
        )
    return url, key


async def upload_bytes(
    *,
    storage_path: str,
    file_bytes: bytes,
    content_type: str,
) -> None:
    """원본 파일을 private bucket에 저장한다."""

    url, key = _storage_credentials()
    endpoint = f"{url}/storage/v1/object/{BUCKET_NAME}/{storage_path}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": content_type,
        "x-upsert": "false",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(endpoint, headers=headers, content=file_bytes)
    except httpx.HTTPError as exc:
        raise StorageUploadError("Storage 서버에 연결하지 못했습니다.") from exc

    if response.status_code not in {200, 201}:
        raise StorageUploadError(
            f"Storage 업로드에 실패했습니다. status={response.status_code}"
        )


async def delete_object(*, storage_path: str) -> None:
    """DB 저장 실패 시 업로드한 원본 파일을 정리한다."""

    url, key = _storage_credentials()
    endpoint = f"{url}/storage/v1/object/{BUCKET_NAME}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.delete(
                endpoint,
                headers=headers,
                json={"prefixes": [storage_path]},
            )
    except httpx.HTTPError as exc:
        raise StorageUploadError("Storage 서버에 연결하지 못했습니다.") from exc

    if response.status_code not in {200, 204}:
        raise StorageUploadError(
            f"Storage 파일 정리에 실패했습니다. status={response.status_code}"
        )
