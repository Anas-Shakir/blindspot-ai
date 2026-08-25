"""
backend/storage.py

Owner: Ayesha (Backend)

Local-disk storage adapter for the hackathon MVP. Per blueprint §7.3,
this sits behind a stable save()/get_url() interface so swapping to
MinIO now (or Alibaba OSS later) only means changing what's *inside*
these two functions — nothing that calls storage.py elsewhere has to
change.
"""

import shutil
import uuid
from pathlib import Path

STORAGE_DIR = Path(__file__).parent / "storage_data"
STORAGE_DIR.mkdir(exist_ok=True)


def save(source_path: str, original_filename: str) -> str:
    """Copies a file into local storage and returns a stable reference to it.

    Args:
        source_path: Where the uploaded file currently lives right now
            (e.g. a temp path from FastAPI's UploadFile, or a path passed
            in directly during a standalone test run).
        original_filename: The original filename — kept only to preserve
            the file extension in storage.

    Returns:
        A string reference callers should treat as opaque. For local disk
        today, it happens to be a real file path; once this swaps to
        MinIO/OSS, it becomes a real URL instead — nothing that calls
        save() should assume which.
    """
    ext = Path(original_filename).suffix
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest_path = STORAGE_DIR / stored_name

    shutil.copy(source_path, dest_path)

    return str(dest_path)


def get_url(stored_ref: str) -> str:
    """Resolves a stored reference back into something accessible.

    For local disk, save() already returns a usable path, so this is a
    no-op today — it exists purely so callers never have to change when
    this becomes a real MinIO/OSS URL later.
    """
    return stored_ref
