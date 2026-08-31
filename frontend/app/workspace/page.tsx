"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  RotateCcw,
  Zap,
  Search,
  ArrowRight,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Volume2,
  VolumeX,
  Loader2,
  Sparkles,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  api,
  Lecture,
  LearningPlan,
  QuizItem,
  TranscriptSegment,
  SessionEvent,
  VoiceOption,
} from "@/lib/api";
import RobotCompanionWrapper from "@/components/RobotCompanionWrapper";
import QuizCard, { QuizOption } from "@/components/QuizCard";
import Sidebar from "@/components/Sidebar";

interface PhaseData {
  id: number;
  title: string;
  subtitle: string;
  timestamp: string;
  duration: string;
  durationSec: number;
  mentalModels: {
    number: string;
    title: string;
    description: string;
  }[];
  speechText: string;
  alternativeSpeechText: string;
  transcriptQuote: string;
  speaker: string;
  quiz: {
    question: string;
    options: QuizOption[];
    correctId: string;
    explanation: string;
  };
}

const defaultMockPhases: PhaseData[] = [
  {
    id: 1,
    title: "1. Foundations of Supply & Demand",
    subtitle: "Core mechanisms governing dynamic market clearance and price signals.",
    timestamp: "03:12",
    duration: "04:15",
    durationSec: 255,
    mentalModels: [
      {
        number: "01",
        title: "Equilibrium as dynamic price clearance",
        description:
          "Market forces constantly reconcile bid-ask differentials without central coordination. The intersection point clears inventory without systematic surplus or shortage.",
      },
      {
        number: "02",
        title: "Consumer surplus geometry",
        description:
          "The area under the demand curve and above the market price reflects net aggregate economic welfare gained by consumers who value the good above the clearing price.",
      },
      {
        number: "03",
        title: "Adjustment friction and latency",
        description:
          "Price signals do not clear physical supply chains instantaneously; inventory buffers and capacity constraints absorb short-term demand fluctuations.",
      },
    ],
    speechText:
      "Market equilibrium is an informational mechanism: price changes coordinate decentralized buyers and sellers without centralized control.",
    alternativeSpeechText:
      "Think of a farmers market: if apples are priced too high, inventory remains unsold. If set too low, lines form immediately until prices rise.",
    transcriptQuote:
      "When we look at market equilibrium, understand that it is not a static point—it is a continuous, self-correcting feedback mechanism driven by marginal consumer utility.",
    speaker: "Prof. Sterling",
    quiz: {
      question:
        "What occurs in a competitive market when the prevailing price is held strictly below the market-clearing equilibrium level?",
      options: [
        { id: "a", text: "Quantity demanded exceeds quantity supplied, resulting in an immediate shortage." },
        { id: "b", text: "Quantity supplied exceeds quantity demanded, creating a persistent inventory surplus." },
        { id: "c", text: "Aggregate consumer surplus drops to zero immediately." },
        { id: "d", text: "Supplier production capacity automatically expands to clear the market." },
      ],
      correctId: "a",
      explanation:
        "When prices are below equilibrium, lower prices incentivize greater consumer demand while disincentivizing supplier production, generating an acute supply shortage.",
    },
  },
];

export default function WorkspacePage() {
  const params = useParams();
  const lectureId = params?.id ? String(params.id) : null;
  const [lecture, setLecture] = useState<Lecture | null>(null);

  // Live session state
  const [sessionId] = useState<string>(() => `sess_${Math.random().toString(36).substring(2, 10)}`);
  const [phasesList, setPhasesList] = useState<PhaseData[]>(defaultMockPhases);
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);

  // UI modes
  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isAlternativeView, setIsAlternativeView] = useState<boolean>(false);
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playbackSeconds, setPlaybackSeconds] = useState<number>(0);

  // Audio elements & speech text
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [activeSpeechText, setActiveSpeechText] = useState<string>("");

  // Text Language Options Catalog
  const TEXT_LANGUAGES = [
    { id: "English", name: "English", flag: "🌐" },
    { id: "Urdu", name: "Urdu (اردو)", flag: "🇵🇰" },
    { id: "Spanish", name: "Spanish (Español)", flag: "🇪🇸" },
    { id: "French", name: "French (Français)", flag: "🇫🇷" },
    { id: "German", name: "German (Deutsch)", flag: "🇩🇪" },
    { id: "Arabic", name: "Arabic (العربية)", flag: "🇸🇦" },
    { id: "Chinese", name: "Chinese (中文)", flag: "🇨🇳" },
    { id: "Hindi", name: "Hindi (हिन्दी)", flag: "🇮🇳" },
  ];

  // Voice & Text Language state
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("en-US-ChristopherNeural");
  const [selectedTextLanguage, setSelectedTextLanguage] = useState<string>("English");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch available neural voices on mount
  useEffect(() => {
    api.getVoices().then((res) => {
      if (res && res.length > 0) {
        setVoices(res);
      }
    }).catch(() => {});
  }, []);

  const handleVoiceChange = async (voiceId: string) => {
    setSelectedVoice(voiceId);
    const matchedVoice = voices.find((v) => v.id === voiceId);
    const label = matchedVoice
      ? `${matchedVoice.flag ? matchedVoice.flag + " " : ""}${matchedVoice.language} (${matchedVoice.name})`
      : voiceId;

    setToastMessage(`Voice switched to ${label}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);

    if (lectureId) {
      try {
        await api.sendCommand(lectureId, sessionId, "set_voice", voiceId);
      } catch (err) {
        console.warn("Failed to set voice on orchestrator:", err);
      }
    }
  };

  const handleTextLanguageChange = async (langId: string) => {
    setSelectedTextLanguage(langId);
    const matched = TEXT_LANGUAGES.find((t) => t.id === langId);
    const label = matched ? `${matched.flag} ${matched.name}` : langId;

    setToastMessage(`Text language set to ${label}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);

    if (lectureId) {
      try {
        await api.sendCommand(lectureId, sessionId, "set_text_language", langId);
      } catch (err) {
        console.warn("Failed to set text language on orchestrator:", err);
      }
    }
  };

  // User query & AI Thinking state
  const [userQuery, setUserQuery] = useState<string>("");
  const [customResponse, setCustomResponse] = useState<string | null>(null);
  const [isAnsweringQuery, setIsAnsweringQuery] = useState<boolean>(false);
  const [thinkingStatus, setThinkingStatus] = useState<string>("Analyzing lecture context...");
  const inputRef = useRef<HTMLInputElement>(null);

  const formatSeconds = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const remaining = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  // Dynamic Thinking Status Messages
  const THINKING_STEPS = [
    "Analyzing lecture context & timestamps...",
    "Connecting core phase concepts...",
    "Formulating intuitive analogy...",
    "Synthesizing voice response...",
  ];

  // Helper to play synthesized voice audio
  const playAudio = useCallback((audioUrl?: string | null) => {
    const resolved = api.resolveAudioUrl(audioUrl);
    if (resolved && audioPlayerRef.current) {
      audioPlayerRef.current.src = resolved;
      audioPlayerRef.current
        .play()
        .then(() => {
          setIsPlayingAudio(true);
          setIsSpeaking(true);
        })
        .catch(() => {
          // Autoplay policy fallback
          setIsPlayingAudio(false);
          setIsSpeaking(false);
        });
    }
  }, []);

  // Process orchestrator session events
  const processEvents = useCallback((events: SessionEvent[]) => {
    for (const ev of events) {
      if (ev.type === "phase_started") {
        if (typeof ev.phase_order === "number") {
          setCurrentPhaseIndex(ev.phase_order);
          setCustomResponse(null);
          setIsQuizMode(false);
          setIsAlternativeView(false);
          setPlaybackSeconds(0);
          setUserQuery("");
        }
      } else if (ev.type === "speaking") {
        const text = (ev.payload?.text as string) || "";
        const audioUrl = (ev.payload?.audio_url as string) || null;
        const inResponseTo = ev.payload?.in_response_to;

        if (inResponseTo) {
          setCustomResponse(text);
        } else {
          setCustomResponse(null);
          setActiveSpeechText(text);
        }

        if (audioUrl) {
          playAudio(audioUrl);
        }
      } else if (ev.type === "jumped_to_timestamp") {
        const ts = ev.payload?.timestamp as { start: number; end: number } | undefined;
        if (ts) {
          setPlaybackSeconds(Math.floor(ts.start));
          setIsSourceDrawerOpen(true);
        }
      } else if (ev.type === "quiz_started") {
        setIsQuizMode(true);
      } else if (ev.type === "session_ended") {
        setCustomResponse(null);
        setActiveSpeechText("All lecture phases have been completed. Great work!");
      }
    }
  }, [playAudio]);

  // Load Lecture, Plan, Quizzes, Transcripts, and start Orchestrator session
  useEffect(() => {
    if (!lectureId) return;

    let isMounted = true;

    async function initializeWorkspace() {
      try {
        const [lec, plan, quizzes, transcriptChunks] = await Promise.all([
          api.getLecture(lectureId!).catch(() => null),
          api.getLearningPlan(lectureId!).catch(() => null),
          api.getQuizzes(lectureId!).catch(() => []),
          api.getTranscripts(lectureId!).catch(() => []),
        ]);

        if (!isMounted) return;

        if (lec) setLecture(lec);
        if (transcriptChunks) setTranscripts(transcriptChunks);

        // If backend produced a real plan, map it to the UI
        if (plan && plan.phases.length > 0) {
          const mapped: PhaseData[] = plan.phases.map((ph, idx) => {
            const startSec = ph.source_timestamps[0]?.start ?? 0;
            const endSec = ph.source_timestamps[0]?.end ?? startSec + 120;
            const durationSec = Math.max(30, Math.floor(endSec - startSec));

            // Find matching quiz
            const quizItem = quizzes[idx] || quizzes[0];
            const quizOpts: QuizOption[] = quizItem
              ? quizItem.options.map((opt, oIdx) => ({
                  id: String.fromCharCode(97 + oIdx), // 'a', 'b', 'c', 'd'
                  text: opt,
                }))
              : [
                  { id: "a", text: `Core principles of ${ph.title}` },
                  { id: "b", text: "Historical background" },
                  { id: "c", text: "Unrelated application" },
                  { id: "d", text: "None of the above" },
                ];

            const correctId = quizItem
              ? String.fromCharCode(97 + Math.max(0, quizItem.options.indexOf(quizItem.correct_answer)))
              : "a";

            // Find matching transcript quote
            const matchingSegment = transcriptChunks.find(
              (seg) => seg.start >= startSec && seg.start <= endSec
            ) || transcriptChunks[idx] || transcriptChunks[0];

            return {
              id: ph.order + 1,
              title: `${ph.order + 1}. ${ph.title}`,
              subtitle: ph.prerequisite_note
                ? `Prerequisite: ${ph.prerequisite_note}`
                : "Core instructional concepts and mental models.",
              timestamp: formatSeconds(startSec),
              duration: formatSeconds(durationSec),
              durationSec,
              mentalModels: [
                {
                  number: "01",
                  title: ph.title,
                  description: ph.teaching_script.slice(0, 140) + "...",
                },
                {
                  number: "02",
                  title: "Key Takeaway",
                  description:
                    ph.teaching_script.slice(140, 280) ||
                    "Fundamental mechanism derived directly from the lecture recording.",
                },
              ],
              speechText: ph.teaching_script,
              alternativeSpeechText: `To put it simply: ${ph.teaching_script.slice(0, 200)}...`,
              transcriptQuote: matchingSegment?.text || ph.teaching_script.slice(0, 160),
              speaker: matchingSegment?.speaker || "AI Instructor",
              quiz: {
                question: quizItem?.question || `What is the primary topic of ${ph.title}?`,
                options: quizOpts,
                correctId,
                explanation: `Correct! ${quizItem?.correct_answer || ph.title}`,
              },
            };
          });

          setPhasesList(mapped);
          setActiveSpeechText(mapped[0]?.speechText || "");
        }

        // Start live session with the orchestrator
        const startEvents = await api.startSession(lectureId!, sessionId);
        if (isMounted && startEvents.length > 0) {
          processEvents(startEvents);
        }
      } catch (err) {
        console.error("Failed to initialize workspace from backend:", err);
      }
    }

    initializeWorkspace();

    return () => {
      isMounted = false;
    };
  }, [lectureId, sessionId, processEvents]);

  const currentPhase = phasesList[currentPhaseIndex] || phasesList[0] || defaultMockPhases[0];

  // Progress timer for audio playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setPlaybackSeconds((prev) => {
          if (prev >= currentPhase.durationSec) {
            setIsPlayingAudio(false);
            setIsSpeaking(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio, currentPhase.durationSec]);

  // When phase changes
  const handlePhaseChange = async (newIndex: number) => {
    setCurrentPhaseIndex(newIndex);
    setIsQuizMode(false);
    setIsAlternativeView(false);
    setPlaybackSeconds(0);
    setCustomResponse(null);
    setUserQuery("");

    const targetPhase = phasesList[newIndex];
    if (targetPhase) {
      setActiveSpeechText(targetPhase.speechText);
    }
  };

  // Button Action 1: Next Phase (Dispatches to Orchestrator)
  const handleNextPhase = async () => {
    setCustomResponse(null);
    setIsQuizMode(false);
    setIsAlternativeView(false);
    setPlaybackSeconds(0);
    setUserQuery("");

    if (lectureId) {
      try {
        const events = await api.sendCommand(lectureId, sessionId, "next");
        processEvents(events);
        return;
      } catch (err) {
        console.warn("Orchestrator sendCommand failed; advancing locally:", err);
      }
    }

    if (currentPhaseIndex < phasesList.length - 1) {
      handlePhaseChange(currentPhaseIndex + 1);
    } else {
      handlePhaseChange(0);
    }
  };

  // Button Action 2: Explain Again (Dispatches to Orchestrator)
  const handleExplainAgain = async () => {
    setIsQuizMode(false);
    setCustomResponse(null);

    if (lectureId) {
      try {
        const events = await api.sendCommand(lectureId, sessionId, "explain_again");
        processEvents(events);
        return;
      } catch (err) {
        console.warn("Explain again failed on backend; switching locally:", err);
      }
    }

    setIsAlternativeView((prev) => !prev);
  };

  // Button Action 3: Quiz Me (Dispatches to Orchestrator)
  const handleToggleQuiz = async () => {
    const nextMode = !isQuizMode;
    setIsQuizMode(nextMode);

    if (nextMode && lectureId) {
      try {
        const events = await api.sendCommand(lectureId, sessionId, "quiz_me");
        processEvents(events);
      } catch (err) {
        console.warn("Quiz command failed:", err);
      }
    }
  };

  // Button Action 4: Show Source (Dispatches to Orchestrator for timestamp receipt)
  const handleToggleSourceDrawer = async () => {
    const nextState = !isSourceDrawerOpen;
    setIsSourceDrawerOpen(nextState);

    if (nextState && lectureId) {
      try {
        const events = await api.sendCommand(lectureId, sessionId, "show_me");
        processEvents(events);
      } catch (err) {
        console.warn("Show me command failed:", err);
      }
    }
  };

  // Student Query Submission (Free Q&A via Orchestrator with animated thinking status)
  const handleQuerySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = userQuery.trim();
    if (!query || isAnsweringQuery) return;

    setIsAnsweringQuery(true);
    setIsSpeaking(true);
    setIsQuizMode(false);
    setThinkingStatus(THINKING_STEPS[0]);

    // Rotate through thinking stages while awaiting backend
    let stepIndex = 0;
    const thinkingInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % THINKING_STEPS.length;
      setThinkingStatus(THINKING_STEPS[stepIndex]);
    }, 1400);

    try {
      if (lectureId) {
        const events = await api.sendCommand(lectureId, sessionId, query);
        clearInterval(thinkingInterval);
        processEvents(events);
        const speakEv = events.find((ev) => ev.type === "speaking");
        if (speakEv?.payload?.text) {
          setCustomResponse(String(speakEv.payload.text));
        }
        setUserQuery("");
        setIsAnsweringQuery(false);
        setIsSpeaking(false);
        return;
      }
    } catch (err) {
      console.warn("Free Q&A failed on backend:", err);
      setCustomResponse(
        `I had a moment of interference while retrieving the explanation for "${query}". Please ask again!`
      );
    } finally {
      clearInterval(thinkingInterval);
      setIsAnsweringQuery(false);
      setIsSpeaking(false);
      setUserQuery("");
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    setPlaybackSeconds(Math.floor(percentage * currentPhase.durationSec));
  };

  const progressPercentage = Math.min(
    100,
    (playbackSeconds / currentPhase.durationSec) * 100
  );

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-neutral-100 selection:bg-[#701a24]/40 selection:text-white font-sans overflow-hidden">
      {/* Hidden audio element for speech playback */}
      <audio
        ref={audioPlayerRef}
        onEnded={() => {
          setIsPlayingAudio(false);
          setIsSpeaking(false);
        }}
      />

      {/* Global Collapsible Sidebar */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Workspace Top Header Bar */}
        <header className="h-14 px-6 border-b border-white/[0.07] flex items-center justify-between shrink-0 bg-[#09090b]/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Exit</span>
            </Link>

            <div className="h-4 w-[1px] bg-white/[0.08]" />

            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-xs font-semibold text-neutral-200 truncate">
                {lecture?.filename || "Lecture Workspace"}
              </span>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider shrink-0">
                Phase {currentPhaseIndex + 1} of {phasesList.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 1. Text Reading Language Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/[0.08] hover:border-white/[0.15] rounded-lg px-2.5 py-1 text-xs text-neutral-300 transition-colors">
              <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="text-[11px] text-neutral-400 hidden sm:inline">Text:</span>
              <select
                value={selectedTextLanguage}
                onChange={(e) => handleTextLanguageChange(e.target.value)}
                aria-label="Select Reading Text Language"
                className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1 hover:text-white"
              >
                {TEXT_LANGUAGES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-zinc-900 text-neutral-200">
                    {t.flag} {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. AI Voice & Accent Selector */}
            {voices.length > 0 && (
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/[0.08] hover:border-white/[0.15] rounded-lg px-2.5 py-1 text-xs text-neutral-300 transition-colors">
                <Volume2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="text-[11px] text-neutral-400 hidden sm:inline">Voice:</span>
                <select
                  value={selectedVoice}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  aria-label="Select Spoken AI Voice"
                  className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1 hover:text-white"
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id} className="bg-zinc-900 text-neutral-200">
                      {v.flag ? `${v.flag} ` : ""}{v.language} ({v.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Audio Indicator */}
            {isPlayingAudio && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                <Volume2 className="w-3 h-3 animate-pulse" />
                <span>Audio Playing</span>
              </div>
            )}

            {/* Lecture Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/[0.07] text-[11px] font-mono text-neutral-400">
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  lecture?.status === "ready" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                )}
              />
              <span className="capitalize">{lecture?.status || "Ready"}</span>
            </div>
          </div>
        </header>

        {/* Workspace Split Layout: Left Content (60%) vs Right Companion (40%) */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Pane — Active Lesson Canvas (60% Width, Scrollable) */}
          <section className="lg:col-span-7 p-6 sm:p-8 overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/[0.07] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {!isQuizMode ? (
                /* State A: Lesson Notes & Mental Model Canvas */
                <motion.div
                  key={`notes-state-${currentPhaseIndex}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-6"
                >
                  {/* Phase Title & Subtitle */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-[#701a24] font-semibold">
                        Phase {currentPhase.id}
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {currentPhase.duration}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
                      {currentPhase.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-2xl">
                      {currentPhase.subtitle}
                    </p>
                  </div>

                  {/* Mental Model Cards */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 block">
                      Core Frameworks
                    </span>

                    <div className="space-y-2.5">
                      {currentPhase.mentalModels.map((model) => (
                        <div
                          key={model.number}
                          className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.07] hover:border-white/[0.12] transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-[11px] font-mono text-neutral-500 font-semibold mt-0.5">
                              {model.number}
                            </span>
                            <div className="space-y-1">
                              <h3 className="text-xs sm:text-sm font-semibold text-neutral-200">
                                {model.title}
                              </h3>
                              <p className="text-xs text-neutral-400 leading-relaxed">
                                {model.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Source Timestamp Drawer Accordion */}
                  <div className="pt-2">
                    <button
                      onClick={handleToggleSourceDrawer}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/60 border border-white/[0.05] text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Source Timestamp Alignment Receipt</span>
                      </div>
                      {isSourceDrawerOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isSourceDrawerOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2.5 p-4 rounded-lg bg-zinc-950/70 border border-white/[0.07] text-xs space-y-3">
                            {/* Audio scrub control */}
                            <div className="flex items-center gap-3">
                              <motion.button
                                whileTap={{ scale: 0.94 }}
                                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                                className="h-7 w-7 rounded-md bg-zinc-800 hover:bg-zinc-700 text-neutral-200 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                {isPlayingAudio ? (
                                  <Pause className="w-3 h-3" />
                                ) : (
                                  <Play className="w-3 h-3 ml-0.5" />
                                )}
                              </motion.button>

                              <div
                                onClick={handleSeek}
                                className="flex-1 h-1.5 rounded-full bg-zinc-800 cursor-pointer overflow-hidden relative"
                              >
                                <div
                                  className="h-full bg-[#701a24] rounded-full"
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>

                              <span className="font-mono text-[10px] text-neutral-500">
                                {formatSeconds(playbackSeconds)} / {currentPhase.duration}
                              </span>
                            </div>

                            {/* Verbatim quote */}
                            <div className="pt-2 border-t border-white/[0.06] font-mono text-[11px] leading-relaxed text-neutral-300">
                              <span className="text-neutral-400 font-semibold block mb-0.5">
                                [{currentPhase.timestamp}] {currentPhase.speaker}:
                              </span>
                              <p className="text-neutral-300 italic">
                                &quot;{currentPhase.transcriptQuote}&quot;
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1">
                              <span className="flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified Source Alignment
                              </span>
                              <span>Timestamp: {currentPhase.timestamp}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                /* State B: Quiz Mode View */
                <motion.div
                  key={`quiz-state-${currentPhaseIndex}`}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 350, damping: 26 }}
                  className="flex flex-col flex-1 justify-center py-4"
                >
                  <div className="mb-4 flex items-center justify-between text-xs font-mono text-neutral-400">
                    <span>Phase Diagnostic Check</span>
                    <button
                      onClick={() => setIsQuizMode(false)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Return to Notes ×
                    </button>
                  </div>

                  <QuizCard
                    phaseTitle={currentPhase.title}
                    question={currentPhase.quiz.question}
                    options={currentPhase.quiz.options}
                    correctId={currentPhase.quiz.correctId}
                    explanation={currentPhase.quiz.explanation}
                    onComplete={() => handleNextPhase()}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Right Pane — AI Companion & Action Hub (40% Width, Sticky) */}
          <section className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-zinc-950/40">
            <div className="flex flex-col items-center w-full">
              {/* 3D Robot Companion Cleanly Mounted */}
              <div className="relative w-full h-[230px] sm:h-[260px] flex items-center justify-center pointer-events-none mb-2">
                <RobotCompanionWrapper isFast={isSpeaking || isAnsweringQuery} />
              </div>

              {/* Clean Minimal Dialogue Box with Dynamic Thinking State */}
              <motion.div
                layout
                key={`speech-${currentPhaseIndex}-${isQuizMode}-${isAlternativeView}-${customResponse}-${isAnsweringQuery}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "w-full p-4 rounded-xl border text-xs sm:text-sm leading-relaxed shadow-sm mb-3 transition-colors",
                  isAnsweringQuery
                    ? "bg-zinc-900/90 border-emerald-500/30 text-neutral-200"
                    : "bg-zinc-900/60 border-white/[0.07] text-neutral-300"
                )}
              >
                {isAnsweringQuery ? (
                  <div className="flex items-center gap-3 py-1">
                    <div className="relative flex items-center justify-center shrink-0">
                      <div className="h-6 w-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                      <Sparkles className="w-2.5 h-2.5 text-emerald-400 absolute" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
                          AI Companion
                        </span>
                        <span className="flex gap-1 items-center">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse [animation-delay:-0.3s]" />
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse [animation-delay:-0.15s]" />
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 font-medium">
                        {thinkingStatus}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p>
                    {customResponse
                      ? customResponse
                      : isQuizMode
                      ? "Test your understanding of this phase before moving forward."
                      : isAlternativeView
                      ? currentPhase.alternativeSpeechText
                      : activeSpeechText || currentPhase.speechText}
                  </p>
                )}
              </motion.div>

              {/* Robot User Query Input Box */}
              <form
                onSubmit={handleQuerySubmit}
                className="w-full relative flex items-center rounded-xl bg-zinc-900/60 border border-white/[0.07] px-3 py-1.5 focus-within:border-white/[0.15] focus-within:bg-zinc-900/90 transition-all shadow-sm"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Ask a question about this phase..."
                  className="w-full bg-transparent text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none border-none pr-7 py-1"
                />

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.94 }}
                  disabled={!userQuery.trim() || isAnsweringQuery}
                  className={cn(
                    "absolute right-2.5 flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 transition-colors cursor-pointer",
                    userQuery.trim() && !isAnsweringQuery
                      ? "bg-white text-neutral-950 hover:bg-neutral-200"
                      : "opacity-40 cursor-not-allowed"
                  )}
                  aria-label="Send question"
                >
                  {isAnsweringQuery ? (
                    <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />
                  ) : (
                    <ArrowRight className="w-3 h-3" />
                  )}
                </motion.button>
              </form>
            </div>

            {/* Minimal Actions Dock directly below */}
            <div className="mt-6 pt-4 border-t border-white/[0.07]">
              {/* 2x2 Minimal Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Action 1: Explain Again */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={handleExplainAgain}
                  className={cn(
                    "p-3 rounded-lg border text-xs font-medium tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-colors",
                    isAlternativeView
                      ? "bg-[#701a24]/30 border-[#701a24]/60 text-stone-200"
                      : "bg-zinc-900/50 hover:bg-zinc-800/80 border-white/[0.07] text-neutral-200"
                  )}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{isAlternativeView ? "Standard Notes" : "Explain Again"}</span>
                </motion.button>

                {/* Action 2: Quiz Me */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={handleToggleQuiz}
                  className={cn(
                    "p-3 rounded-lg border text-xs font-medium tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-colors",
                    isQuizMode
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
                      : "bg-zinc-900/50 hover:bg-zinc-800/80 border-white/[0.07] text-neutral-200"
                  )}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isQuizMode ? "Canvas Mode" : "Quiz Me"}</span>
                </motion.button>

                {/* Action 3: Show Source */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={handleToggleSourceDrawer}
                  className={cn(
                    "p-3 rounded-lg border text-xs font-medium tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-colors",
                    isSourceDrawerOpen
                      ? "bg-zinc-800 border-zinc-700 text-neutral-100"
                      : "bg-zinc-900/50 hover:bg-zinc-800/80 border-white/[0.07] text-neutral-200"
                  )}
                >
                  <Search className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{isSourceDrawerOpen ? "Hide Source" : "Show Source"}</span>
                </motion.button>

                {/* Action 4: Next Phase */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={handleNextPhase}
                  className="p-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold tracking-tight flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <span>
                    {currentPhaseIndex < phasesList.length - 1
                      ? `Next Phase (${currentPhaseIndex + 2})`
                      : "Restart Plan"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Floating Toast Notification for Voice / Accent Switching */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900/95 border border-white/[0.12] shadow-2xl backdrop-blur-md text-xs text-neutral-200"
          >
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
