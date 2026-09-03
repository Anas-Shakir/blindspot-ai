from pathlib import Path

# blindspot-ai/backend
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
# blindspot-ai
PROJECT_ROOT = BACKEND_DIR.parent

STORAGE_DIR = BACKEND_DIR / "storage_data"
TTS_STORAGE_DIR = STORAGE_DIR / "tts"
SESSION_STORAGE_DIR = STORAGE_DIR / "sessions"

STORAGE_DIR.mkdir(parents=True, exist_ok=True)
TTS_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
SESSION_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
