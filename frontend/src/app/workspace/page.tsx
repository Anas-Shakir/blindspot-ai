"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Zap,
  Search,
  ArrowRight,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Volume2,
  Volume1,
  VolumeX,
  Loader2,
  Sparkles,
  ListOrdered,
  FileText,
  AlertCircle,
  Clock,
  Radio,
  Presentation,
  PenTool,
  MousePointer,
  Square,
  Circle,
  Eraser,
  Trash2,
  Network,
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
import RobotCompanionWrapper from "@/components/player/RobotCompanionWrapper";
import { WhiteboardCanvas } from "@/components/whiteboard/WhiteboardCanvas";
import KnowledgeGraphView from "@/components/player/KnowledgeGraphView";
import { CanvasObject, ToolType, ViewportTransform } from "@/lib/whiteboard/types";
import QuizCard, { QuizOption } from "@/components/player/QuizCard";
import Sidebar from "@/components/common/Sidebar";

interface PhaseData {
  id: number;
  title: string;
  subtitle: string;
  timestamp: string;
  duration: string;
  durationSec: number;
  startSec: number;
  endSec: number;
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
    startSec: 192,
    endSec: 447,
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
  {
    id: 2,
    title: "2. Price Elasticity of Demand (PED)",
    subtitle: "Quantifying behavioral consumer sensitivity to price variations.",
    timestamp: "14:22",
    duration: "06:40",
    durationSec: 400,
    startSec: 862,
    endSec: 1262,
    mentalModels: [
      {
        number: "01",
        title: "The elasticity coefficient ratio",
        description:
          "PED is calculated as the proportional percentage shift in quantity demanded divided by the percentage variation in price (%ΔQ / %ΔP).",
      },
      {
        number: "02",
        title: "Revenue inversion threshold",
        description:
          "On an elastic demand curve (PED > 1), raising prices decreases total revenue because volume loss outweighs price gains. On inelastic curves, revenue expands.",
      },
      {
        number: "03",
        title: "Substitutability boundary",
        description:
          "The availability of direct market substitutes is the primary factor that dictates long-term elasticity magnitude and consumer mobility.",
      },
    ],
    speechText:
      "When demand is elastic, consumer volume shifts rapidly in response to price. For inelastic necessities, consumers absorb price shifts.",
    alternativeSpeechText:
      "If luxury coffee prices jump 20%, buyers quickly switch to tea. But if electricity doubles in price, consumption barely budges in the short term.",
    transcriptQuote:
      "...when elasticity is greater than one, consumer demand responds disproportionately to any price adjustment, causing total revenue to move in the opposite direction of the price change.",
    speaker: "Prof. Sterling",
    quiz: {
      question:
        "If the Price Elasticity of Demand (PED) for a product is 2.5 and the seller decreases price by 10%, what is the expected change in quantity demanded?",
      options: [
        { id: "a", text: "Quantity demanded increases by 25%." },
        { id: "b", text: "Quantity demanded decreases by 25%." },
        { id: "c", text: "Quantity demanded increases by 2.5%." },
        { id: "d", text: "Quantity demanded remains unchanged." },
      ],
      correctId: "a",
      explanation:
        "PED = %ΔQ / %ΔP. Rearranging gives %ΔQ = PED × %ΔP = 2.5 × 10% = +25% increase in quantity demanded.",
    },
  },
  {
    id: 3,
    title: "3. Equilibrium Shifting & Exogenous Shocks",
    subtitle: "Systemic reaction functions when macroeconomic constraints adjust.",
    timestamp: "23:45",
    duration: "08:10",
    durationSec: 490,
    startSec: 1425,
    endSec: 1915,
    mentalModels: [
      {
        number: "01",
        title: "Schedule shift vs. point movement",
        description:
          "An exogenous shock shifts the entire supply or demand schedule, whereas a change in the good's own price represents movement along the existing curve.",
      },
      {
        number: "02",
        title: "Elasticity-dependent shock distribution",
        description:
          "Inelastic markets absorb supply shocks primarily through severe price volatility; elastic markets absorb shocks through dramatic volume adjustments.",
      },
      {
        number: "03",
        title: "Secondary feedback propagation",
        description:
          "Shock waves in primary commodity markets propagate into complementary and substitute markets through cross-price elasticity linkages.",
      },
    ],
    speechText:
      "Inelastic markets absorb supply constraints through price volatility, while elastic markets absorb shocks through volume reductions.",
    alternativeSpeechText:
      "During an oil disruption, fuel prices surge aggressively in the short term because driving habits cannot change immediately.",
    transcriptQuote:
      "...a steep, inelastic curve forces the market price to absorb the brunt of any supply shift, whereas a flat elastic curve forces the volume to adjust.",
    speaker: "Prof. Sterling",
    quiz: {
      question:
        "How does an unexpected supply contraction affect an inelastic market compared to a highly elastic market?",
      options: [
        { id: "a", text: "Price rises sharply with only a modest decline in transaction volume." },
        { id: "b", text: "Volume drops drastically with virtually no change in equilibrium price." },
        { id: "c", text: "Both price and volume remain completely unchanged." },
        { id: "d", text: "Total producer revenue automatically falls to zero." },
      ],
      correctId: "a",
      explanation:
        "In an inelastic market, consumers cannot readily substitute away, forcing the clearing price to escalate sharply to ration the limited supply.",
    },
  },
  {
    id: 4,
    title: "4. Deadweight Loss & Welfare Analysis",
    subtitle: "Measuring allocative efficiency and evaporated gains from trade.",
    timestamp: "38:10",
    duration: "09:30",
    durationSec: 570,
    startSec: 2290,
    endSec: 2860,
    mentalModels: [
      {
        number: "01",
        title: "The Harberger deadweight triangle",
        description:
          "Taxes, tariffs, or price controls drive a wedge between marginal cost and consumer valuation, eliminating mutually beneficial transactions.",
      },
      {
        number: "02",
        title: "Tax incidence independence",
        description:
          "The legal statutory incidence of a tax does not determine who actually pays; the more inelastic market side bears the economic tax incidence.",
      },
      {
        number: "03",
        title: "Pareto optimality frontier",
        description:
          "A competitive market in equilibrium maximizes aggregate social surplus (Consumer Surplus + Producer Surplus) without deadweight friction.",
      },
    ],
    speechText:
      "Deadweight loss represents lost mutually beneficial trade. The side of the market with less flexibility always bears the greater burden.",
    alternativeSpeechText:
      "When a tax is imposed, buyers pay slightly more and sellers receive slightly less. Transactions that would have happened never take place.",
    transcriptQuote:
      "Deadweight loss is not revenue collected by government—it is aggregate societal wealth that is permanently destroyed because mutually beneficial trades were prevented.",
    speaker: "Prof. Sterling",
    quiz: {
      question:
        "When an excise tax is imposed on a market where demand is perfectly inelastic and supply is elastic, who bears the economic burden of the tax?",
      options: [
        { id: "a", text: "Consumers bear 100% of the economic tax burden." },
        { id: "b", text: "Producers bear 100% of the economic tax burden." },
        { id: "c", text: "The tax burden is divided exactly 50/50 regardless of elasticity." },
        { id: "d", text: "No tax burden exists because deadweight loss is zero." },
      ],
      correctId: "a",
      explanation:
        "When demand is perfectly inelastic, consumers cannot alter their purchase quantity in response to price, allowing producers to pass 100% of the tax burden forward.",
    },
  },
];

const defaultTranscriptSegments: TranscriptSegment[] = [
  {
    start: 0,
    end: 18,
    speaker: "Prof. Sterling",
    text: "Welcome back everyone. Today we are exploring dynamic market equilibrium and the foundational price clearance mechanisms.",
  },
  {
    start: 18,
    end: 45,
    speaker: "Prof. Sterling",
    text: "Market equilibrium is fundamentally an informational mechanism: price changes coordinate decentralized buyers and sellers without centralized control.",
  },
  {
    start: 45,
    end: 80,
    speaker: "Prof. Sterling",
    text: "Market forces constantly reconcile bid-ask differentials without central coordination, clearing inventory without systematic surplus or shortage.",
  },
  {
    start: 80,
    end: 125,
    speaker: "Prof. Sterling",
    text: "Notice how consumer surplus geometry reflects the aggregate area under the demand curve and above the market price threshold.",
  },
  {
    start: 125,
    end: 170,
    speaker: "Prof. Sterling",
    text: "Price signals do not clear physical supply chains instantaneously; inventory buffers and capacity constraints absorb short-term demand fluctuations.",
  },
  {
    start: 170,
    end: 215,
    speaker: "Prof. Sterling",
    text: "When demand is elastic, consumer volume shifts rapidly in response to price variations. For inelastic necessities, consumers absorb price shifts.",
  },
  {
    start: 215,
    end: 255,
    speaker: "Prof. Sterling",
    text: "PED is calculated as the proportional percentage shift in quantity demanded divided by the percentage variation in price (%ΔQ / %ΔP).",
  },
  {
    start: 255,
    end: 295,
    speaker: "Prof. Sterling",
    text: "On an elastic demand curve with PED greater than one, raising prices paradoxically decreases total revenue because volume loss outweighs price gains.",
  },
  {
    start: 295,
    end: 340,
    speaker: "Prof. Sterling",
    text: "Inelastic markets absorb supply shocks primarily through severe price volatility, whereas elastic markets absorb shocks through dramatic volume adjustments.",
  },
  {
    start: 340,
    end: 385,
    speaker: "Prof. Sterling",
    text: "Deadweight loss represents lost mutually beneficial trade. The side of the market with less flexibility always bears the greater economic tax burden.",
  },
  {
    start: 385,
    end: 430,
    speaker: "Prof. Sterling",
    text: "A competitive market in equilibrium maximizes aggregate social surplus without artificial deadweight friction or regulatory distortion.",
  },
];

type ToolTab = "notes" | "plan" | "summary";

export default function WorkspacePage() {
  const params = useParams();
  const rawId = params?.id;
  const lectureId = rawId ? (Array.isArray(rawId) ? rawId[0] : rawId) : null;

  // Lecture & Plan data
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [, setPlan] = useState<LearningPlan | null>(null);
  const [, setQuizzes] = useState<QuizItem[]>([]);
  const [transcriptChunks, setTranscriptChunks] = useState<TranscriptSegment[]>([]);

  // Workspace Tabs State
  const [activeTab, setActiveTab] = useState<ToolTab>("notes");

  // 1. Functional Notes Tab State (Interactive AI-Assisted Text Editor)
  const [notesText, setNotesText] = useState<string>(
    `# Notes — Phase 1: Foundations of Supply & Demand\n\n• Market equilibrium coordinates decentralized buyers & sellers without central direction.\n• Price signals indicate supply scarcity and demand intensity at the margin.\n• Consumer surplus is the area under demand and above the clearing price line.\n\nTake notes or scratch equations here during the lecture...`
  );
  const [isGeneratingNotes, setIsGeneratingNotes] = useState<boolean>(false);
  const notesIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const SMART_NOTES_CONTENT =
    "Key Takeaways:\n- Supply and demand dictate market equilibrium.\n- AI whiteboards adapt to user learning speeds.\n- Next step: Review elasticity formulas.";

  // Streaming Effect: Character-by-character appending to simulate live LLM streaming
  const handleGenerateSmartNotes = useCallback(() => {
    if (isGeneratingNotes) return;
    setIsGeneratingNotes(true);

    const prefix =
      notesText.trim().length > 0
        ? notesText.endsWith("\n\n")
          ? ""
          : notesText.endsWith("\n")
          ? "\n"
          : "\n\n"
        : "";

    const textToStream = prefix + SMART_NOTES_CONTENT;
    let charIndex = 0;

    if (notesIntervalRef.current) {
      clearInterval(notesIntervalRef.current);
    }

    notesIntervalRef.current = setInterval(() => {
      if (charIndex < textToStream.length) {
        const nextChar = textToStream[charIndex];
        setNotesText((prev) => prev + nextChar);
        charIndex++;
      } else {
        if (notesIntervalRef.current) {
          clearInterval(notesIntervalRef.current);
          notesIntervalRef.current = null;
        }
        setIsGeneratingNotes(false);
      }
    }, 28);
  }, [isGeneratingNotes, notesText]);

  // Clean up streaming interval on component unmount
  useEffect(() => {
    return () => {
      if (notesIntervalRef.current) {
        clearInterval(notesIntervalRef.current);
      }
    };
  }, []);

  // 2. Main Stage View Mode (3D Robot, Whiteboard, or Knowledge Graph)
  type StageView = "robot" | "whiteboard" | "graph";
  const [stageView, setStageView] = useState<StageView>("robot");
  const [whiteboardObjects, setWhiteboardObjects] = useState<CanvasObject[]>([]);
  const [whiteboardTool, setWhiteboardTool] = useState<ToolType>("pen");
  const [whiteboardColor] = useState<string>("#FFFFFF");
  const [whiteboardWidth] = useState<number>(3);
  const [whiteboardViewport, setWhiteboardViewport] = useState<ViewportTransform>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // Multi-Phase state
  const [phasesList, setPhasesList] = useState<PhaseData[]>(defaultMockPhases);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isAlternativeView, setIsAlternativeView] = useState<boolean>(false);
  const [activeSpeechText, setActiveSpeechText] = useState<string>("");

  // Audio player & Ground truth drawer state
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Custom Luxury Audio Player Engine & Controls
  const lectureAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrubBarRef = useRef<HTMLDivElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(255);
  const [audioVolume, setAudioVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [stopIntroSignal, setStopIntroSignal] = useState<number>(0);

  // When robot intro plays, pause source lecture and synthesized TTS audio
  const handleIntroPlay = useCallback(() => {
    if (lectureAudioRef.current && !lectureAudioRef.current.paused) {
      lectureAudioRef.current.pause();
      setIsAudioPlaying(false);
    }
    if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
      setIsSpeaking(false);
    }
  }, []);

  // Robust play/pause toggle relying directly on HTMLMediaElement state
  const toggleAudioPlay = useCallback(() => {
    const audio = lectureAudioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      setIsAudioPlaying(false);
    } else {
      // If at or near the end, reset to start
      if (audio.duration && !isNaN(audio.duration) && audio.currentTime >= audio.duration - 0.2) {
        audio.currentTime = 0;
      }

      // Stop robot intro so both never play simultaneously
      setStopIntroSignal((prev) => prev + 1);

      // Stop synthesized speech audio if running
      if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
        audioPlayerRef.current.pause();
        setIsPlayingAudio(false);
        setIsSpeaking(false);
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsAudioPlaying(true);
          })
          .catch((err) => {
            console.warn("Audio play failed or blocked, attempting fallback:", err);
            if (!audio.src.includes("test-audio.mp4")) {
              audio.src = "/test-audio.mp4";
              audio.load();
              audio
                .play()
                .then(() => setIsAudioPlaying(true))
                .catch((e) => console.warn("Fallback play also blocked:", e));
            }
          });
      }
    }
  }, []);

  const skipAudio = (seconds: number) => {
    if (!lectureAudioRef.current) return;
    const maxDur = audioDuration || currentPhase.durationSec || 255;
    const target = Math.max(0, Math.min(maxDur, lectureAudioRef.current.currentTime + seconds));
    lectureAudioRef.current.currentTime = target;
    setAudioCurrentTime(target);
  };

  const handleScrubClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubBarRef.current || !lectureAudioRef.current) return;
    const rect = scrubBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const maxDur = audioDuration || currentPhase.durationSec || 255;
    const newTime = percentage * maxDur;
    lectureAudioRef.current.currentTime = newTime;
    setAudioCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (!lectureAudioRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    lectureAudioRef.current.muted = next;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAudioVolume(val);
    if (lectureAudioRef.current) {
      lectureAudioRef.current.volume = val;
      lectureAudioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setPlaybackRate(nextRate);
    if (lectureAudioRef.current) {
      lectureAudioRef.current.playbackRate = nextRate;
    }
  };

  const jumpToPhaseTimestamp = (seconds: number) => {
    if (lectureAudioRef.current) {
      // Stop robot intro and any synthesized speech
      setStopIntroSignal((prev) => prev + 1);
      if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
        audioPlayerRef.current.pause();
        setIsPlayingAudio(false);
        setIsSpeaking(false);
      }

      lectureAudioRef.current.currentTime = seconds;
      setAudioCurrentTime(seconds);
      if (lectureAudioRef.current.paused) {
        lectureAudioRef.current
          .play()
          .then(() => setIsAudioPlaying(true))
          .catch(() => {});
      }
    }
  };

  // Active Transcripts from backend API or rich default segments
  const activeTranscripts = (transcriptChunks && transcriptChunks.length > 0)
    ? transcriptChunks
    : defaultTranscriptSegments;

  // Real-time Active Transcript Segment currently being spoken by speaker
  const activeSegment = activeTranscripts.find(
    (seg) => audioCurrentTime >= seg.start && audioCurrentTime < (seg.end || seg.start + 12)
  ) || activeTranscripts.reduce((prev, curr) => {
    if (curr.start <= audioCurrentTime) return curr;
    return prev;
  }, activeTranscripts[0]);

  // Auto-scroll ref for live active transcript line
  const activeTranscriptRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeTranscriptRef.current && isAudioPlaying) {
      activeTranscriptRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSegment?.start, isAudioPlaying]);

  // Live session orchestration
  const [sessionId] = useState<string>(() => `sess_${Date.now()}`);

  // User query & dynamic thinking status
  const [userQuery, setUserQuery] = useState<string>("");
  const [isAnsweringQuery, setIsAnsweringQuery] = useState<boolean>(false);
  const [customResponse, setCustomResponse] = useState<string | null>(null);
  const [thinkingStatus, setThinkingStatus] = useState<string>("Analyzing lecture context...");

  const formatSeconds = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const remaining = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  const THINKING_STEPS = [
    "Analyzing lecture context & timestamps...",
    "Connecting core phase concepts...",
    "Formulating intuitive analogy...",
    "Synthesizing voice response...",
  ];

  // Helper to play synthesized voice audio
  const playAudio = useCallback((audioUrl?: string | null) => {
    // If lecture audio is playing, pause it so they don't overlap
    if (lectureAudioRef.current && !lectureAudioRef.current.paused) {
      lectureAudioRef.current.pause();
      setIsAudioPlaying(false);
    }
    // Also signal robot intro to stop
    setStopIntroSignal((prev) => prev + 1);

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
          setIsPlayingAudio(false);
          setIsSpeaking(false);
        });
    }
  }, []);

  // Process orchestrator session events
  const processEvents = useCallback((events: SessionEvent[]) => {
    for (const ev of events) {
      if (ev.type === "phase_started") {
        const order =
          typeof ev.phase_order === "number"
            ? ev.phase_order
            : typeof ev.payload?.order === "number"
            ? (ev.payload.order as number)
            : null;

        if (order !== null && order >= 0 && order < phasesList.length) {
          setCurrentPhaseIndex(order);
          setActiveSpeechText("");
          setCustomResponse(null);
          setIsQuizMode(false);
          setIsAlternativeView(false);
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
        if (ts && lectureAudioRef.current) {
          lectureAudioRef.current.currentTime = ts.start;
          setIsSourceDrawerOpen(true);
        }
      } else if (ev.type === "quiz_started") {
        setIsQuizMode(true);
      } else if (ev.type === "session_ended") {
        // Only trigger session ended message if at the final phase
        if (currentPhaseIndex >= phasesList.length - 1) {
          setCustomResponse(null);
          setActiveSpeechText("All lecture phases have been completed. Great work!");
        }
      }
    }
  }, [playAudio, phasesList.length, currentPhaseIndex]);

  // Ask AI Tutor about a specific concept from the Knowledge Graph
  const handleAskTutorAboutConcept = useCallback((question: string) => {
    setUserQuery(question);
    setStageView("robot");
    if (lectureId) {
      api
        .sendCommand(lectureId, sessionId, question)
        .then((events) => {
          if (Array.isArray(events) && events.length > 0) {
            processEvents(events);
          }
        })
        .catch((err) => console.warn("Ask tutor fallback:", err));
    }
  }, [lectureId, sessionId, processEvents]);

  // Load Lecture, Plan, Quizzes, Transcripts, and start Orchestrator session
  useEffect(() => {
    if (!lectureId) return;

    let isMounted = true;

    async function initializeWorkspace() {
      try {
        const [lec, planData, quizzesData, transcriptData] = await Promise.all([
          api.getLecture(lectureId!).catch(() => null),
          api.getLearningPlan(lectureId!).catch(() => null),
          api.getQuizzes(lectureId!).catch(() => []),
          api.getTranscripts(lectureId!).catch(() => []),
        ]);

        if (!isMounted) return;

        if (lec) setLecture(lec);
        if (planData) setPlan(planData);
        if (quizzesData) setQuizzes(quizzesData);
        if (transcriptData) setTranscriptChunks(transcriptData);

        // Convert plan phases into PhaseData structure if available
        if (planData && Array.isArray(planData.phases) && planData.phases.length > 0) {
          const generatedPhases: PhaseData[] = planData.phases.map((p, idx) => {
            const phaseQuiz = quizzesData?.find((q) => q.lecture_id === Number(lectureId)) || null;
            const startSec = p.source_timestamps?.[0]?.start ?? idx * 300;
            const endSec = p.source_timestamps?.[0]?.end ?? (idx + 1) * 300;
            const durationSec = Math.max(60, Math.floor(endSec - startSec));

            return {
              id: p.order + 1,
              title: `${p.order + 1}. ${p.title}`,
              subtitle: p.prerequisite_note || `Key phase covering ${p.title.toLowerCase()}.`,
              timestamp: formatSeconds(Math.floor(startSec)),
              duration: formatSeconds(durationSec),
              durationSec,
              startSec: Math.floor(startSec),
              endSec: Math.floor(endSec),
              mentalModels: [
                {
                  number: "01",
                  title: p.title,
                  description: p.teaching_script.slice(0, 160) + "...",
                },
                {
                  number: "02",
                  title: "Key Framework",
                  description: "Dynamic structural model derived from lecture source ground truth.",
                },
              ],
              speechText: p.teaching_script,
              alternativeSpeechText: `In simpler terms: ${p.teaching_script.slice(0, 200)}...`,
              transcriptQuote: p.teaching_script.slice(0, 140) + "...",
              speaker: "Prof. Sterling",
              quiz: phaseQuiz
                ? (() => {
                    let correctIdx = phaseQuiz.options.indexOf(phaseQuiz.correct_answer);
                    if (correctIdx < 0) {
                      const normalizedAnswer = phaseQuiz.correct_answer.trim().toLowerCase();
                      correctIdx = phaseQuiz.options.findIndex(
                        (opt) => opt.trim().toLowerCase() === normalizedAnswer
                      );
                    }
                    if (correctIdx < 0) {
                      correctIdx = 0;
                    }
                    return {
                      question: phaseQuiz.question,
                      options: phaseQuiz.options.map((opt, oIdx) => ({
                        id: String.fromCharCode(97 + oIdx),
                        text: opt,
                      })),
                      correctId: String.fromCharCode(97 + correctIdx),
                      explanation: `Correct answer: ${phaseQuiz.correct_answer}`,
                    };
                  })()
                : defaultMockPhases[0].quiz,
            };
          });

          setPhasesList(generatedPhases);
        }

        // Initialize Orchestrator Live Session
        try {
          const initialEvents = await api.startSession(lectureId!, sessionId);
          if (isMounted && Array.isArray(initialEvents)) {
            processEvents(initialEvents);
          }
        } catch (sessErr) {
          console.warn("Orchestrator session start note:", sessErr);
        }
      } catch (err) {
        console.warn("Workspace initialization completed with local fallbacks:", err);
      }
    }

    initializeWorkspace();

    return () => {
      isMounted = false;
    };
  }, [lectureId, sessionId, processEvents]);

  const currentPhase = phasesList[currentPhaseIndex] || defaultMockPhases[0];

  // Phase navigation
  const handlePhaseChange = async (newIndex: number) => {
    if (newIndex < 0 || newIndex >= phasesList.length) return;

    setCurrentPhaseIndex(newIndex);
    setActiveSpeechText("");
    setIsQuizMode(false);
    setIsAlternativeView(false);
    setCustomResponse(null);
    setUserQuery("");

    // Align audio playback with the selected phase timestamp
    const targetPhase = phasesList[newIndex];
    if (targetPhase && typeof targetPhase.startSec === "number") {
      if (lectureAudioRef.current) {
        lectureAudioRef.current.currentTime = targetPhase.startSec;
      }
      setAudioCurrentTime(targetPhase.startSec);
    }

    if (lectureId) {
      try {
        const events = await api.sendCommand(lectureId, sessionId, "next", String(newIndex));
        if (Array.isArray(events) && events.length > 0) {
          const validEvents = events.filter(
            (e) => e.type === "speaking" || (e.type === "phase_started" && typeof e.phase_order === "number")
          );
          if (validEvents.length > 0) {
            processEvents(validEvents);
          }
        }
      } catch (err) {
        console.warn("Phase change dispatch fallback:", err);
      }
    }
  };

  const handleNextPhase = () => {
    const nextIndex = currentPhaseIndex < phasesList.length - 1 ? currentPhaseIndex + 1 : 0;
    handlePhaseChange(nextIndex);
  };

  const handleExplainAgain = async () => {
    setIsQuizMode(false);
    setCustomResponse(null);
    setIsAlternativeView((prev) => !prev);

    if (lectureId) {
      try {
        const events = await api.sendCommand(lectureId, sessionId, "explain_again");
        if (Array.isArray(events) && events.length > 0) {
          processEvents(events);
        }
      } catch (err) {
        console.warn("Explain again fallback:", err);
      }
    }
  };

  const handleToggleQuiz = async () => {
    const nextMode = !isQuizMode;
    setIsQuizMode(nextMode);

    if (nextMode && lectureId) {
      try {
        const events = await api.sendCommand(lectureId, sessionId, "quiz_me");
        processEvents(events);
      } catch (err) {
        console.warn("Quiz command fallback:", err);
      }
    }
  };

  const handleToggleSourceDrawer = async () => {
    const nextState = !isSourceDrawerOpen;
    setIsSourceDrawerOpen(nextState);

    if (nextState && lectureId) {
      try {
        const events = await api.sendCommand(lectureId, sessionId, "show_me");
        processEvents(events);
      } catch (err) {
        console.warn("Show me command fallback:", err);
      }
    }
  };

  // Single Unified Subtitle State (visible ONLY when robot is talking or audio is playing)
  const isSpeakingOrPlaying = isAudioPlaying || isPlayingAudio || isSpeaking || isAnsweringQuery;
  const currentLiveSubtitle = isAnsweringQuery
    ? thinkingStatus
    : isAudioPlaying && activeSegment
    ? activeSegment.text
    : customResponse
    ? customResponse
    : isAlternativeView
    ? currentPhase.alternativeSpeechText
    : (isSpeaking || isPlayingAudio)
    ? (activeSpeechText || currentPhase.speechText)
    : "";

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#0a0a0a] text-neutral-100 selection:bg-[#701a24]/40 selection:text-white font-sans">
      {/* Hidden audio element for AI Tutor speech playback */}
      <audio
        ref={audioPlayerRef}
        onEnded={() => {
          setIsPlayingAudio(false);
          setIsSpeaking(false);
        }}
      />

      {/* =====================================================================
          1. Left Column: NavBar / Lecture List (Fixed width, w-64, bordered right)
          ===================================================================== */}
      <div className="w-64 shrink-0 h-full border-r border-neutral-800 bg-[#09090b] flex flex-col overflow-hidden z-20">
        <Sidebar
          className="h-full border-none w-full"
          currentPathOverride="/workspace"
          onNavigate={(href) => {
            if (href === "#graph") {
              setStageView("graph");
            }
          }}
        />
      </div>

      {/* =====================================================================
          2. Middle Column: Main Stage (Flexible width, flex-1, bordered right)
          ===================================================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-neutral-800 bg-[#0a0a0a] min-w-0">
        {/* Minimal Top Bar with Title, Exit Link, and 3D Robot / Whiteboard View Toggle */}
        <header className="h-12 px-6 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-[#0a0a0a] z-10">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer group shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Exit</span>
            </Link>

            <div className="h-3.5 w-[1px] bg-neutral-800 shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-neutral-200 truncate">
                {lecture?.filename || "Dynamic Market Equilibria"}
              </span>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider shrink-0">
                • Phase {currentPhaseIndex + 1} of {phasesList.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* 3-Way Stage View Switcher: 3D Robot vs Whiteboard vs Knowledge Graph */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setStageView("robot")}
                className={cn(
                  "px-2.5 sm:px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer text-xs font-medium",
                  stageView === "robot"
                    ? "bg-neutral-800 text-white shadow-sm font-semibold"
                    : "text-neutral-400 hover:text-white"
                )}
                title="3D Robot Companion"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#701a24]" />
                <span className="hidden sm:inline">3D Robot</span>
              </button>
              <button
                type="button"
                onClick={() => setStageView("whiteboard")}
                className={cn(
                  "px-2.5 sm:px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer text-xs font-medium",
                  stageView === "whiteboard"
                    ? "bg-[#701a24]/40 text-[#fca5a5] border border-[#701a24] shadow-sm font-semibold"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Interactive Whiteboard"
              >
                <Presentation className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Whiteboard</span>
              </button>
              <button
                type="button"
                onClick={() => setStageView("graph")}
                className={cn(
                  "px-2.5 sm:px-3 py-1 rounded-md flex items-center gap-1.5 transition-all cursor-pointer text-xs font-medium",
                  stageView === "graph"
                    ? "bg-blue-950/60 text-blue-300 border border-blue-800/80 shadow-sm font-semibold"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Concept Knowledge Graph"
              >
                <Network className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Knowledge Graph</span>
                <span className="sm:hidden">Graph</span>
              </button>
            </div>

            {/* Audio Indicator */}
            {isPlayingAudio && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                <Volume2 className="w-3 h-3 animate-pulse" />
                <span className="hidden sm:inline">AI Speaking</span>
              </div>
            )}

            {/* Lecture Status Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400">
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

        {/* Top/Center Stage: Prominent Container for 3D Robot, WhiteboardCanvas, OR KnowledgeGraphView */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-3 min-h-0 overflow-hidden bg-gradient-to-b from-neutral-950 via-[#0a0a0a] to-[#0a0a0a]">
          {stageView === "robot" ? (
            /* 3D Canvas Avatar with unified, minimal luxury subtitle overlay */
            <div className="relative w-full h-full max-h-[460px] flex items-center justify-center pointer-events-auto">
              <RobotCompanionWrapper
                isFast={isSpeaking || isAnsweringQuery}
                externalSubtitle={currentLiveSubtitle}
                isExternalPlaying={isSpeakingOrPlaying}
                onIntroPlay={handleIntroPlay}
                stopIntroSignal={stopIntroSignal}
              />
            </div>
          ) : stageView === "whiteboard" ? (
            /* Whiteboard View: Active Whiteboard Canvas with interactive drawing tools */
            <div className="relative w-full h-full min-h-0 overflow-hidden rounded-xl border border-neutral-800 bg-[#0d0d10] flex flex-col">
              {/* Mini Whiteboard Floating Controls */}
              <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 p-1 bg-neutral-900/90 backdrop-blur-md rounded-xl border border-neutral-800 shadow-xl">
                <button
                  type="button"
                  onClick={() => setWhiteboardTool("pen")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                    whiteboardTool === "pen" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
                  )}
                  title="Pen Tool"
                >
                  <PenTool className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setWhiteboardTool("select")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                    whiteboardTool === "select" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
                  )}
                  title="Select Tool"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setWhiteboardTool("rectangle")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                    whiteboardTool === "rectangle" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
                  )}
                  title="Rectangle"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setWhiteboardTool("circle")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                    whiteboardTool === "circle" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
                  )}
                  title="Circle"
                >
                  <Circle className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setWhiteboardTool("eraser")}
                  className={cn(
                    "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                    whiteboardTool === "eraser" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
                  )}
                  title="Eraser"
                >
                  <Eraser className="w-3.5 h-3.5" />
                </button>
                <div className="h-4 w-[1px] bg-neutral-800 mx-0.5" />
                <button
                  type="button"
                  onClick={() => setWhiteboardObjects([])}
                  className="p-1.5 rounded-lg text-xs text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Clear Canvas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <WhiteboardCanvas
                objects={whiteboardObjects}
                setObjects={setWhiteboardObjects}
                activeTool={whiteboardTool}
                setActiveTool={setWhiteboardTool}
                strokeColor={whiteboardColor}
                strokeWidth={whiteboardWidth}
                viewport={whiteboardViewport}
                setViewport={setWhiteboardViewport}
                selectedId={selectedObjectId}
                setSelectedId={setSelectedObjectId}
                onCommitAction={(newObjs) => setWhiteboardObjects(newObjs)}
                hideFloatingBadge={true}
              />
            </div>
          ) : (
            /* Knowledge Graph View: Interactive Concept Map & Blindspot Detection */
            <div className="relative w-full h-full min-h-0 overflow-hidden rounded-xl border border-neutral-800 bg-[#09090b] flex flex-col">
              <KnowledgeGraphView
                lectureId={lectureId || 1}
                onJumpToTimestamp={jumpToPhaseTimestamp}
                onAskTutor={handleAskTutorAboutConcept}
                className="w-full h-full"
              />
            </div>
          )}
        </div>

        {/* Action Buttons: Horizontal row of four stylized buttons */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-[#0a0a0a] shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-4xl mx-auto">
            {/* Action 1: Explain Again */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={handleExplainAgain}
              className={cn(
                "p-2.5 rounded-xl border text-xs font-medium tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-colors",
                isAlternativeView
                  ? "bg-[#701a24]/30 border-[#701a24]/60 text-stone-200"
                  : "bg-neutral-900/70 hover:bg-neutral-800 border-neutral-800 text-neutral-200"
              )}
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
              <span>Explain Again</span>
            </motion.button>

            {/* Action 2: Quiz Me */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={handleToggleQuiz}
              className={cn(
                "p-2.5 rounded-xl border text-xs font-medium tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-colors",
                isQuizMode
                  ? "bg-amber-950/50 border-amber-500/50 text-amber-200 font-semibold"
                  : "bg-neutral-900/70 hover:bg-neutral-800 border-neutral-800 text-neutral-200"
              )}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Quiz Me</span>
            </motion.button>

            {/* Action 3: Show Source */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={handleToggleSourceDrawer}
              className={cn(
                "p-2.5 rounded-xl border text-xs font-medium tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-colors",
                isSourceDrawerOpen
                  ? "bg-neutral-800 border-neutral-700 text-neutral-100 font-semibold"
                  : "bg-neutral-900/70 hover:bg-neutral-800 border-neutral-800 text-neutral-200"
              )}
            >
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span>Show Source</span>
            </motion.button>

            {/* Action 4: Next Phase */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={handleNextPhase}
              className="p-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold tracking-tight flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <span>Next Phase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* 2. Custom Luxury Dark Audio Player matching site theme */}
        <div className="border-t border-neutral-800 bg-[#0a0a0a] shrink-0">
          {/* Permanently mounted HTML5 Audio Element so playback continues uninterrupted when drawer collapses or expands */}
          <audio
            ref={lectureAudioRef}
            src={lectureId ? api.getLectureStreamUrl(lectureId) : "/test-audio.mp4"}
            preload="metadata"
            onTimeUpdate={() => {
              if (lectureAudioRef.current) {
                setAudioCurrentTime(lectureAudioRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (
                lectureAudioRef.current &&
                !isNaN(lectureAudioRef.current.duration) &&
                lectureAudioRef.current.duration > 0
              ) {
                setAudioDuration(lectureAudioRef.current.duration);
              }
            }}
            onDurationChange={() => {
              if (
                lectureAudioRef.current &&
                !isNaN(lectureAudioRef.current.duration) &&
                lectureAudioRef.current.duration > 0
              ) {
                setAudioDuration(lectureAudioRef.current.duration);
              }
            }}
            onPlay={() => setIsAudioPlaying(true)}
            onPause={() => setIsAudioPlaying(false)}
            onEnded={() => {
              setIsAudioPlaying(false);
              setAudioCurrentTime(0);
            }}
            onError={() => {
              console.warn("Lecture stream error, falling back to /test-audio.mp4");
              if (lectureAudioRef.current && !lectureAudioRef.current.src.includes("test-audio.mp4")) {
                lectureAudioRef.current.src = "/test-audio.mp4";
                lectureAudioRef.current.load();
              }
            }}
          />

          {/* Audio Bar Header / Collapsed Controls with mini Play/Pause */}
          <div
            onClick={handleToggleSourceDrawer}
            className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer bg-neutral-950/60 hover:bg-neutral-900/50 select-none border-b border-neutral-900/40"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Mini Play/Pause button that works directly while collapsed */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAudioPlay();
                }}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm shrink-0",
                  isAudioPlaying
                    ? "bg-[#701a24] hover:bg-[#881337] text-white ring-1 ring-[#881337]/50"
                    : "bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white"
                )}
                title={isAudioPlaying ? "Pause Lecture Audio" : "Play Lecture Audio"}
              >
                {isAudioPlaying ? (
                  <Pause className="w-3 h-3 fill-white text-white" />
                ) : (
                  <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                )}
              </motion.button>

              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-colors shrink-0",
                  isAudioPlaying ? "bg-emerald-400 animate-pulse" : "bg-[#701a24]"
                )}
              />
              <Volume2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="font-medium text-neutral-300 truncate">
                Audio bar to listen to source lecture
              </span>
              <span className="text-[10px] font-mono text-neutral-500 shrink-0 hidden sm:inline">
                ({formatSeconds(audioCurrentTime)} / {formatSeconds(audioDuration || currentPhase.durationSec)})
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-neutral-400 shrink-0">
              <span className="text-[11px] font-mono">
                {isSourceDrawerOpen ? "Collapse" : "Expand"}
              </span>
              {isSourceDrawerOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {isSourceDrawerOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden border-t border-neutral-800/80 px-6 py-3.5 bg-neutral-950/95 space-y-3 shadow-2xl"
              >

                {/* Custom Luxury Dark Audio Player Toolbar */}
                <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800/80 backdrop-blur-md">
                  {/* Play / Pause Toggle Button */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={toggleAudioPlay}
                    className="h-9 w-9 rounded-lg bg-[#701a24] hover:bg-[#881337] text-white flex items-center justify-center cursor-pointer transition-all shadow-md shrink-0"
                    title={isAudioPlaying ? "Pause Audio" : "Play Audio"}
                  >
                    {isAudioPlaying ? (
                      <Pause className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    )}
                  </motion.button>

                  {/* Skip Buttons (-10s / +10s) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => skipAudio(-10)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70 transition-colors cursor-pointer"
                      title="Rewind 10 seconds"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => skipAudio(10)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/70 transition-colors cursor-pointer"
                      title="Fast Forward 10 seconds"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Interactive Scrub Bar / Timeline */}
                  <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                    <div
                      ref={scrubBarRef}
                      onClick={handleScrubClick}
                      className="relative w-full h-2 rounded-full bg-neutral-800/90 hover:h-2.5 cursor-pointer transition-all overflow-hidden group"
                      title="Click or drag to seek"
                    >
                      {/* Played Track in Brand Burgundy */}
                      <div
                        className="h-full bg-gradient-to-r from-[#701a24] to-[#991b1b] rounded-full transition-all duration-75 relative"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              (audioCurrentTime / (audioDuration || currentPhase.durationSec || 255)) * 100
                            )
                          )}%`,
                        }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 shadow-sm" />
                      </div>
                    </div>

                    {/* Time labels below track */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                      <span className="text-neutral-400">{formatSeconds(audioCurrentTime)}</span>
                      <span>{formatSeconds(audioDuration || currentPhase.durationSec || 255)}</span>
                    </div>
                  </div>

                  {/* Volume Control */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="text-neutral-400 hover:text-neutral-200 p-1 rounded transition-colors cursor-pointer"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted || audioVolume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
                      ) : audioVolume < 0.5 ? (
                        <Volume1 className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : audioVolume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-[#701a24]"
                      title={`Volume: ${Math.round((isMuted ? 0 : audioVolume) * 100)}%`}
                    />
                  </div>

                  {/* Playback Speed Pill Selector */}
                  <button
                    type="button"
                    onClick={cyclePlaybackRate}
                    className="px-2 py-1 rounded-md bg-neutral-800/80 hover:bg-neutral-800 text-[10px] font-mono text-neutral-300 hover:text-white border border-neutral-700/50 transition-colors shrink-0 cursor-pointer"
                    title="Cycle Playback Speed"
                  >
                    {playbackRate}x
                  </button>
                </div>

                {/* Live Synchronized Transcript Banner */}
                <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col gap-1.5 shadow-inner">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 font-semibold tracking-wider">
                      {isAudioPlaying ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Radio className="w-3 h-3 text-emerald-400" />
                            LIVE AUDIO TRANSCRIPTION
                          </span>
                        </>
                      ) : (
                        <span className="text-neutral-400 flex items-center gap-1">
                          <Radio className="w-3 h-3 text-neutral-500" />
                          AUDIO TRANSCRIPTION
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-neutral-400">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-300 font-mono">
                        {formatSeconds(activeSegment.start)} - {formatSeconds(activeSegment.end || activeSegment.start + 10)}
                      </span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Verified Source
                      </span>
                    </div>
                  </div>

                  {/* Active Spoken Text Highlight */}
                  <div className="flex items-start gap-2 pt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-[#701a24]/30 border border-[#701a24]/60 text-[#fca5a5] text-[10px] font-mono font-medium shrink-0">
                      {activeSegment.speaker || currentPhase.speaker || "Speaker"}
                    </span>
                    <p className="text-xs sm:text-sm text-neutral-100 font-normal leading-snug">
                      &quot;{activeSegment.text || currentPhase.transcriptQuote}&quot;
                    </p>
                  </div>
                </div>

                {/* Interactive Synchronized Timeline Transcript Chunks */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 px-1">
                    <span>Synchronized Lecture Chunks ({activeTranscripts.length})</span>
                    <span className="text-neutral-400">Click any chunk to jump audio</span>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-left scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                    {activeTranscripts.map((seg, idx) => {
                      const isCurrent = activeSegment?.start === seg.start;
                      return (
                        <button
                          key={`transcript-${seg.start}-${idx}`}
                          ref={isCurrent ? activeTranscriptRef : null}
                          type="button"
                          onClick={() => jumpToPhaseTimestamp(seg.start)}
                          className={cn(
                            "w-full text-left p-2 rounded-lg text-xs transition-all flex items-start gap-2.5 border cursor-pointer",
                            isCurrent
                              ? "bg-[#701a24]/20 border-[#701a24]/80 text-white shadow-md shadow-[#701a24]/10 ring-1 ring-[#701a24]/40"
                              : "bg-neutral-900/40 hover:bg-neutral-900/90 border-neutral-800/60 text-neutral-400 hover:text-neutral-200"
                          )}
                        >
                          <div className="shrink-0 flex flex-col items-start gap-0.5 font-mono text-[10px]">
                            <span className={cn("px-1.5 py-0.5 rounded", isCurrent ? "bg-[#701a24] text-white font-bold" : "bg-neutral-800/80 text-neutral-400")}>
                              {formatSeconds(seg.start)}
                            </span>
                            {isCurrent && (
                              <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider pl-0.5">
                                Spoken Now
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-mono text-neutral-500 font-semibold mr-1.5">
                              [{seg.speaker || "Instructor"}]:
                            </span>
                            <span className={cn("text-xs leading-relaxed", isCurrent ? "text-neutral-100 font-medium" : "text-neutral-300")}>
                              {seg.text}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* =====================================================================
          3. Right Column: Learning Tools (Fixed width, w-96/w-[420px], Tabs + Content)
          ===================================================================== */}
      <div className="w-96 xl:w-[420px] shrink-0 flex flex-col h-full bg-[#0a0a0a] overflow-hidden z-20">
        {/* Top Tabs: Horizontal 3-tab navigation bar ("Notes", "Learning plan", "Summary") */}
        <div className="h-12 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0 bg-[#0a0a0a]">
          <div className="flex items-center gap-1 w-full bg-neutral-900/60 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setActiveTab("notes")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all text-center cursor-pointer",
                activeTab === "notes"
                  ? "bg-neutral-800 text-white shadow-sm font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              Notes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("plan")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all text-center cursor-pointer",
                activeTab === "plan"
                  ? "bg-neutral-800 text-white shadow-sm font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              Learning plan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all text-center cursor-pointer",
                activeTab === "summary"
                  ? "bg-neutral-800 text-white shadow-sm font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              Summary
            </button>
          </div>
        </div>

        {/* Content Area: Container rendering selected tab content */}
        <div
          className={cn(
            "flex-1 min-h-0",
            activeTab === "notes" ? "h-full w-full flex flex-col overflow-hidden" : "overflow-y-auto p-5 space-y-6"
          )}
        >
          {/* TAB 1: FUNCTIONAL NOTES TAB (Working Text Editor with full height & width) */}
          {activeTab === "notes" && (
            <div className="h-full w-full flex-1 flex flex-col min-h-0">
              {isQuizMode ? (
                /* Diagnostic Quiz Check if triggered */
                <div className="p-4 space-y-4 overflow-y-auto">
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pb-2 border-b border-neutral-800">
                    <span>Diagnostic Knowledge Check</span>
                    <button
                      type="button"
                      onClick={() => setIsQuizMode(false)}
                      className="hover:text-white transition-colors cursor-pointer text-xs"
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
                </div>
              ) : (
                /* Interactive AI-Assisted Text Editor */
                <div className="h-full w-full flex-1 flex flex-col min-h-0 relative">
                  {/* Action Header above textarea */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800/80 bg-neutral-950/40 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-neutral-400">Notes</span>
                      {isGeneratingNotes && (
                        <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                          </span>
                          Streaming...
                        </span>
                      )}
                    </div>

                    {/* Small, sleek "✨ Generate Smart Notes" Button */}
                    <motion.button
                      type="button"
                      whileTap={!isGeneratingNotes ? { scale: 0.96 } : undefined}
                      onClick={handleGenerateSmartNotes}
                      disabled={isGeneratingNotes}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm border",
                        isGeneratingNotes
                          ? "bg-neutral-900 border-neutral-800 text-neutral-500 cursor-not-allowed"
                          : "bg-[#701a24] hover:bg-[#881337] border-[#881337] text-white hover:shadow-md hover:shadow-[#701a24]/30 cursor-pointer"
                      )}
                      title={isGeneratingNotes ? "Generating smart notes..." : "Generate Smart Notes"}
                    >
                      {isGeneratingNotes ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>✨ Generate Smart Notes</span>
                      )}
                    </motion.button>
                  </div>

                  {/* Textarea taking up the full space of the tab */}
                  <div className="flex-1 min-h-0 w-full relative">
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Take notes on this phase here..."
                      className="w-full h-full resize-none bg-transparent text-gray-200 outline-none p-4 font-mono text-xs sm:text-sm leading-relaxed"
                      spellCheck={false}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LEARNING PLAN */}
          {activeTab === "plan" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-[#701a24]" />
                  <span className="text-xs font-semibold text-neutral-200">
                    Curriculum Roadmap
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">
                  {phasesList.length} Phases Total
                </span>
              </div>

              <div className="space-y-3">
                {phasesList.map((p, idx) => {
                  const isCurrent = idx === currentPhaseIndex;
                  const isCompleted = idx < currentPhaseIndex;

                  return (
                    <motion.div
                      key={p.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePhaseChange(idx)}
                      className={cn(
                        "p-4 rounded-xl border text-xs transition-all cursor-pointer relative overflow-hidden",
                        isCurrent
                          ? "bg-neutral-900 border-[#701a24] shadow-md ring-1 ring-[#701a24]/50"
                          : isCompleted
                          ? "bg-neutral-900/30 border-neutral-800 hover:border-neutral-700 opacity-80"
                          : "bg-neutral-900/20 border-neutral-800/80 hover:border-neutral-700 opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-5 w-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold",
                              isCurrent
                                ? "bg-[#701a24] text-white"
                                : isCompleted
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                                : "bg-neutral-800 text-neutral-400"
                            )}
                          >
                            {isCompleted ? "✓" : idx + 1}
                          </span>
                          <span className="font-semibold text-neutral-200 text-xs truncate max-w-[200px]">
                            {p.title.replace(/^\d+\.\s*/, "")}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-neutral-500">
                          {p.duration}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-400 leading-relaxed pl-7">
                        {p.subtitle}
                      </p>

                      <div className="flex items-center gap-3 pl-7 pt-2 text-[10px] font-mono text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {p.timestamp}
                        </span>
                        {isCurrent && (
                          <span className="text-emerald-400 font-semibold">
                            ● Active Phase
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-neutral-400">
                            Completed
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#701a24]" />
                  <span className="text-xs font-semibold text-neutral-200">
                    Executive Summary & Takeaways
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">
                  AI Generated
                </span>
              </div>

              {/* Lecture Overview Card */}
              <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block font-semibold">
                  Lecture Synthesis
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  This session breaks down how decentralized price signals dynamically clear competitive markets, why elasticity dictates the economic incidence of exogenous shocks, and how artificial price wedges generate allocative deadweight loss.
                </p>
              </div>

              {/* Core High-Yield Takeaways */}
              <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block font-semibold">
                  Key Insights
                </span>
                <ul className="space-y-2 text-xs text-neutral-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                    <span>Market clearance is dynamic, governed by price signals that balance marginal willingness to pay against marginal cost.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                    <span>When PED &gt; 1, price increases contract aggregate revenue due to disproportionate volume reduction.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">•</span>
                    <span>Inelastic market sides bear the true economic burden of taxes and regulatory shocks regardless of statutory designation.</span>
                  </li>
                </ul>
              </div>

              {/* Identified Blindspots / Knowledge Gaps */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Detected Knowledge Blindspots</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Concepts mentioned during the lecture that lacked complete formal proofs:
                </p>
                <div className="space-y-1.5 text-[11px] font-mono text-neutral-400">
                  <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80">
                    <span className="text-amber-300 block font-semibold mb-0.5">
                      1. Cobweb Theorem Latency @ 07:14
                    </span>
                    <span>Cyclical price oscillations arising when producers make output decisions based on lagged prices.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80">
                    <span className="text-amber-300 block font-semibold mb-0.5">
                      2. Giffen Good Substitution Limits @ 18:42
                    </span>
                    <span>Extreme non-substitutability causing positive sloping demand curve.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
