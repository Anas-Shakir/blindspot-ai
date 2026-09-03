"""
backend/db.py

Owner: Ayesha (Backend)

Defaults to a local SQLite file so this runs with zero setup (no docker,
no separate Postgres install). Once the team's docker-compose Postgres
is up, set the DATABASE_URL env var and nothing else in the codebase
has to change - that's the whole point of going through SQLAlchemy.

Example Postgres URL once you're ready to switch:
    DATABASE_URL=postgresql://user:password@localhost:5432/blindspot
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./blindspot.db")

# check_same_thread is only needed for SQLite; harmless to skip for Postgres
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a session, always closes it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Creates all tables if they don't exist yet. Safe to call repeatedly."""
    from backend.app.model import models  # noqa: F401 — import so models register on Base
    Base.metadata.create_all(bind=engine)
