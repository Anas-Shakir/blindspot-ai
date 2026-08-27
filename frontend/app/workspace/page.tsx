"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
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

const phases: PhaseData[] = [
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
  {
    id: 2,
    title: "2. Price Elasticity of Demand (PED)",
    subtitle: "Quantifying behavioral consumer sensitivity to price variations.",
    timestamp: "14:22",
    duration: "06:40",
    durationSec: 400,
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
    mentalModels: [
      {
        number: "01",
        title: "Welfare triangle geometry",
        description:
          "Deadweight loss represents the economic value of transactions where buyer willingness-to-pay exceeds seller marginal cost, yet the trade fails to occur.",
      },
      {
        number: "02",
        title: "Economic incidence independence",
        description:
          "The true burden of market intervention is dictated by relative elasticities between buyers and sellers, regardless of statutory tax assignment.",
      },
      {
        number: "03",
        title: "Pareto efficiency frontier",
        description:
          "An unfettered competitive equilibrium maximizes the sum of consumer and producer surplus with zero artificial deadweight.",
      },
    ],
    speechText:
      "Deadweight loss represents lost economic value: potential transactions that would benefit both parties are blocked by market frictions.",
    alternativeSpeechText:
      "If a buyer values a book at $30 and a seller is willing at $20, a $15 fee prevents the sale entirely, evaporating $10 of potential gains.",
    transcriptQuote:
      "...the deadweight loss triangle is essentially lost social welfare—transactions that would have made both parties better off are blocked.",
    speaker: "Prof. Sterling",
    quiz: {
      question:
        "What fundamentally causes deadweight loss following an artificial market distortion?",
      options: [
        { id: "a", text: "Preventing mutually beneficial trades where marginal value exceeds marginal cost." },
        { id: "b", text: "Government tax revenue exceeding total producer surplus." },
        { id: "c", text: "A temporary accumulation of physical inventory in storage facilities." },
        { id: "d", text: "Suppliers voluntarily lowering production below baseline fixed costs." },
      ],
      correctId: "a",
      explanation:
        "Deadweight loss occurs when market frictions or price controls prevent trades where the buyer's valuation exceeds the seller's cost of production.",
    },
  },
];

export default function WorkspacePage() {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isAlternativeView, setIsAlternativeView] = useState<boolean>(false);
  const [isSourceDrawerOpen, setIsSourceDrawerOpen] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playbackSeconds, setPlaybackSeconds] = useState<number>(0);

  // User question / query state
  const [userQuery, setUserQuery] = useState<string>("");
  const [customResponse, setCustomResponse] = useState<string | null>(null);
  const [isAnsweringQuery, setIsAnsweringQuery] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentPhase = phases[currentPhaseIndex];

  // Simulated audio playback timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setPlaybackSeconds((prev) => {
          if (prev >= currentPhase.durationSec) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio, currentPhase.durationSec]);

  // When phase changes, reset states
  const handlePhaseChange = (newIndex: number) => {
    setCurrentPhaseIndex(newIndex);
    setIsQuizMode(false);
    setIsAlternativeView(false);
    setIsSpeaking(false);
    setPlaybackSeconds(0);
    setIsPlayingAudio(false);
    setCustomResponse(null);
    setUserQuery("");
  };

  const handleNextPhase = () => {
    if (currentPhaseIndex < phases.length - 1) {
      handlePhaseChange(currentPhaseIndex + 1);
    } else {
      handlePhaseChange(0);
    }
  };

  const handleExplainAgain = () => {
    setIsQuizMode(false);
    setIsAlternativeView((prev) => !prev);
    setCustomResponse(null);
  };

  const handleToggleQuiz = () => {
    setIsQuizMode((prev) => !prev);
  };

  const handleToggleSourceDrawer = () => {
    setIsSourceDrawerOpen((prev) => !prev);
  };

  // Handle user query submission to the robot companion
  const handleQuerySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = userQuery.trim();
    if (!query) return;

    setIsAnsweringQuery(true);
    setIsSpeaking(true);
    setIsQuizMode(false);

    setTimeout(() => {
      setIsAnsweringQuery(false);
      setIsSpeaking(false);

      const lower = query.toLowerCase();
      if (lower.includes("why") || lower.includes("reason")) {
        setCustomResponse(
          `Regarding "${query}": Price clearance coordinates decentralized actions by communicating scarcity signals without requiring a central planner.`
        );
      } else if (lower.includes("formula") || lower.includes("ped") || lower.includes("calculate")) {
        setCustomResponse(
          `The elasticity formula is %ΔQ / %ΔP. When absolute elasticity exceeds 1.0, demand is price-elastic; below 1.0, it is inelastic.`
        );
      } else if (lower.includes("example") || lower.includes("analogy") || lower.includes("simpler")) {
        setCustomResponse(
          `Everyday analogy: Concert tickets are elastic (fans skip if overpriced), while commuter transit is inelastic (riders must travel to work).`
        );
      } else {
        setCustomResponse(
          `Regarding "${query}": In ${currentPhase.title}, market forces act as an ongoing feedback loop aligning willingness-to-pay with production costs.`
        );
      }

      setUserQuery("");
    }, 1000);
  };

  const formatSeconds = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remaining.toString().padStart(2, "0")}`;
  };

  const progressPercentage = Math.min(
    100,
    (playbackSeconds / currentPhase.durationSec) * 100
  );

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    setPlaybackSeconds(Math.round(percentage * currentPhase.durationSec));
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-neutral-100 selection:bg-[#701a24]/40 selection:text-white overflow-hidden">
      {/* High-End Collapsible Sidebar */}
      <Sidebar />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* 1. Top Bar (Clean & Minimal) */}
        <header className="h-14 px-6 sm:px-8 border-b border-white/[0.07] flex items-center justify-between bg-[#09090b]/85 backdrop-blur-md sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>‹ Back to Ingestion</span>
            </Link>

            <div className="h-3 w-[1px] bg-white/[0.07]" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-200 tracking-tight">
                Blindspot // Dynamic Market Equilibria
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono text-neutral-500">
                ECON 101 • Lecture 04
              </span>
            </div>
          </div>

          {/* Minimal Phase Counter */}
          <span className="text-xs font-mono text-neutral-400">
            Phase {currentPhaseIndex + 1} of {phases.length}
          </span>
        </header>

        {/* 2. Main 60/40 Split Layout */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 w-full overflow-hidden">
          {/* Left Pane — The Teaching Canvas (60% Width, Scrollable) */}
          <section className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.07] overflow-y-auto">
          <AnimatePresence mode="wait">
            {!isQuizMode ? (
              /* State A: Active Teaching View */
              <motion.div
                key={`teaching-state-${currentPhaseIndex}`}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="flex flex-col flex-1"
              >
                {/* Clean Phase Title & Subtitle without pill badges */}
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-100 mb-2">
                    {currentPhase.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                    {currentPhase.subtitle}
                  </p>
                </div>

                {/* 3 Concise Mental Model Summary Points */}
                <div className="space-y-6 my-4 flex-1">
                  {currentPhase.mentalModels.map((model) => (
                    <motion.div
                      key={model.number}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-3.5"
                    >
                      <span className="font-mono text-xs font-semibold text-neutral-500 pt-0.5">
                        {model.number}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-xs sm:text-sm font-medium text-neutral-200 mb-1 tracking-tight">
                          {model.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed">
                          {model.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Collapsible Source Audio Drawer at Bottom */}
                <div className="mt-8 pt-4 border-t border-white/[0.07]">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={handleToggleSourceDrawer}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-900/90 border border-white/[0.07] text-xs transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-medium text-neutral-300">
                        Verified Source Lecture Ground Truth
                      </span>
                      <span className="font-mono text-[10px] text-neutral-500">
                        (Receipt @ {currentPhase.timestamp})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <span className="text-[11px] font-mono">
                        {isSourceDrawerOpen ? "Collapse" : "Expand"}
                      </span>
                      {isSourceDrawerOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </motion.button>

                  <AnimatePresence>
                    {isSourceDrawerOpen && (
                      <motion.div
                        layout
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
                              98.4% Confidence Timestamp Alignment
                            </span>
                            <span>Chunk #chunk-{currentPhase.id}42</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              /* State B: Quiz Mode View without pill badges */
              <motion.div
                key={`quiz-state-${currentPhaseIndex}`}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="flex flex-col flex-1 justify-center py-4"
              >
                <div className="mb-4 flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Diagnostic Check</span>
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

            {/* Clean Minimal Dialogue Box */}
            <motion.div
              layout
              key={`speech-${currentPhaseIndex}-${isQuizMode}-${isAlternativeView}-${customResponse}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full p-4 rounded-xl bg-zinc-900/60 border border-white/[0.07] text-xs sm:text-sm text-neutral-300 leading-relaxed shadow-sm mb-3"
            >
              <p>
                {customResponse
                  ? customResponse
                  : isQuizMode
                  ? "Test your understanding of this phase before moving forward."
                  : isAlternativeView
                  ? currentPhase.alternativeSpeechText
                  : currentPhase.speechText}
              </p>
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
                  userQuery.trim()
                    ? "bg-white text-neutral-950 hover:bg-neutral-200"
                    : "opacity-40 cursor-not-allowed"
                )}
                aria-label="Send question"
              >
                <ArrowRight className="w-3 h-3" />
              </motion.button>
            </form>
          </div>

          {/* Minimal Actions Dock directly below */}
          <div className="mt-6 pt-4 border-t border-white/[0.07]">
            {/* 2x2 High-Tactile Minimal Grid */}
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
                  {currentPhaseIndex < phases.length - 1
                    ? `Next Phase (${currentPhaseIndex + 2})`
                    : "Restart Demo"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}
