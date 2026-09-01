"""
backend/main.py

FastAPI application entry point. Initializes the app, mounts routes,
and sets up middleware. Per blueprint §8, this is kept deliberately
simple — real endpoint logic lives in backend/api/ modules.

Run locally with:
    pip install fastapi uvicorn python-multipart
    uvicorn backend.main:app --reload

Runs on http://localhost:8000 by default.
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db import init_db
from backend.api import lectures, session, whiteboard

# Initialize database tables on startup
init_db()

app = FastAPI(
    title="Blindspot AI",
    description="Turn recorded lectures into active learning",
    version="0.1.0",
)

# Allow frontend (will be on a different port during dev) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon; tighten this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount route modules
app.include_router(lectures.router, prefix="/api", tags=["lectures"])
app.include_router(session.router, prefix="/api", tags=["session"])
app.include_router(whiteboard.router, prefix="/api/whiteboard", tags=["whiteboard"])

# Mount static storage for serving generated audio files
from pathlib import Path
from fastapi.staticfiles import StaticFiles

storage_dir = Path(__file__).resolve().parent / "storage_data"
storage_dir.mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(storage_dir)), name="storage")


@app.get("/health")
def health():
    """Simple health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)