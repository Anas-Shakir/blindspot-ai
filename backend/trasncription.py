"""
backend/ai/transcription.py

Turns a raw uploaded file (audio OR video) into a list of TranscriptSegment
objects, per backend/schemas.py. This is the ASR half of Task 1:

    1. If the upload is video, extract the audio track first.
    2. Run faster-whisper on the audio to get timestamped segments.
    3. Normalize the output into TranscriptSegment (schemas.py) so nothing
       downstream (API routes, DB layer, other AI modules) needs to know or
       care that faster-whisper produced it.

Per blueprint §7.3, this file's public function signature must stay stable


Requires: faster-whisper, ffmpeg-python (or the ffmpeg binary on PATH)
    pip install faster-whisper ffmpeg-python
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from tempfile import NamedTemporaryFile

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
        # Switch to "float16" + device="cuda" if the team has GPU access.
        _model = WhisperModel(_MODEL_SIZE, device="cpu", compute_type="int8")
    return _model


def _is_video(file_path: str) -> bool:
    return Path(file_path).suffix.lower() not in AUDIO_EXTENSIONS


def _extract_audio(video_path: str) -> str:
    """Pulls the audio track out of a video file into a temp .wav.

    16kHz mono PCM is what faster-whisper expects internally anyway, so
    this doubles as the right pre-processing step regardless of input type.
    Returns the path to the extracted (temporary) audio file — caller is
    responsible for cleaning it up.
    """
    out_file = NamedTemporaryFile(suffix=".wav", delete=False)
    out_path = out_file.name
    out_file.close()

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",                  # drop video stream
        "-acodec", "pcm_s16le", # uncompressed PCM
        "-ar", "16000",         # 16kHz sample rate
        "-ac", "1",             # mono
        out_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg audio extraction failed: {result.stderr}")

    return out_path


def transcribe(audio_url: str, lecture_id: int) -> list[TranscriptSegment]:
    """Transcribes a lecture recording into timestamped segments.

    Args:
        audio_url: Wherever storage.py put the raw uploaded file (local
            path or MinIO URL). Can be audio OR video — video is detected
            and its audio track is extracted automatically.
        lecture_id: The Lecture this transcript belongs to, so each
            TranscriptSegment can be stored against the right row.

    Returns:
        A list of TranscriptSegment, ordered by start time. `embedding` is
        left None here — that's populated in a separate pass (see
        blueprint §6.1: "Vector index").

    Note: this function currently assumes `audio_url` is a local file path.
    If storage.py is backed by MinIO/OSS, download to a temp file first
    (or swap this for a streaming read) before calling _get_model().transcribe.
    """
    local_path = audio_url
    extracted_path: str | None = None

    try:
        if _is_video(local_path):
            extracted_path = _extract_audio(local_path)
            local_path = extracted_path

        model = _get_model()
        segments, _info = model.transcribe(
            local_path,
            word_timestamps=False,  # segment-level is enough for "show me"
            vad_filter=True,        # skip silence, helps on rough classroom audio
        )

        transcript_segments = [
            TranscriptSegment(
                lecture_id=lecture_id,
                start=seg.start,
                end=seg.end,
                text=seg.text.strip(),
                speaker=None,  # diarization is out of scope for the MVP
            )
            for seg in segments
        ]

        return transcript_segments

    finally:
        # Clean up the temp extracted-audio file, if we made one.
        if extracted_path is not None:
            Path(extracted_path).unlink(missing_ok=True)