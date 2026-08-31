"""
backend/ai/qa.py

Owner: Anas (AI Orchestrator & Team Lead)

Handles interactive student Q&A during a live teaching session.
Provides rich, comprehensible, and pedagogical explanations strictly grounded
in the current phase context, teaching scripts, and lecture transcripts.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import List, Optional

# Ensure project root is on sys.path
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from backend.ai._llm import chat_completion
from backend.schemas import Phase, TranscriptSegment

logger = logging.getLogger(__name__)

_QA_SYSTEM_PROMPT = """\
You are Blindspot AI, an empathetic, highly knowledgeable, and engaging voice teaching tutor.
A student is currently learning from a recorded lecture and has paused during a specific teaching phase to ask you a question.

Your goal is to provide a comprehensive, clear, and easy-to-understand explanation that directly answers the student's question.

Guidelines:
1. Ground your answer in the current lesson topic and lecture content provided in the context.
2. Structure your explanation clearly:
   - Provide a direct, intuitive answer.
   - Explain the underlying mechanism or logic step by step.
   - Use a clear real-world analogy or concrete example to make the concept stick.
3. Tone and Delivery:
   - Use a warm, encouraging, conversational tone that sounds natural when spoken aloud.
   - Avoid Markdown headers (#, ##), bullet asterisks (*, -), or robotic prefixes like "Regarding your question". Speak directly to the student as their personal tutor.
4. Keep the explanation thorough and satisfying (typically 3 to 5 clear sentences).
"""


def answer_phase_question(
    question: str,
    current_phase: Optional[Phase] = None,
    transcript_segments: Optional[List[TranscriptSegment]] = None,
) -> str:
    """Generates a comprehensive pedagogical answer to a student's question
    grounded in the active phase and lecture transcript.
    """
    clean_question = (question or "").strip()
    if not clean_question:
        return "Feel free to ask any question about this phase of the lecture!"

    # Build context from current phase and relevant transcript slices
    context_sections: List[str] = []

    if current_phase:
        context_sections.append(f"Current Lesson Phase: {current_phase.title}")
        context_sections.append(f"Teaching Content:\n{current_phase.teaching_script}")
        if current_phase.prerequisite_note:
            context_sections.append(f"Prerequisites: {current_phase.prerequisite_note}")

    if transcript_segments and current_phase and current_phase.source_timestamps:
        # Include relevant transcript snippets from the source time range
        relevant_chunks: List[str] = []
        for ts_range in current_phase.source_timestamps:
            for seg in transcript_segments:
                if seg.start >= (ts_range.start - 10) and seg.end <= (ts_range.end + 10):
                    relevant_chunks.append(seg.text)
        if relevant_chunks:
            context_sections.append(f"Relevant Lecture Excerpt:\n{' '.join(relevant_chunks[:6])}")

    context_str = "\n\n".join(context_sections)

    user_prompt = f"""\
Context from the Lecture:
{context_str}

Student Question:
"{clean_question}"

Please provide a clear, comprehensive, and friendly explanation answering the student's question.
"""

    try:
        response = chat_completion(
            system_prompt=_QA_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.6,
            max_tokens=2048,
        )
        if isinstance(response, str) and response.strip():
            return response.strip()
    except Exception as e:
        logger.warning("LLM call in qa.py encountered an issue: %s", e)

    # Clean fallback if LLM is unavailable
    if current_phase:
        return (
            f"In this part of the lecture on {current_phase.title}, the main idea is that "
            f"{current_phase.teaching_script.rstrip('.')}. When thinking about your question, "
            f"remember that this principle connects directly to the core mechanisms we are studying here."
        )

    return "Let's explore that topic! In this lecture, we focus on understanding how these concepts connect together step by step."
