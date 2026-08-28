"""
backend/ai/transcription.py

Turns a raw uploaded file (audio OR video) into a list of TranscriptSegment
objects:

    1. If the upload is video, extract the audio track first.
    2. Run faster-whisper on the audio to get timestamped segments.
    3. Normalize the output into TranscriptSegment (schemas.py) so nothing
       downstream (API routes, DB layer, other AI modules) needs to know or
       care that faster-whisper produced it.


Requires: faster-whisper, ffmpeg-python (or the ffmpeg binary on PATH)
    pip install faster-whisper ffmpeg-python
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from tempfile import NamedTemporaryFile

import boto3
import requests
from faster_whisper import WhisperModel

# Add parent directory to path to allow imports when run directly
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from .schemas import TranscriptSegment
except ImportError:
    from backend.schemas import TranscriptSegment

# Extensions we treat as "already audio" — anything else is assumed to be
# video and gets its audio track extracted first via ffmpeg.
AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg", ".aac"}

# Loaded once per process, not per call — model load is the expensive part.
# "base" is a good speed/accuracy tradeoff for a hackathon demo; bump to
# "small" or "medium" if accuracy on rough classroom audio isn't good enough.
_MODEL_SIZE = "base"
_model: WhisperModel | None = None


def _get_model() -> WhisperModel:
    global _model
    if _model is None:
        # compute_type="int8" keeps this usable on CPU-only dev machines.
        # We'll switch to "float16" + device="cuda" later for GPU inference in production.
        _model = WhisperModel(_MODEL_SIZE, device="cpu", compute_type="int8")
    return _model


def _is_video(file_path: str) -> bool:
    return Path(file_path).suffix.lower() not in AUDIO_EXTENSIONS
 
 
def _is_local_path(ref: str) -> bool:
    """Check if this is a local file path (vs R2 object key)."""
    return ref.startswith(("/", "\\", "C:\\")) or Path(ref).exists()
 
 
def _download_from_r2(object_key: str) -> str:
    """Downloads an object from R2 to a temp local file.
 
    Uses the R2 credentials already in environment. Returns the temp
    file path — caller is responsible for cleanup.
    """
    account_id = os.getenv("R2_ACCOUNT_ID", "").strip()
    access_key = os.getenv("R2_ACCESS_KEY_ID", "").strip()
    secret_key = os.getenv("R2_SECRET_KEY", "").strip()
    bucket_name = os.getenv("R2_BUCKET_NAME", "blindspot-ai").strip()
 
    if not account_id or not access_key or not secret_key:
        raise RuntimeError(
            "R2 credentials not configured. Set R2_ACCOUNT_ID, "
            "R2_ACCESS_KEY_ID, R2_SECRET_KEY environment variables."
        )
 
    s3_client = boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )
 
    # Create a temp file with the right extension
    ext = Path(object_key).suffix or ".bin"
    temp_file = NamedTemporaryFile(suffix=ext, delete=False)
    temp_path = temp_file.name
    temp_file.close()
 
    # Download from R2
    try:
        s3_client.download_file(bucket_name, object_key, temp_path)
    except Exception as e:
        raise RuntimeError(f"Failed to download from R2: {e}")
 
    return temp_path
 
 
def _extract_audio(video_path: str) -> str:
    """Pulls the audio track out of a video file into a temp .wav."""
    out_file = NamedTemporaryFile(suffix=".wav", delete=False)
    out_path = out_file.name
    out_file.close()
 
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        out_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg audio extraction failed: {result.stderr}")
 
    return out_path
 
 
def transcribe(audio_ref: str, lecture_id: int) -> list[TranscriptSegment]:
    """Transcribes a lecture recording into timestamped segments.
 
    Args:
        audio_ref: Either:
            - An R2 object key (from storage.save()) — read via boto3
            - A local file path (for dev/testing) — read directly
        lecture_id: The lecture this transcript belongs to.
 
    Returns:
        List of TranscriptSegment ordered by start time.
    """
    local_path = audio_ref
    downloaded_path: str | None = None
    extracted_path: str | None = None
 
    try:
        # If it's an R2 object key (not a local path), download it first
        if not _is_local_path(audio_ref):
            downloaded_path = _download_from_r2(audio_ref)
            local_path = downloaded_path
 
        # If it's video, extract audio
        if _is_video(local_path):
            extracted_path = _extract_audio(local_path)
            local_path = extracted_path
 
        # Transcribe
        model = _get_model()
        segments, _info = model.transcribe(
            local_path,
            word_timestamps=False,
            vad_filter=True,
        )
 
        transcript_segments = [
            TranscriptSegment(
                lecture_id=lecture_id,
                start=seg.start,
                end=seg.end,
                text=seg.text.strip(),
                speaker=None,
            )
            for seg in segments
        ]
 
        return transcript_segments
 
    finally:
        # Clean up temp files
        if downloaded_path is not None:
            Path(downloaded_path).unlink(missing_ok=True)
        if extracted_path is not None:
            Path(extracted_path).unlink(missing_ok=True)