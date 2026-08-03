"""Private local file storage for uploaded work records."""

import asyncio
import os
import tempfile
from pathlib import Path, PurePosixPath

from app.core.config import get_settings

BUCKET_NAME = "work-records"


class StorageConfigurationError(RuntimeError):
    """The configured local storage root is invalid."""


class StorageUploadError(RuntimeError):
    """A local file operation failed."""


def build_storage_path(
    *,
    user_id: str,
    workplace_id: str,
    record_id: str,
    extension: str,
) -> str:
    """Build an ASCII relative path that never contains the user's filename."""

    safe_extension = extension.lower().lstrip(".")
    return str(
        PurePosixPath(user_id)
        / workplace_id
        / record_id
        / f"original.{safe_extension}"
    )


def storage_root() -> Path:
    settings = get_settings()
    return (settings.local_data_dir / settings.local_upload_dir_name).resolve()


def _object_path(storage_path: str) -> Path:
    relative = PurePosixPath(storage_path)
    if relative.is_absolute() or ".." in relative.parts or not relative.parts:
        raise StorageConfigurationError("안전하지 않은 로컬 파일 경로입니다.")
    root = storage_root()
    target = root.joinpath(*relative.parts).resolve()
    if not target.is_relative_to(root):
        raise StorageConfigurationError("로컬 저장 폴더 밖의 경로는 사용할 수 없습니다.")
    return target


def _write_object(target: Path, file_bytes: bytes) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        raise StorageUploadError("같은 경로에 이미 원본 파일이 있습니다.")

    temporary_path: Path | None = None
    try:
        descriptor, temporary_name = tempfile.mkstemp(prefix=".upload-", dir=target.parent)
        temporary_path = Path(temporary_name)
        with os.fdopen(descriptor, "wb") as temporary_file:
            temporary_file.write(file_bytes)
            temporary_file.flush()
            os.fsync(temporary_file.fileno())
        os.replace(temporary_path, target)
        temporary_path = None
    except OSError as exc:
        raise StorageUploadError("원본 파일을 로컬 폴더에 저장하지 못했습니다.") from exc
    finally:
        if temporary_path is not None:
            try:
                temporary_path.unlink(missing_ok=True)
            except OSError:
                pass


async def upload_bytes(
    *,
    storage_path: str,
    file_bytes: bytes,
    content_type: str,
) -> None:
    """Atomically save an original file under the private backend data directory."""

    del content_type  # Kept in the interface for a future object-storage adapter.
    target = _object_path(storage_path)
    await asyncio.to_thread(_write_object, target, file_bytes)


def _delete_object(target: Path) -> None:
    root = storage_root()
    try:
        target.unlink(missing_ok=True)
        parent = target.parent
        while parent != root and parent.is_relative_to(root):
            try:
                parent.rmdir()
            except OSError:
                break
            parent = parent.parent
    except OSError as exc:
        raise StorageUploadError("로컬 원본 파일을 삭제하지 못했습니다.") from exc


async def delete_object(*, storage_path: str) -> None:
    """Delete one known object and then remove only its empty parent folders."""

    target = _object_path(storage_path)
    await asyncio.to_thread(_delete_object, target)
