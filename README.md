<div align="center">

# 🧠 Blindspot AI

### Discover the gaps. Understand the whole picture.

**An AI-powered learning companion that turns passive lectures into interactive, personalized, source-grounded learning experiences.**

[![Status](https://img.shields.io/badge/status-in%20development-orange)]()
[![Category](https://img.shields.io/badge/category-AI%20%2B%20EdTech-blueviolet)]()
[![Frontend](https://img.shields.io/badge/frontend-Next.js%20%7C%20React-black)]()
[![Backend](https://img.shields.io/badge/backend-Python%20%7C%20FastAPI-009688)]()
[![Database](https://img.shields.io/badge/database-PostgreSQL%20%7C%20pgvector-336791)]()
[![License](https://img.shields.io/badge/license-TBD-lightgrey)]()

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [Why "Blindspot"?](#-why-blindspot)
- [Key Features](#-key-features)
- [How It Works — User Journey](#-how-it-works--user-journey)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Core Design Principles](#-core-design-principles)
- [Roadmap](#-roadmap)
- [Vision](#-vision)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Blindspot AI is an AI-powered learning companion that transforms passive educational content into an active, interactive, and personalized learning experience.**

It started from a simple observation:

> **Having access to a lecture is not the same as understanding it.**

Rather than just transcribing, summarizing, or chatting about a lecture, Blindspot AI:

1. Understands the original educational content
2. Identifies the concepts and structure within it
3. Detects **blind spots** — concepts mentioned but not fully explained
4. Generates a structured, phase-by-phase learning plan
5. Teaches the student interactively, using text, voice, and visuals
6. Lets the student trace any explanation back to its exact source
7. Generates quizzes, notes, and concept maps for review
8. Extends learning beyond the app through channels like **WhatsApp**

> **Educational content should not remain a static recording. It should become an interactive learning system.**

---

## ❗ The Problem

**Passive content.** Lectures are linear. If a student misses something at minute 23, their only options are to rewind, search manually, look it up elsewhere, or move on without understanding it.

**One-size-fits-all teaching.** A lecture is built for a classroom, not an individual — but students differ in pace, prior knowledge, and the specific concepts they struggle with.

**The trust problem with generic AI.** A general-purpose AI assistant can explain almost anything — but not necessarily *the way your course taught it*. Students need to know: was this what my instructor actually said, or something the AI inferred?

**Hidden gaps.** The most important problem often isn't missing information — it's *fragmented* information: a term mentioned but never defined, a formula given without derivation, a prerequisite silently assumed.

These fragments are the **blind spots** Blindspot AI is built to surface.

---

## ✅ The Solution

Blindspot AI turns a single piece of educational content into a multi-layered learning experience:

```text
Educational Content
        ↓
Understanding & Processing
        ↓
Transcript / Knowledge Representation
        ↓
Concept & Learning Analysis
        ↓
Structured Learning Plan
        ↓
Interactive AI Teaching
        ↓
Voice + Visual + Conversational Interaction
        ↓
Verification, Practice & Review
```

### Core differentiator: "Teaching With Receipts"

Every AI explanation stays traceable back to its origin:

```text
Original Source
      ↓
Transcript Segment + Timestamp
      ↓
Learning Plan / Concept
      ↓
AI Explanation
      ↓
Student Interaction
```

> **Your educational content, taught interactively — with traceability.**

This is what separates Blindspot AI from a transcription tool, a summarizer, or a generic chatbot.

---

## 🕳️ Why "Blindspot"?

A lecture can contain blind spots: concepts mentioned but never fully explained, prerequisites the instructor assumed you already knew, skipped steps, unclear relationships between ideas, and moments where understanding quietly breaks down with no way to recover it in the moment.

Blindspot AI treats a lecture not just as text to summarize, but as a body of knowledge to be **analyzed, structured, verified, and transformed** into a better learning experience — surfacing exactly where the gaps are and helping students close them.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎓 **Interactive AI Teaching** | The AI teaches phase-by-phase rather than dumping a summary, responding to controls like *Next*, *Explain again*, *Quiz me*, and *Ask a question*. |
| 🔍 **Source Traceability** | Ask *"Where did you learn that?"* and jump straight to the exact transcript segment and timestamp in the original lecture. |
| 🕵️ **Blind Spot Detection** | Identifies concepts that were mentioned but under-explained, and surfaces missing prerequisites. |
| 🎙️ **Voice-Based Learning** | Speak to the assistant and get spoken explanations back, via a speech-to-text → AI processing → text-to-speech pipeline. |
| 🖊️ **Interactive AI Whiteboard** | A shared canvas where the AI draws structured, editable diagrams (not static images) in sync with its explanation — and the student can draw, point, and ask questions back. |
| 🕸️ **Knowledge Graph** | Visualizes how concepts relate to each other and where prerequisite knowledge may be missing. |
| 📝 **Quizzes & Practice** | Generates MCQs (and eventually richer question types) grounded in the actual lecture content. |
| 🗒️ **Notes & Review** | Auto-generated phase summaries, key concepts, definitions, and source references. |
| 💬 **Multi-Channel Access** | Extends learning beyond the web app to conversational platforms like **WhatsApp**, for text and voice follow-up on the go. |

---

## 🚶 How It Works — User Journey

1. **Content is added** — a recorded lecture or other educational content enters the system.
2. **Content is processed** — transcription, timestamps, and segmentation are generated.
3. **A knowledge representation is built** — the transcript is chunked and embedded for semantic search.
4. **A learning plan is generated** — the AI reorganizes the raw content into logical teaching phases, each with an objective, script, source references, and prerequisites.
5. **AI teaching begins** — the student moves through phases interactively.
6. **Visual teaching kicks in** — for concepts that benefit from it, the AI draws on the whiteboard as it explains.
7. **The student interacts** — asking questions, using voice, pointing at objects, annotating the board.
8. **Source verification** — any explanation can be traced back to where it was actually taught.
9. **Practice & review** — quizzes, notes, and concept relationships reinforce what was learned.

---

## 🏗️ Architecture

```text
                        ┌─────────────────────┐
                        │      STUDENT        │
                        └──────────┬──────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
         Web Application       Voice Input          WhatsApp
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   ▼
                         ┌───────────────────┐
                         │   API / Backend   │
                         └─────────┬─────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 │                 │                 │
                 ▼                 ▼                 ▼
             Storage            Database         WebSockets
                 │                 │                 │
                 └─────────────────┼─────────────────┘
                                   ▼
                         ┌───────────────────┐
                         │  AI SYSTEM LAYER  │
                         └─────────┬─────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
    Transcription            AI Planning              Orchestrator
          │                        │                        │
          ▼                        ▼                        ▼
    Transcript + Time       Learning Plan          Interactive Session
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   ▼
                      ┌────────────────────────┐
                      │ Supporting AI Services │
                      ├────────────────────────┤
                      │ Embeddings             │
                      │ Search                 │
                      │ Knowledge Graph        │
                      │ TTS                    │
                      │ STT                    │
                      │ Whiteboard Commands    │
                      └────────────────────────┘
```

The system is split into two intelligence layers:

- **Offline / Preparation Intelligence** — transcription, segmentation, embeddings, concept identification, learning plan generation, gap detection, quiz and note generation. This runs once per piece of content, not on every interaction.
- **Runtime / Interactive Intelligence** — the AI Orchestrator that manages live session state, the current phase, student commands, question answering, TTS triggers, source search, and whiteboard updates.

---

## 🛠️ Tech Stack

> The stack below reflects the project's current technical direction and may evolve.

**Frontend**
- Next.js
- React
- Tailwind CSS

**Backend**
- Python
- FastAPI
- WebSockets (for real-time session events)

**Database**
- PostgreSQL (via Supabase)
- `pgvector` for embedding-based semantic search

**Storage**
- Object storage abstraction (MinIO / local for development, cloud object storage such as Alibaba Cloud OSS or R2-style storage in production) — the app stores media *references*, not vendor-specific paths

**AI / Model Strategy**
- Provider-agnostic AI interface (Groq API, Llama 3.1 8B Instant, Llama 3.3 70B Versatile, Qwen-family models, and other providers evaluated) so the underlying model can change without touching application logic

**Speech**
- Speech-to-Text: faster-whisper / Whisper-based systems
- Text-to-Speech: open-source and cloud TTS options, including Qwen/Alibaba-related voice technologies

**Interactive Whiteboard**
- Structured canvas frameworks under evaluation: tldraw, Excalidraw, React Flow, Fabric.js
- Yjs for real-time collaborative sync
- WebSockets for live whiteboard events

**Messaging**
- WhatsApp Business integration via **Zernio** as the connection layer

---

## 📁 Project Structure

```text
blindspot-ai/
├── frontend/
│   ├── app/
│   ├── components/
│   └── lib/
│
├── backend/
│   ├── api/
│   ├── models.py
│   ├── db.py
│   ├── storage.py
│   ├── schemas.py
│   └── ai/
│       ├── transcription.py
│       ├── planning.py
│       ├── graph.py
│       ├── orchestrator.py
│       └── tts.py
│
├── infra/
│   ├── docker-compose.yml
│   └── environment configuration
│
├── docs/
│
└── README.md
```

> Shared schemas and stable interfaces (transcript segments, learning phases, quiz items, graph nodes/edges, whiteboard objects) are treated as a contract between frontend, backend, and the AI layer, since multiple components are developed in parallel.

---

## 🧩 Core Design Principles

The single most important architectural rule behind Blindspot AI:

> **AI decides *what* should happen.**
> **Structured instructions define *how* it should happen.**
> **Deterministic systems execute and render it.**

In practice:
- The LLM decides what to teach, what to draw, and what to highlight — never raw pixels or animation.
- The frontend/renderer handles all animation, layout, and canvas execution from structured, validated commands.
- Every visual object and teaching step carries an ID that links back to its source, keeping the system debuggable, replayable, and traceable.

This separation keeps the product scalable, easier to debug, adaptable to new models or interfaces, and resilient to changes in any single provider.

---

## 🗺️ Roadmap

- [ ] **Phase 1 — Core Learning System**
  Content processing, timestamped transcripts, learning plans, AI teaching, source verification, quizzes.
- [ ] **Phase 2 — Enhanced Learning Intelligence**
  Knowledge graphs, learning gap detection, notes, richer contextual Q&A, stronger personalization.
- [ ] **Phase 3 — Interactive Visual Teacher**
  AI-driven whiteboard teaching, synchronized voice + drawing, object-based interaction, student annotations.
- [ ] **Phase 4 — Multi-Channel Learning**
  WhatsApp text and voice interaction, educational follow-up outside the web app.
- [ ] **Phase 5 — Advanced Personalization**
  Adaptive learning paths, student-specific memory, multilingual teaching, cross-course knowledge bases, real-time conversational experiences.

---

## 🌍 Vision

> **Blindspot AI turns educational content into an intelligent, interactive learning companion that helps students discover and overcome the blind spots between being taught and truly understanding.**

Students today have access to enormous amounts of content but few mechanisms for turning that content into real understanding. Blindspot AI aims to close the gap between:

```text
"I have the lecture."          →          "I actually understand the lecture."
```

It's built for university students, self-learners, online course takers, educators, and institutions looking to get more value out of the content they already have — not as another chatbot or lecture summarizer, but as a **learning intelligence system** that sits between raw content and real understanding.

---

## 🤝 Contributing

Contributions, ideas, and feedback are welcome. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a pull request describing what you changed and why

Please open an issue first for larger changes so we can align on direction.

---

## 📄 License

*License to be determined — add your chosen license here (e.g., MIT, Apache 2.0) before publishing.*

---

<div align="center">

**Blindspot AI — Discover the gaps. Understand the whole picture.**

</div>
