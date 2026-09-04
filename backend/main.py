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

from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.db import init_db
from backend.app.api import whiteboard
from backend.app.api.v1.endpoints import lectures, session

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

from fastapi.staticfiles import StaticFiles
from backend.app.core.paths import STORAGE_DIR
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")




@app.get("/health")
def health():
    """Simple health check endpoint."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)