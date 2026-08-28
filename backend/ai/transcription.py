"""
backend/ai/transcription.py

Owner: Hashim (AI/Planning)

Thin wrapper around Ayesha's canonical transcription module at
backend/transcription.py. Exists so that the backend/ai/ package is
self-contained per blueprint §8 — any AI/Planning code that needs
transcription can import from within its own package rather than
reaching outside it.

The function signature is identical to the original:
    transcribe(audio_url: str, lecture_id: int) -> list[TranscriptSegment]

Per blueprint §7.3, the signature stays stable. When Alibaba credits
arrive and the ASR backend swaps from faster-whisper to Fun-ASR/Qwen-ASR,
only the internals of the original module change — this wrapper and
everything that calls it remain untouched.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure the project root is on sys.path so both package-qualified and
# direct-run imports work correctly.
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from backend.transcription import transcribe  # noqa: F401 — re-exported

__all__ = ["transcribe"]
