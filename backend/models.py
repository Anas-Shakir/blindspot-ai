"""
backend/models.py

Owner: Ayesha (Backend)

SQLAlchemy ORM models — the actual DB tables. These mirror the Pydantic
shapes in schemas.py (Lecture, TranscriptSegment) but are the persistence
layer, not the API/interchange layer. Per blueprint §8, more tables
(learning_plans, phases, quiz_items, graph_nodes/edges) get added here
as those features come online — this file starts with just what Task 1
needs: lectures + transcript_chunks.
"""

import enum
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from backend.db import Base


class LectureStatus(str, enum.Enum):
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class Lecture(Base):
    __tablename__ = "lectures"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    audio_url = Column(String, nullable=True)  # set once storage.save() runs
    status = Column(SqlEnum(LectureStatus), default=LectureStatus.PROCESSING, nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    transcript_chunks = relationship(
        "TranscriptChunk", back_populates="lecture", cascade="all, delete-orphan"
    )


class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"

    id = Column(Integer, primary_key=True, index=True)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False)
    start = Column(Float, nullable=False)
    end = Column(Float, nullable=False)
    text = Column(String, nullable=False)
    speaker = Column(String, nullable=True)
    # embedding column intentionally omitted for now — that's populated in
    # a separate pass once pgvector is set up (blueprint §6.1 / Phase 2),
    # and pgvector specifically needs real Postgres, not SQLite.

    lecture = relationship("Lecture", back_populates="transcript_chunks")
