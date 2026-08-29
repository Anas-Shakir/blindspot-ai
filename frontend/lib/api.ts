/**
 * frontend/lib/api.ts
 *
 * Fully typed fetch client for Blindspot AI backend (FastAPI).
 * Communicates with http://localhost:8000 (or NEXT_PUBLIC_API_URL).
 * Derived strictly from backend/schemas.py and backend/api/lectures.py.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

// ============================================================================
// Data Contracts & Schemas (mirroring backend/schemas.py)
// ============================================================================

export type LectureStatus = "processing" | "ready" | "failed";

export interface TimeRange {
  start: number;
  end: number;
}

export interface Lecture {
  id?: number;
  filename: string;
  audio_url?: string | null;
  status: LectureStatus;
  uploaded_at: string;
}

export interface TranscriptSegment {
  id?: number;
  lecture_id: number;
  start: number;
  end: number;
  text: string;
  speaker?: string | null;
  embedding?: number[] | null;
}

export interface Phase {
  order: number;
  title: string;
  teaching_script: string;
  source_timestamps: TimeRange[];
  prerequisite_note?: string | null;
  difficulty?: string | null;
}

export interface LearningPlan {
  id?: number;
  lecture_id: number;
  phases: Phase[];
}

export interface GapConcept {
  id?: number;
  lecture_id: number;
  name: string;
  why_its_a_gap: string;
  related_phase_order?: number | null;
  source_timestamp?: TimeRange | null;
}

export interface QuizItem {
  id?: number;
  lecture_id: number;
  question: string;
  options: string[];
  correct_answer: string;
  source_timestamp?: TimeRange | null;
}

export interface QuizSubmission {
  quiz_item_id: number;
  session_id: string;
  selected_answer: string;
}

export interface QuizResult {
  quiz_item_id: number;
  session_id: string;
  selected_answer: string;
  correct: boolean;
}

export interface GraphNode {
  id: string;
  lecture_id: number;
  label: string;
  is_gap: boolean;
  source_timestamp?: TimeRange | null;
}

export interface GraphEdge {
  lecture_id: number;
  source: string;
  target: string;
  relation: string;
}

export type SessionEventType =
  | "phase_started"
  | "speaking"
  | "awaiting_command"
  | "jumped_to_timestamp"
  | "quiz_started"
  | "session_ended";

export interface SessionEvent {
  type: SessionEventType;
  lecture_id: number;
  session_id: string;
  phase_order?: number | null;
  payload?: Record<string, unknown> | null;
  emitted_at: string;
}

export interface SessionCommand {
  session_id: string;
  command: "next" | "explain_again" | "show_me" | "quiz_me" | string;
  argument?: string | null;
}

export interface PipelineResult {
  lecture_id: number;
  plan: LearningPlan;
  gaps: GapConcept[];
  quizzes: QuizItem[];
  graph_nodes: GraphNode[];
  graph_edges: GraphEdge[];
  transcript_with_embeddings: TranscriptSegment[];
}

export interface HealthStatus {
  status: string;
}

// ============================================================================
// Custom API Error
// ============================================================================

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ============================================================================
// Core Fetch Wrapper
// ============================================================================

async function fetchJson<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    Accept: "application/json",
  };

  if (!(options.body instanceof FormData)) {
    (defaultHeaders as Record<string, string>)["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    let data: unknown = null;
    try {
      data = await response.json();
      if (data && typeof data === "object" && "detail" in data) {
        errorDetail = String((data as { detail: unknown }).detail);
      }
    } catch {
      // Non-JSON response
    }
    throw new ApiError(
      `API Error (${response.status}): ${errorDetail}`,
      response.status,
      data
    );
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// API Client Functions
// ============================================================================

/**
 * Upload an audio or video file to POST /api/lectures.
 * Returns immediately with status="processing".
 */
export async function uploadLecture(file: File): Promise<Lecture> {
  const formData = new FormData();
  formData.append("file", file);

  return fetchJson<Lecture>("/api/lectures", {
    method: "POST",
    body: formData,
  });
}

/**
 * Get all lectures from GET /api/lectures.
 */
export async function listLectures(): Promise<Lecture[]> {
  return fetchJson<Lecture[]>("/api/lectures", {
    method: "GET",
    cache: "no-store",
  });
}

/**
 * Get a single lecture by ID from GET /api/lectures/{id}.
 */
export async function getLecture(lectureId: number | string): Promise<Lecture> {
  return fetchJson<Lecture>(`/api/lectures/${lectureId}`, {
    method: "GET",
    cache: "no-store",
  });
}

/**
 * Get transcript segments for a lecture from GET /api/lectures/{id}/transcripts.
 */
export async function getTranscripts(
  lectureId: number | string
): Promise<TranscriptSegment[]> {
  return fetchJson<TranscriptSegment[]>(`/api/lectures/${lectureId}/transcripts`, {
    method: "GET",
    cache: "no-store",
  });
}

/**
 * Check backend health status from GET /health.
 */
export async function checkHealth(): Promise<HealthStatus> {
  return fetchJson<HealthStatus>("/health", {
    method: "GET",
  });
}

// ============================================================================
// Default Export Object
// ============================================================================

export const api = {
  uploadLecture,
  listLectures,
  getLecture,
  getTranscripts,
  checkHealth,
};

export default api;

