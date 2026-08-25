"""Backward-compatible alias for the canonical transcription module.

The repository historically had a misspelling: ``trasncription.py``. Keep this
module as a thin alias so older imports continue to work, but the real
implementation lives in backend/transcription.py.
"""

from backend.transcription import *  # noqa: F401,F403
