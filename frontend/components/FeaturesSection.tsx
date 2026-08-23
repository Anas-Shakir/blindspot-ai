"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Compass,
  Link as LinkIcon,
  Network,
  Headphones,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Compass,
    badge: "Pedagogical Planning",
    title: "Re-engineered for learning, not just summarized",
    description:
      "Lectures are linear, unedited recordings. Blindspot AI's planner restructures 50-minute monologues into coherent, progressive learning phases with clear pedagogical goals.",
    stat: "100% structured",
  },
  {
    icon: LinkIcon,
    badge: "Timestamp Traceability",
    title: "Every taught concept comes with source receipts",
    description:
      "Never wonder if the AI made it up. Ask 'Where did the professor say that?' and instantly jump to the exact second in the original recording with high-precision alignment.",
    stat: "<0.1s precision",
  },
  {
    icon: Network,
    badge: "Blindspot Graph",
    title: "Surfaces the gaps the lecture left behind",
    description:
      "When an instructor skips prerequisites or assumes prior knowledge, Blindspot autonomously identifies the under-explained concepts and constructs an interactive concept graph.",
    stat: "Automated graph",
  },
  {
    icon: Headphones,
    badge: "Voice-Based Office Hours",
    title: "An active TA you can interrupt and quiz with",
    description:
      "Learn phase-by-phase with a conversational voice agent. Ask for deeper explanations, request analogies, or launch instant diagnostic MCQ quizzes anytime.",
    stat: "Real-time voice",
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="relative py-24 sm:py-32 w-full">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Why Blindspot AI</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-2xl leading-tight mb-4"
          >
            Recorded lectures are not the same as{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              being taught.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-neutral-400 max-w-xl font-normal leading-relaxed tracking-tight"
          >
            Blindspot transforms passive audio into an interactive, verifiable
            educational experience tailored to how your brain retains knowledge.
          </motion.p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {features.map((item, idx) => (
            <motion.div
              key={item.badge}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={cn(
                "group relative rounded-3xl p-8 sm:p-10",
                "bg-neutral-900/40 border border-white/[0.07] backdrop-blur-md",
                "hover:border-blue-500/30 hover:bg-neutral-900/60 transition-all duration-300",
                "shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_0_50px_-10px_rgba(59,130,246,0.15)]",
                "overflow-hidden flex flex-col justify-between"
              )}
            >
              {/* Subtle card hover glow */}
              <div className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(400px_circle_at_top_right,rgba(59,130,246,0.08),transparent_80%)]" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform duration-300">
                    <item.icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">
                    {item.stat}
                  </span>
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2 block">
                  {item.badge}
                </span>

                <h3 className="text-xl font-bold tracking-tight text-white mb-3">
                  {item.title}
                </h3>

                <p className="text-sm text-neutral-400 leading-relaxed tracking-tight font-normal">
                  {item.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.05] flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span className="group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Built into core engine
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

