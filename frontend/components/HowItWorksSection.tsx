"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cpu, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    step: "01",
    title: "Ingest Lecture Audio",
    subtitle: "Raw Audio → Timestamped Ground Truth",
    description:
      "Drop any 50-minute classroom recording or paste a Zoom link. Blindspot parses speech audio with high-precision word-level alignment.",
    tag: "Multi-format Support",
  },
  {
    step: "02",
    title: "Synthesize & Plan",
    subtitle: "AI Teacher Architecture",
    description:
      "Our planning engine reorganizes unstructured lecture monologue into digestible teaching phases and identifies gaps where the instructor skipped prerequisite steps.",
    tag: "Concept Graph Extraction",
  },
  {
    step: "03",
    title: "Active Learning & Receipts",
    subtitle: "Voice Delivery + Source Verification",
    description:
      "Listen, interrupt, and ask clarifying questions. If you ever doubt a claim, jump directly to that exact second in the original audio.",
    tag: "Instant Timestamp Seek",
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 w-full border-t border-white/[0.06] bg-neutral-950/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4"
          >
            <Cpu className="w-3 h-3 text-blue-400" />
            <span>The Learning Pipeline</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-2xl leading-tight mb-4"
          >
            From passive audio to an active masterclass in three steps.
          </motion.h2>

          <p className="text-base sm:text-lg text-neutral-400 max-w-xl font-normal leading-relaxed tracking-tight">
            Designed to turn confusing, rushed lectures into structured clarity you can actually retain.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className={cn(
                "relative rounded-3xl p-8 bg-neutral-900/40 border border-white/[0.08] backdrop-blur-md",
                "flex flex-col justify-between hover:border-blue-500/30 transition-all duration-300",
                "shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-2xl font-bold text-blue-400/90 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-xl">
                    {item.step}
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
                    {item.tag}
                  </span>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-white mb-1.5">
                  {item.title}
                </h3>
                <h4 className="text-xs font-medium text-blue-400/80 mb-4 tracking-tight">
                  {item.subtitle}
                </h4>

                <p className="text-sm text-neutral-400 leading-relaxed font-normal tracking-tight">
                  {item.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/[0.05] flex items-center text-xs text-neutral-500 gap-2">
                <Check className="w-3.5 h-3.5 text-blue-400" />
                <span>Autonomous orchestration</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

