"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Bookmark,
  Sparkles,
  ExternalLink,
  Network,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const InteractivePlayerPreview: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<"teach" | "receipts" | "graph">("teach");
  const [activeTimestamp, setActiveTimestamp] = useState<string>("14:22");

  const phases = [
    {
      id: 1,
      title: "1. Intuition of Gradient Descent",
      duration: "04:15",
      active: true,
      timestamp: "03:12",
    },
    {
      id: 2,
      title: "2. The Learning Rate Hyperparameter",
      duration: "06:40",
      active: false,
      timestamp: "14:22",
    },
    {
      id: 3,
      title: "3. Convex vs Non-Convex Surfaces",
      duration: "08:10",
      active: false,
      timestamp: "23:45",
    },
    {
      id: 4,
      title: "4. Backpropagation & The Chain Rule",
      duration: "09:30",
      active: false,
      timestamp: "38:10",
    },
  ];

  return (
    <section id="traceability" className="relative py-24 sm:py-32 w-full border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
            <Bookmark className="w-3 h-3 text-blue-400" />
            <span>Interactive Pedagogical Interface</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-2xl leading-tight mb-4">
            Your lecture recording, taught properly —{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              with receipts.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-neutral-400 max-w-xl font-normal leading-relaxed tracking-tight">
            Seamlessly toggle between conversational voice teaching, verifiable lecture timestamps, and the autonomous concept graph.
          </p>
        </div>

        {/* Mock Application Interface Container */}
        <div className="relative rounded-3xl bg-neutral-900/60 border border-white/[0.08] shadow-[0_20px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden p-4 sm:p-8">
          
          {/* Top App Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                  Session Active
                </span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-white">
                CS229: Machine Learning — Lecture 4: Convex Optimization &amp; Gradients
              </h3>
            </div>

            {/* Tab switchers */}
            <div className="flex items-center gap-1.5 bg-neutral-950/80 p-1 rounded-xl border border-white/[0.08]">
              <button
                onClick={() => setActiveTab("teach")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer",
                  activeTab === "teach"
                    ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                Voice Tutor
              </button>
              <button
                onClick={() => setActiveTab("receipts")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer",
                  activeTab === "receipts"
                    ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                Source Receipts
              </button>
              <button
                onClick={() => setActiveTab("graph")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer",
                  activeTab === "graph"
                    ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                Blindspot Graph
              </button>
            </div>
          </div>

          {/* Main App Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
            
            {/* Left: Phase Navigator */}
            <div className="lg:col-span-4 flex flex-col gap-2.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-1">
                Learning Roadmap (4 Phases)
              </span>
              {phases.map((phase) => (
                <div
                  key={phase.id}
                  onClick={() => setActiveTimestamp(phase.timestamp)}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                    activeTimestamp === phase.timestamp
                      ? "bg-blue-500/10 border-blue-500/40 text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                      : "bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200"
                  )}
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold tracking-tight">
                      {phase.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Source timestamp: {phase.timestamp}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {phase.duration}
                  </span>
                </div>
              ))}
            </div>

            {/* Right: Dynamic Interactive Content Area */}
            <div className="lg:col-span-8 rounded-2xl bg-neutral-950/70 border border-white/[0.08] p-6 flex flex-col justify-between min-h-[320px]">
              <AnimatePresence mode="wait">
                {activeTab === "teach" && (
                  <motion.div
                    key="tab-teach"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col justify-between h-full"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-xs font-bold text-white tracking-tight">
                            Voice Teaching Assistant
                          </span>
                        </div>
                        <span className="text-xs text-blue-400 font-mono">Phase 2 / 4</span>
                      </div>

                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-xs text-neutral-300 leading-relaxed font-normal mb-4">
                        <p className="mb-2">
                          <strong className="text-white font-semibold">Tutor Script: </strong>
                          &quot;Think of the learning rate alpha (α) like the step size you take while descending a foggy mountain. If your steps are too large, you will overshoot the valley minimum completely. If too small, you&apos;ll take millions of iterations to make progress.&quot;
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => setActiveTab("receipts")}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg hover:bg-blue-500/20 transition-colors cursor-pointer"
                          >
                            <span>Verify: Professor audio at {activeTimestamp}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Audio Player Controls */}
                    <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all active:scale-95 cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-white">Interactive Audio Engine</span>
                          <span className="text-[10px] font-mono text-neutral-400">01:45 / 06:40</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-xs font-medium text-neutral-300 transition-colors">
                          Explain Again
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-xs font-medium text-blue-400 border border-blue-500/20 transition-colors">
                          Quiz Me (MCQ)
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "receipts" && (
                  <motion.div
                    key="tab-receipts"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col h-full justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Source Timestamp Traceability (Receipt #{activeTimestamp})
                        </span>
                        <span className="text-[11px] font-mono text-neutral-400">Similarity: 98.4%</span>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 text-xs text-neutral-300 leading-relaxed font-mono mb-4">
                        <p className="text-blue-300 font-semibold mb-1">
                          [14:20 - 14:38] Prof. Andrew Ng:
                        </p>
                        <p className="text-neutral-200">
                          &quot;...so if alpha is too small, gradient descent can be slow. But if alpha is too large, it can overshoot the minimum and may fail to converge, or even diverge.&quot;
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-400 flex items-center justify-between pt-4 border-t border-white/[0.06]">
                      <span>Original Audio Chunk ID: #chunk-882</span>
                      <span className="text-blue-400">Timestamp linked directly to raw audio recording</span>
                    </div>
                  </motion.div>
                )}

                {activeTab === "graph" && (
                  <motion.div
                    key="tab-graph"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col h-full justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                          <Network className="w-4 h-4 text-blue-400" />
                          Autonomous Concept Graph &amp; Gap Detection
                        </span>
                        <span className="text-[11px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                          1 Blindspot Detected
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                          <span className="text-xs font-bold text-white block">Loss Function</span>
                          <span className="text-[10px] text-emerald-400">Taught thoroughly</span>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                          <span className="text-xs font-bold text-blue-300 block">Learning Rate Alpha (α)</span>
                          <span className="text-[10px] text-blue-400">Current Phase</span>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                          <span className="text-xs font-bold text-amber-300 block">Matrix Calculus</span>
                          <span className="text-[10px] text-amber-400">Instructor Skipped (Gap)</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-400 pt-3 border-t border-white/[0.06]">
                      Blindspot AI bridges conceptual gaps by auto-generating primer notes for prerequisites skipped by the speaker.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractivePlayerPreview;

