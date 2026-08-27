"""
backend/ai/planning.py

Owner: Hashim (AI/Planning)

The core offline "compiler" pipeline for Blindspot AI. This module turns
a raw lecture transcript (list of timestamped TranscriptSegments) into
structured, sequenced, teachable content:

    1. generate_plan()      — Transcript → ordered LearningPlan with phases
    2. detect_gaps()        — Identify concepts mentioned but under-explained
    3. generate_quizzes()   — Produce MCQ quiz bank from transcript + plan
    4. generate_embeddings() — Compute vector embeddings for transcript chunks
    5. run_full_pipeline()  — Orchestrates all four steps + graph construction

Each function follows the adapter pattern from blueprint §7.3: stable
signatures, output normalized into backend/schemas.py shapes before
anything downstream touches it. The LLM provider is accessed exclusively
through backend/ai/_llm.py, so swapping from Groq to Qwen later is a
config change, not a code change.

Prompt design notes:
    - System prompts are deliberately detailed — LLMs produce much better
      structured output when the expected JSON schema is spelled out.
    - Temperature is kept low (0.3) for deterministic extraction tasks.
    - Each function uses an internal Pydantic model (_LLM*Response) to
      parse and validate the LLM's JSON, then converts to schemas.py shapes.

Requires: openai, sentence-transformers, pydantic >= 2
    pip install openai sentence-transformers pydantic
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field

# Ensure project root is on sys.path for direct-run and package imports.
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from backend.ai._llm import chat_completion
from backend.schemas import (
    GapConcept,
    LearningPlan,
    Phase,
    PipelineResult,
    QuizItem,
    TimeRange,
    TranscriptSegment,
)

# ---------------------------------------------------------------------------
# Internal LLM response models (not part of the public API — these exist
# solely to parse and validate the LLM's JSON output before we convert to
# the canonical schemas.py shapes)
# ---------------------------------------------------------------------------


class _LLMTimeRange(BaseModel):
    start: float
    end: float


class _LLMPhase(BaseModel):
    order: int
    title: str
    teaching_script: str
    source_timestamps: list[_LLMTimeRange] = Field(default_factory=list)
    prerequisite_note: Optional[str] = None
    difficulty: Optional[str] = None


class _LLMPlanResponse(BaseModel):
    phases: list[_LLMPhase]


class _LLMGap(BaseModel):
    name: str
    why_its_a_gap: str
    related_phase_order: Optional[int] = None
    source_timestamp: Optional[_LLMTimeRange] = None


class _LLMGapResponse(BaseModel):
    gaps: list[_LLMGap]


class _LLMQuiz(BaseModel):
    question: str
    options: list[str]
    correct_answer: str
    source_timestamp: Optional[_LLMTimeRange] = None


class _LLMQuizResponse(BaseModel):
    questions: list[_LLMQuiz]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _format_transcript(segments: list[TranscriptSegment]) -> str:
    """Formats transcript segments into a timestamped text block for the LLM.

    Each segment becomes a line like:
        [12.5s - 18.3s] The professor explains the concept of...

    This gives the LLM enough context to both understand the content and
    reference specific timestamps when building the plan.
    """
    lines = []
    for seg in segments:
        lines.append(f"[{seg.start:.1f}s - {seg.end:.1f}s] {seg.text}")
    return "\n".join(lines)


def _format_plan_summary(plan: LearningPlan) -> str:
    """Creates a concise summary of a learning plan for use as LLM context."""
    lines = []
    for phase in plan.phases:
        ts_ranges = ", ".join(
            f"{t.start:.1f}s-{t.end:.1f}s" for t in phase.source_timestamps
        )
        lines.append(f"Phase {phase.order}: {phase.title} [{ts_ranges}]")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# 1. Learning Plan Generation
# ---------------------------------------------------------------------------

_PLAN_SYSTEM_PROMPT = """\
You are an expert instructional designer. Your task is to take a raw lecture
transcript (with timestamps) and produce a structured Learning Plan — an
ordered sequence of teaching phases that re-organizes the lecture content
into a pedagogically sound lesson.

Key principles:
- Re-sequence content for teachability, NOT just chronologically. Group
  related concepts together even if they were scattered in the lecture.
- Each phase should cover ONE clear concept or topic — small enough to
  teach in 2-5 minutes.
- The teaching_script is what a voice AI agent will actually SAY to the
  student. Write it in clear, conversational English — like a good TA
  explaining during office hours, not a textbook.
- source_timestamps MUST reference actual timestamps from the transcript
  that relate to this phase's content. These are used for the "show me
  where you learned that" feature — accuracy matters.
- prerequisite_note should mention what the student needs to already know
  for this phase to make sense. Leave null if nothing special is needed.
- difficulty should be one of: "beginner", "intermediate", "advanced".

Respond with a JSON object in this exact shape:
{
  "phases": [
    {
      "order": 0,
      "title": "short descriptive title",
      "teaching_script": "what the voice agent says, 2-4 sentences",
      "source_timestamps": [{"start": 12.5, "end": 45.0}],
      "prerequisite_note": "null or a short note",
      "difficulty": "beginner"
    }
  ]
}
"""


def generate_plan(
    transcript: list[TranscriptSegment],
    lecture_id: int = 0,
) -> LearningPlan:
    """Generates a Learning Plan from a lecture transcript.

    The LLM analyzes the transcript and produces an ordered sequence of
    teaching phases — re-sequenced for pedagogical clarity, not just
    chronological order. Each phase includes a teaching script (what the
    voice agent says), source timestamps (for "show me where you learned
    that"), and prerequisite/difficulty notes.

    Args:
        transcript: Timestamped transcript segments from transcription.py.
        lecture_id: The lecture this plan belongs to.

    Returns:
        A LearningPlan with ordered Phase objects, all normalized into
        schemas.py shapes.
    """
    formatted = _format_transcript(transcript)

    user_prompt = (
        f"Below is the full transcript of a lecture with timestamps. "
        f"Analyze it and produce a Learning Plan.\n\n"
        f"TRANSCRIPT:\n{formatted}"
    )

    llm_response = chat_completion(
        system_prompt=_PLAN_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.3,
        max_tokens=4096,
        response_model=_LLMPlanResponse,
    )

    # Convert internal LLM response to canonical schemas.py shapes
    phases = [
        Phase(
            order=p.order,
            title=p.title,
            teaching_script=p.teaching_script,
            source_timestamps=[
                TimeRange(start=t.start, end=t.end) for t in p.source_timestamps
            ],
            prerequisite_note=p.prerequisite_note,
            difficulty=p.difficulty,
        )
        for p in llm_response.phases
    ]

    return LearningPlan(lecture_id=lecture_id, phases=phases)


# ---------------------------------------------------------------------------
# 2. Gap Detection
# ---------------------------------------------------------------------------

_GAP_SYSTEM_PROMPT = """\
You are an expert at identifying explanatory gaps in educational content.
Your task is to find concepts that a lecture mentions but does NOT adequately
explain — the "blind spots" a student would be confused about after listening.

A gap is:
- A concept, term, or idea that appears in the transcript but is never
  properly defined or explained.
- A step in reasoning that the speaker skips over, assuming the audience
  already knows it.
- A prerequisite concept that's referenced but not taught.

A gap is NOT:
- Something the lecture explains well (even briefly).
- A tangential topic that isn't relevant to the lecture's subject matter.
- Something so basic that any student in the course would know it.

For each gap, identify which phase of the learning plan it relates to
(if any), and the timestamp range in the transcript where it's first
mentioned.

Respond with a JSON object in this exact shape:
{
  "gaps": [
    {
      "name": "concept name",
      "why_its_a_gap": "one sentence on what's missing or under-explained",
      "related_phase_order": 0,
      "source_timestamp": {"start": 12.5, "end": 18.3}
    }
  ]
}

If there are no meaningful gaps, return {"gaps": []}.
"""


def detect_gaps(
    transcript: list[TranscriptSegment],
    plan: LearningPlan,
    lecture_id: int = 0,
) -> list[GapConcept]:
    """Identifies concepts the lecture mentions but doesn't fully explain.

    These are the literal "blind spots" the product is named after. Each
    gap is linked to a phase in the learning plan (where relevant) and
    to the timestamp in the transcript where the concept first appears.

    Gap concepts seed the knowledge graph — they become nodes marked with
    is_gap=True in graph.py.

    Args:
        transcript: The lecture transcript with timestamps.
        plan: The learning plan generated by generate_plan().
        lecture_id: The lecture this belongs to.

    Returns:
        A list of GapConcept objects per schemas.py.
    """
    formatted_transcript = _format_transcript(transcript)
    formatted_plan = _format_plan_summary(plan)

    user_prompt = (
        f"Below is the lecture transcript and the learning plan derived "
        f"from it. Identify concepts that are mentioned but NOT adequately "
        f"explained.\n\n"
        f"TRANSCRIPT:\n{formatted_transcript}\n\n"
        f"LEARNING PLAN:\n{formatted_plan}"
    )

    llm_response = chat_completion(
        system_prompt=_GAP_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.3,
        max_tokens=2048,
        response_model=_LLMGapResponse,
    )

    return [
        GapConcept(
            lecture_id=lecture_id,
            name=g.name,
            why_its_a_gap=g.why_its_a_gap,
            related_phase_order=g.related_phase_order,
            source_timestamp=(
                TimeRange(start=g.source_timestamp.start, end=g.source_timestamp.end)
                if g.source_timestamp else None
            ),
        )
        for g in llm_response.gaps
    ]


# ---------------------------------------------------------------------------
# 3. Quiz Generation
# ---------------------------------------------------------------------------

_QUIZ_SYSTEM_PROMPT = """\
You are an expert at creating educational assessment questions. Your task
is to generate multiple-choice questions (MCQs) from a lecture transcript
and its learning plan.

Rules:
- Each question must be answerable from the lecture content — no outside
  knowledge required.
- Each question must have exactly 4 options, with exactly 1 correct answer.
- The correct_answer field must be an EXACT copy of one of the options
  (character-for-character match).
- source_timestamp should point to the part of the transcript where the
  answer can be verified — this is used for the "show me where" feature.
- Aim for 3-5 questions per phase of the learning plan.
- Mix difficulty levels: some recall questions, some comprehension questions.
- Questions should test understanding of the concept, not just memorization
  of a specific phrase.

Respond with a JSON object in this exact shape:
{
  "questions": [
    {
      "question": "What is the primary purpose of...?",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": "Option B",
      "source_timestamp": {"start": 45.0, "end": 62.5}
    }
  ]
}
"""


def generate_quizzes(
    transcript: list[TranscriptSegment],
    plan: LearningPlan,
    lecture_id: int = 0,
) -> list[QuizItem]:
    """Generates MCQ quiz questions from the transcript and learning plan.

    Questions are derived from the lecture content and aligned with the
    plan's phases. Each question includes the source timestamp where the
    answer can be verified in the original recording.

    Args:
        transcript: The lecture transcript with timestamps.
        plan: The learning plan generated by generate_plan().
        lecture_id: The lecture this belongs to.

    Returns:
        A list of QuizItem objects per schemas.py.
    """
    formatted_transcript = _format_transcript(transcript)
    formatted_plan = _format_plan_summary(plan)

    user_prompt = (
        f"Below is the lecture transcript and its learning plan. Generate "
        f"multiple-choice quiz questions.\n\n"
        f"TRANSCRIPT:\n{formatted_transcript}\n\n"
        f"LEARNING PLAN:\n{formatted_plan}"
    )

    llm_response = chat_completion(
        system_prompt=_QUIZ_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.4,
        max_tokens=4096,
        response_model=_LLMQuizResponse,
    )

    return [
        QuizItem(
            lecture_id=lecture_id,
            question=q.question,
            options=q.options,
            correct_answer=q.correct_answer,
            source_timestamp=(
                TimeRange(start=q.source_timestamp.start, end=q.source_timestamp.end)
                if q.source_timestamp else None
            ),
        )
        for q in llm_response.questions
    ]


# ---------------------------------------------------------------------------
# 4. Embedding Generation
# ---------------------------------------------------------------------------

# Model loaded once per process, not per call — model loading is expensive.
# all-MiniLM-L6-v2 is 384-dimensional, fast, and good enough for hackathon
# data volumes. Swap to Alibaba text-embedding-v3 later via the same pattern.
_EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
_embedding_model = None


def _get_embedding_model():
    """Returns a process-cached SentenceTransformer model."""
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer(_EMBEDDING_MODEL_NAME)
    return _embedding_model


def generate_embeddings(
    segments: list[TranscriptSegment],
) -> list[TranscriptSegment]:
    """Computes vector embeddings for each transcript segment's text.

    Uses sentence-transformers (all-MiniLM-L6-v2, 384-dim) locally. The
    embeddings power:
    - "Show me where you learned that" — vector similarity search over
      transcript chunks to find the closest timestamp.
    - Gap detection — comparing concept embeddings against transcript
      coverage to find under-explained areas.

    Args:
        segments: Transcript segments (from transcription.py). Their
            `embedding` field will be populated on the returned copies.

    Returns:
        New TranscriptSegment objects with `embedding` fields populated.
        The original segments are not modified.
    """
    model = _get_embedding_model()
    texts = [seg.text for seg in segments]

    # encode() returns numpy arrays; convert to plain lists for JSON/DB storage
    vectors = model.encode(texts, show_progress_bar=False)

    enriched = []
    for seg, vec in zip(segments, vectors):
        enriched.append(
            TranscriptSegment(
                id=seg.id,
                lecture_id=seg.lecture_id,
                start=seg.start,
                end=seg.end,
                text=seg.text,
                speaker=seg.speaker,
                embedding=vec.tolist(),
            )
        )

    return enriched


# ---------------------------------------------------------------------------
# 5. Full Pipeline Orchestrator
# ---------------------------------------------------------------------------

def run_full_pipeline(
    transcript: list[TranscriptSegment],
    lecture_id: int = 0,
) -> PipelineResult:
    """Runs the complete AI/Planning offline pipeline on a lecture transcript.

    This is the single entry point the background job (and test scripts)
    call. It orchestrates all four pipeline stages in sequence, plus
    knowledge graph construction:

        1. generate_plan()       → LearningPlan (phases + teaching scripts)
        2. detect_gaps()         → GapConcepts (under-explained concepts)
        3. generate_quizzes()    → QuizItems (MCQ bank)
        4. generate_embeddings() → transcript segments with vector embeddings
        5. build_graph()         → GraphNodes + GraphEdges (knowledge graph)

    Args:
        transcript: Timestamped transcript segments from transcription.py.
        lecture_id: The lecture ID to stamp on all output objects.

    Returns:
        A PipelineResult containing the plan, gaps, quizzes, graph data,
        and transcript with embeddings — everything the AI Orchestrator
        needs at runtime.
    """
    print("[pipeline] Step 1/5: Generating learning plan...")
    plan = generate_plan(transcript, lecture_id=lecture_id)
    print(f"[pipeline]   -> {len(plan.phases)} phases generated")

    print("[pipeline] Step 2/5: Detecting explanatory gaps...")
    gaps = detect_gaps(transcript, plan, lecture_id=lecture_id)
    print(f"[pipeline]   -> {len(gaps)} gaps detected")

    print("[pipeline] Step 3/5: Generating quiz bank...")
    quizzes = generate_quizzes(transcript, plan, lecture_id=lecture_id)
    print(f"[pipeline]   -> {len(quizzes)} quiz questions generated")

    print("[pipeline] Step 4/5: Computing transcript embeddings...")
    enriched_transcript = generate_embeddings(transcript)
    print(f"[pipeline]   -> {len(enriched_transcript)} segments embedded")

    print("[pipeline] Step 5/5: Building knowledge graph...")
    from backend.ai.graph import build_graph
    graph_nodes, graph_edges = build_graph(gaps, plan, transcript, lecture_id=lecture_id)
    print(f"[pipeline]   -> {len(graph_nodes)} nodes, {len(graph_edges)} edges")

    return PipelineResult(
        lecture_id=lecture_id,
        plan=plan,
        gaps=gaps,
        quizzes=quizzes,
        graph_nodes=graph_nodes,
        graph_edges=graph_edges,
        transcript_with_embeddings=enriched_transcript,
    )
