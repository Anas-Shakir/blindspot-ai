"""
backend/ai/orchestrator.py

Owner: Anas (AI Orchestrator & Team Lead)

The live interactive teaching session orchestrator for Blindspot AI.
This module implements the runtime dialogue state machine that manages live
student sessions over WebSocket, driving:

    1. Session lifecycle: initialize session, load LearningPlan, track current phase.
    2. Teaching delivery: emit phase_started, trigger TTS speak, emit speaking & awaiting_command.
    3. Command dispatching:
       - "next"           -> advance phase or trigger session_ended
       - "explain_again"  -> re-teach current phase
       - "show_me"        -> retrieve source timestamp receipts & emit jumped_to_timestamp
       - "quiz_me"        -> emit quiz_started, handle answers, grade
       - Free questions   -> answer student questions using current phase context
    4. Swappable TTS hook: seamlessly calls backend/ai/tts.py when available,
       with graceful fallback.

Conforms strictly to backend/schemas.py event shapes (SessionEvent, SessionCommand,
SessionEventType, LearningPlan, Phase, TimeRange).
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Callable, Dict, List, Optional

# Ensure project root is on sys.path for direct runs and package imports
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from backend.schemas import (
    LearningPlan,
    Phase,
    QuizItem,
    QuizResult,
    SessionCommand,
    SessionEvent,
    SessionEventType,
    TimeRange,
    TranscriptSegment,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# TTS Hook (Swappable Adapter)
# ---------------------------------------------------------------------------
# tts.py will be developed in a subsequent step. When tts.py is created,
# speak(text) will produce audio (e.g. an audio URL or path).
# Until then, or as a fallback, we provide a default mock/passthrough.

TTSCallable = Callable[[str], Optional[str]]


def _default_tts_speak(text: str) -> Optional[str]:
    """Default fallback TTS function if backend/ai/tts.py is not yet ready."""
    try:
        from backend.ai.tts import speak as external_speak
        return external_speak(text)
    except ImportError:
        logger.debug("backend.ai.tts not found; running in text-only mode.")
        return None
    except Exception as e:
        logger.warning("Error invoking TTS speak: %s", e)
        return None


_current_tts_engine: TTSCallable = _default_tts_speak


def set_tts_engine(engine: TTSCallable) -> None:
    """Allows setting or mocking the TTS engine for testing or custom voice models."""
    global _current_tts_engine
    _current_tts_engine = engine


# ---------------------------------------------------------------------------
# Optional LLM Hook for Free Q&A
# ---------------------------------------------------------------------------

def _answer_free_question(question: str, current_phase: Optional[Phase]) -> str:
    """Answers a student's question in the context of the current phase.

    Tries calling backend.ai._llm if available; falls back to a clear context answer.
    """
    context = ""
    if current_phase:
        context = (
            f"Current Topic: {current_phase.title}\n"
            f"Teaching Content: {current_phase.teaching_script}\n"
        )

    try:
        from backend.ai._llm import chat_completion
        messages = [
            {
                "role": "system",
                "content": (
                    "You are Blindspot AI, an empathetic and clear voice teaching assistant. "
                    "A student is listening to a lecture and paused to ask a question. "
                    "Answer concisely (2-3 sentences), strictly grounded in the current lesson context. "
                    f"\nContext:\n{context}"
                ),
            },
            {"role": "user", "content": question},
        ]
        return chat_completion(messages=messages, temperature=0.5)
    except Exception as e:
        logger.debug("LLM free Q&A fallback triggered: %s", e)
        if current_phase:
            return (
                f"Regarding {current_phase.title}: In this phase we focus on {current_phase.teaching_script[:120]}... "
                f"To answer '{question}': this connects directly to the core lecture points discussed here."
            )
        return f"Regarding your question '{question}': let's review the lecture material."


# ---------------------------------------------------------------------------
# TeachingSession State Machine
# ---------------------------------------------------------------------------

class TeachingSession:
    """Manages the dialogue state machine for a single live teaching session."""

    def __init__(
        self,
        session_id: str,
        lecture_id: int,
        plan: LearningPlan,
        quizzes: Optional[List[QuizItem]] = None,
        transcript_segments: Optional[List[TranscriptSegment]] = None,
    ) -> None:
        self.session_id = session_id
        self.lecture_id = lecture_id
        self.plan = plan
        self.quizzes: List[QuizItem] = quizzes or []
        self.transcript_segments: List[TranscriptSegment] = transcript_segments or []

        self.current_phase_index: int = 0
        self.is_ended: bool = False
        self.active_quiz_item: Optional[QuizItem] = None
        self.history: List[dict] = []

    @property
    def current_phase(self) -> Optional[Phase]:
        if 0 <= self.current_phase_index < len(self.plan.phases):
            return self.plan.phases[self.current_phase_index]
        return None

    def _emit(self, event_type: SessionEventType, payload: Optional[dict] = None) -> SessionEvent:
        """Helper to create and record a SessionEvent."""
        phase_order = self.current_phase.order if self.current_phase else None
        event = SessionEvent(
            type=event_type,
            lecture_id=self.lecture_id,
            session_id=self.session_id,
            phase_order=phase_order,
            payload=payload,
        )
        self.history.append({"type": "event", "event": event.model_dump()})
        return event

    def start(self) -> List[SessionEvent]:
        """Starts the session by teaching the first phase."""
        if not self.plan.phases:
            self.is_ended = True
            return [self._emit(SessionEventType.SESSION_ENDED, {"reason": "Plan has no phases"})]

        self.current_phase_index = 0
        self.is_ended = False
        return self._teach_current_phase()

    def _teach_current_phase(self) -> List[SessionEvent]:
        """Emits phase_started, invokes TTS to speak the phase script, and awaits command."""
        phase = self.current_phase
        if not phase:
            self.is_ended = True
            return [self._emit(SessionEventType.SESSION_ENDED)]

        events: List[SessionEvent] = []

        # 1. Emit phase_started
        phase_payload = {
            "title": phase.title,
            "order": phase.order,
            "prerequisite_note": phase.prerequisite_note,
            "source_timestamps": [t.model_dump() for t in phase.source_timestamps],
        }
        events.append(self._emit(SessionEventType.PHASE_STARTED, phase_payload))

        # 2. TTS synthesis & emit speaking
        audio_url = _current_tts_engine(phase.teaching_script)
        speaking_payload = {
            "text": phase.teaching_script,
            "audio_url": audio_url,
        }
        events.append(self._emit(SessionEventType.SPEAKING, speaking_payload))

        # 3. Emit awaiting_command
        events.append(self._emit(SessionEventType.AWAITING_COMMAND))

        return events

    def handle_command(self, cmd: SessionCommand) -> List[SessionEvent]:
        """Processes an incoming command from the student."""
        self.history.append({"type": "command", "command": cmd.model_dump()})

        if self.is_ended:
            return [self._emit(SessionEventType.SESSION_ENDED, {"message": "Session has already ended."})]

        raw_cmd = (cmd.command or "").strip().lower()

        # Handle answer submission if currently in an active quiz
        if self.active_quiz_item and raw_cmd in ("answer", "submit_answer"):
            selected = cmd.argument or ""
            return self.handle_quiz_answer(selected)

        # Standard command dispatch
        if raw_cmd == "next":
            return self.handle_next()
        elif raw_cmd in ("explain_again", "repeat", "explain again"):
            return self.handle_explain_again()
        elif raw_cmd in ("show_me", "show me", "receipt", "source", "show me where you learned that"):
            return self.handle_show_me(cmd.argument)
        elif raw_cmd in ("quiz_me", "quiz", "quiz me"):
            return self.handle_quiz_me()
        else:
            # Free question or unrecognized command
            return self.handle_question(cmd.command)

    def handle_next(self) -> List[SessionEvent]:
        """Advances to the next teaching phase, or ends the session if done."""
        self.active_quiz_item = None
        next_index = self.current_phase_index + 1

        if next_index < len(self.plan.phases):
            self.current_phase_index = next_index
            return self._teach_current_phase()
        else:
            self.is_ended = True
            return [self._emit(SessionEventType.SESSION_ENDED, {"message": "All phases completed."})]

    def handle_explain_again(self) -> List[SessionEvent]:
        """Re-teaches the current phase's script."""
        self.active_quiz_item = None
        phase = self.current_phase
        if not phase:
            return [self._emit(SessionEventType.SESSION_ENDED)]

        events: List[SessionEvent] = []
        audio_url = _current_tts_engine(phase.teaching_script)
        speaking_payload = {
            "text": phase.teaching_script,
            "audio_url": audio_url,
            "is_reexplanation": True,
        }
        events.append(self._emit(SessionEventType.SPEAKING, speaking_payload))
        events.append(self._emit(SessionEventType.AWAITING_COMMAND))
        return events

    def handle_show_me(self, topic: Optional[str] = None) -> List[SessionEvent]:
        """Finds the source timestamp in the original audio and emits jumped_to_timestamp."""
        phase = self.current_phase
        target_timestamp: Optional[TimeRange] = None

        # 1. If topic is provided and transcript segments exist, look for best match
        if topic and self.transcript_segments:
            topic_lower = topic.lower()
            for seg in self.transcript_segments:
                if topic_lower in seg.text.lower():
                    target_timestamp = TimeRange(start=seg.start, end=seg.end)
                    break

        # 2. Otherwise default to the current phase's source timestamps
        if not target_timestamp and phase and phase.source_timestamps:
            target_timestamp = phase.source_timestamps[0]

        # 3. Fallback timestamp if none found
        if not target_timestamp:
            target_timestamp = TimeRange(start=0.0, end=10.0)

        events: List[SessionEvent] = []
        events.append(
            self._emit(
                SessionEventType.JUMPED_TO_TIMESTAMP,
                {
                    "timestamp": target_timestamp.model_dump(),
                    "topic": topic or (phase.title if phase else None),
                },
            )
        )
        events.append(self._emit(SessionEventType.AWAITING_COMMAND))
        return events

    def handle_quiz_me(self) -> List[SessionEvent]:
        """Triggers a quiz item for the student."""
        quiz: Optional[QuizItem] = None

        if self.quizzes:
            quiz = self.quizzes[0]

        if not quiz:
            phase_title = self.current_phase.title if self.current_phase else "the lecture"
            quiz = QuizItem(
                id=1,
                lecture_id=self.lecture_id,
                question=f"What is the primary concept covered in {phase_title}?",
                options=[
                    f"Core principles of {phase_title}",
                    "Unrelated background history",
                    "A completely different topic",
                    "None of the above",
                ],
                correct_answer=f"Core principles of {phase_title}",
                source_timestamp=(
                    self.current_phase.source_timestamps[0]
                    if self.current_phase and self.current_phase.source_timestamps
                    else None
                ),
            )

        self.active_quiz_item = quiz

        events: List[SessionEvent] = []
        events.append(
            self._emit(
                SessionEventType.QUIZ_STARTED,
                {
                    "quiz_item_id": quiz.id,
                    "question": quiz.question,
                    "options": quiz.options,
                    "source_timestamp": quiz.source_timestamp.model_dump() if quiz.source_timestamp else None,
                },
            )
        )
        events.append(self._emit(SessionEventType.AWAITING_COMMAND, {"awaiting": "quiz_answer"}))
        return events

    def handle_quiz_answer(self, selected_answer: str) -> List[SessionEvent]:
        """Grades the student's quiz answer and resumes normal flow."""
        quiz = self.active_quiz_item
        if not quiz:
            return [self._emit(SessionEventType.AWAITING_COMMAND)]

        is_correct = selected_answer.strip().lower() == quiz.correct_answer.strip().lower()
        self.active_quiz_item = None

        result = QuizResult(
            quiz_item_id=quiz.id or 0,
            session_id=self.session_id,
            selected_answer=selected_answer,
            correct=is_correct,
        )

        feedback_text = (
            "That's correct! Great job."
            if is_correct
            else f"Not quite. The correct answer was: {quiz.correct_answer}."
        )

        audio_url = _current_tts_engine(feedback_text)

        events: List[SessionEvent] = []
        events.append(
            self._emit(
                SessionEventType.SPEAKING,
                {
                    "text": feedback_text,
                    "audio_url": audio_url,
                    "quiz_result": result.model_dump(),
                },
            )
        )
        events.append(self._emit(SessionEventType.AWAITING_COMMAND))
        return events

    def handle_question(self, question: str) -> List[SessionEvent]:
        """Answers a free-form student question using the current phase context."""
        answer_text = _answer_free_question(question, self.current_phase)
        audio_url = _current_tts_engine(answer_text)

        events: List[SessionEvent] = []
        events.append(
            self._emit(
                SessionEventType.SPEAKING,
                {
                    "text": answer_text,
                    "audio_url": audio_url,
                    "in_response_to": question,
                },
            )
        )
        events.append(self._emit(SessionEventType.AWAITING_COMMAND))
        return events


# ---------------------------------------------------------------------------
# In-Memory Session Store
# ---------------------------------------------------------------------------

class SessionStore:
    """Thread-safe in-memory session manager for live teaching sessions."""

    def __init__(self) -> None:
        self._sessions: Dict[str, TeachingSession] = {}

    def create_session(
        self,
        session_id: str,
        lecture_id: int,
        plan: LearningPlan,
        quizzes: Optional[List[QuizItem]] = None,
        transcript_segments: Optional[List[TranscriptSegment]] = None,
    ) -> TeachingSession:
        session = TeachingSession(
            session_id=session_id,
            lecture_id=lecture_id,
            plan=plan,
            quizzes=quizzes,
            transcript_segments=transcript_segments,
        )
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[TeachingSession]:
        return self._sessions.get(session_id)

    def remove_session(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)

    def list_sessions(self) -> List[str]:
        return list(self._sessions.keys())


# Global singleton store instance
session_store = SessionStore()
