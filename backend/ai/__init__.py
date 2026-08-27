"""
backend/ai/__init__.py

Owner: Hashim (AI/Planning)

The AI capabilities package for Blindspot AI. This is where the offline
"compiler" pipeline lives — the code that turns a raw lecture transcript
into structured, sequenced, teachable content.

Modules:
    transcription.py — ASR wrapper (delegates to backend/transcription.py)
    _llm.py          — Shared LLM client adapter (Groq now, Qwen later)
    planning.py      — Learning plan, gap detection, quiz gen, embeddings
    graph.py         — Knowledge graph construction (NetworkX)

Per blueprint §8, every AI capability lives here as one file each, with
a small swappable core so the Alibaba migration later means editing one
file, not restructuring the package.
"""
