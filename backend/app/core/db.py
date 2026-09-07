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
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./blindspot.db")

# Normalize postgres:// schema (often provided by Supabase / Heroku) to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# check_same_thread is only needed for SQLite; harmless to skip for Postgres
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
)
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
    """Creates all tables if they don't exist yet and seeds starter lectures."""
    global engine, SessionLocal
    from backend.app.model import models  # noqa: F401 — import so models register on Base

    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning(
            "Primary database connection failed (%s). Falling back to local SQLite database: %s",
            DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL,
            e,
        )
        # Fallback to local SQLite
        fallback_url = "sqlite:///./blindspot.db"
        engine = create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )
        SessionLocal.configure(bind=engine)
        Base.metadata.create_all(bind=engine)

    # Seed starter lectures if table is empty
    from backend.app.core.seed import seed_default_lectures
    db = SessionLocal()
    try:
        seed_default_lectures(db)
    except Exception as seed_err:
        logger.warning("Database seeding notice: %s", seed_err)
    finally:
        db.close()

