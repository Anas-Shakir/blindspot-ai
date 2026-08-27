"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ArrowUp } from "lucide-react";

export const CTASection: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="relative py-24 sm:py-32 w-full overflow-hidden border-t border-white/[0.07] bg-gradient-to-b from-[#09090b] via-[#09090b] to-[#09090b]">
      {/* Glow highlight */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#701a24]/12 blur-[140px] rounded-full" />

      <div className="max-w-5xl mx-auto px-6 sm:px-8 relative z-10 text-center flex flex-col items-center">
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-2xl leading-tight mb-6"
        >
          Stop scrubbing through 50-minute recordings blind.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-base sm:text-lg text-neutral-400 max-w-xl mb-10 leading-relaxed font-normal tracking-tight"
        >
          Upload your first lecture recording today. Get phase-by-phase active teaching, concept gap discovery, and verifiable source timestamps.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-neutral-950 hover:bg-neutral-200 text-sm font-semibold tracking-tight transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)] cursor-pointer"
          >
            <span>Drop a lecture now</span>
            <ArrowUp className="w-4 h-4" />
          </motion.button>

          <motion.a
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-white hover:bg-white/[0.08] text-sm font-medium tracking-tight transition-colors"
          >
            <span>View Architecture Blueprint</span>
            <ArrowRight className="w-4 h-4 text-neutral-400" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

