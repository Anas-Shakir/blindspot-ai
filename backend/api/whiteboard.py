"""
backend/api/whiteboard.py

Isolated API endpoints for the Live AI Whiteboard subsystem.
Provides timing-aware TTS synthesis, command validation, and session endpoints.
"""

from __future__ import annotations

import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

from backend.ai.whiteboard.tts_sync import synthesize_speech_with_timing
from backend.ai.whiteboard.generator import generate_whiteboard_lesson
from backend.ai.whiteboard.interruption_handler import handle_student_interruption
from backend.ai.whiteboard.student_review import evaluate_student_work

logger = logging.getLogger(__name__)

router = APIRouter()


class TimingMarkSchema(BaseModel):
    word: str
    raw_word: str
    offset_ms: float
    duration_ms: float


class TTSTimingRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to synthesize")
    voice: Optional[str] = Field(default=None, description="Neural voice ID")


class TTSTimingResponse(BaseModel):
    audio_url: str
    duration_ms: float
    timing_marks: List[TimingMarkSchema]


class GenerateLessonRequest(BaseModel):
    prompt: str = Field(..., min_length=3, description="Topic or question to explain on whiteboard")
    voice: Optional[str] = Field(default=None, description="Optional voice ID")
    context: Optional[str] = Field(default=None, description="Optional background context")


class InterruptionApiRequest(BaseModel):
    student_query: str = Field(..., min_length=1, description="Student voice/text question")
    current_board_objects: List[dict] = Field(default_factory=list, description="Visible board objects snapshot")
    active_lesson_context: dict = Field(default_factory=dict, description="Current lesson metadata")
    focused_objects: Optional[List[dict]] = Field(default=None, description="Objects the student is pointing at")
    voice: Optional[str] = Field(default=None, description="Voice ID")


class ReviewApiRequest(BaseModel):
    student_work_summary: str = Field(..., description="Summary of student-drawn objects")
    all_board_objects: List[dict] = Field(default_factory=list, description="All board objects")
    lesson_context: dict = Field(default_factory=dict, description="Lesson problem metadata")
    voice: Optional[str] = Field(default=None, description="Voice ID")


@router.post("/tts", response_model=TTSTimingResponse)
async def generate_speech_with_timing(req: TTSTimingRequest):
    """Synthesizes speech and returns the audio URL and word-level timing marks."""
    try:
        result = await synthesize_speech_with_timing(req.text, req.voice)
        return TTSTimingResponse(
            audio_url=result["audio_url"],
            duration_ms=result["duration_ms"],
            timing_marks=[TimingMarkSchema(**m) for m in result["timing_marks"]],
        )
    except Exception as e:
        logger.exception("Failed to synthesize speech with timing: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
def generate_ai_whiteboard_lesson(req: GenerateLessonRequest):
    """Generates an interleaved whiteboard lesson with spoken audio and synchronized draw commands using LLM."""
    try:
        lesson = generate_whiteboard_lesson(
            prompt=req.prompt,
            voice=req.voice,
            context=req.context,
        )
        return lesson
    except Exception as e:
        logger.exception("Failed to generate AI whiteboard lesson: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/interruption")
def handle_interruption_qa(req: InterruptionApiRequest):
    """Answers a student interruption question contextually with spoken audio and visual whiteboard highlights."""
    try:
        response = handle_student_interruption(
            student_query=req.student_query,
            current_board_objects=req.current_board_objects,
            active_lesson_context=req.active_lesson_context,
            focused_objects=req.focused_objects,
            voice=req.voice,
        )
        return response
    except Exception as e:
        logger.exception("Failed to process student interruption: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/review")
def handle_student_review(req: ReviewApiRequest):
    """Evaluates student-drawn whiteboard solutions, speaking feedback and applying live corrections."""
    try:
        response = evaluate_student_work(
            student_work_summary=req.student_work_summary,
            all_board_objects=req.all_board_objects,
            lesson_context=req.lesson_context,
            voice=req.voice,
        )
        return response
    except Exception as e:
        logger.exception("Failed to evaluate student whiteboard work: %s", e)
        raise HTTPException(status_code=500, detail=str(e))




