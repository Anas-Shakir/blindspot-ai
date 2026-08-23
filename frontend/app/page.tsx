"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  Compass,
  ShieldCheck,
  Network,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroDropzone from "@/components/HeroDropzone";
import RobotCompanionWrapper from "@/components/RobotCompanionWrapper";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import InteractivePlayerPreview from "@/components/InteractivePlayerPreview";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function BlindspotLandingPage() {
  const [isDropzoneActive, setIsDropzoneActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestedLecture, setIngestedLecture] = useState<{
    type: "file" | "url";
    name?: string;
    url?: string;
  } | null>(null);

  const handleFileSelect = (file: File) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIngestedLecture({
        type: "file",
        name: file.name,
      });
    }, 1200);
  };

  const handleUrlSubmit = (url: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIngestedLecture({
        type: "url",
        url: url,
      });
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07080a] text-neutral-100 selection:bg-blue-600/30 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Background ambient lighting and subtle micro-grid */}
      <div className="ambient-glow" />
      <div className="pointer-events-none fixed inset-0 bg-grid-pattern opacity-30 z-0" />

      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Hero-Input Section (The Split Layout) */}
      <section className="relative z-10 flex items-center max-w-7xl mx-auto w-full px-6 sm:px-8 pt-32 pb-20 lg:pt-36 lg:pb-28">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column (The Hook & Value Proposition) */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Luxury Pill Tag */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Your lecture recording, taught properly — with receipts</span>
            </motion.div>

            {/* Massive Bold Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-white leading-[1.1] mb-6"
            >
              Turn passive lecture recordings into an{" "}
              <span className="bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
                active private tutor.
              </span>
            </motion.h1>

            {/* Compelling Tagline & Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed tracking-tight max-w-lg mb-8"
            >
              Blindspot structures unedited lecture audio into guided learning
              phases, bridges explanatory gaps the professor skipped, and lets
              you verify every concept against the original timestamp.
            </motion.p>

            {/* Key Value Micro Bullets */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-white/[0.08] w-full"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-neutral-300 font-medium tracking-tight">
                  Pedagogical Plan
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-neutral-300 font-medium tracking-tight">
                  Source Receipts
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Network className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-neutral-300 font-medium tracking-tight">
                  Gap Discovery
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Column (The Action & 3D Robot Companion) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative w-full">
            {/* 3D Floating Robot AI Companion */}
            <div className="relative w-full h-[320px] sm:h-[360px] flex items-center justify-center -mb-10 sm:-mb-14 z-10 pointer-events-none">
              <RobotCompanionWrapper isFast={isDropzoneActive} />
            </div>

            {/* Frosted Glass Dropzone */}
            <div className="relative z-20 w-full max-w-md">
              <HeroDropzone
                onActiveStateChange={setIsDropzoneActive}
                onFileSelect={handleFileSelect}
                onUrlSubmit={handleUrlSubmit}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Feature Pillars Section */}
      <FeaturesSection />

      {/* 4. Step-by-Step Pipeline Section */}
      <HowItWorksSection />

      {/* 5. Interactive Pedagogical Interface Showcase */}
      <InteractivePlayerPreview />

      {/* 6. Bottom CTA */}
      <CTASection />

      {/* 7. Footer */}
      <Footer />

      {/* Toast Notification when Ingestion Queued */}
      <AnimatePresence>
        {ingestedLecture && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-neutral-900/95 border border-blue-500/40 px-5 py-3.5 shadow-[0_0_35px_rgba(59,130,246,0.3)] backdrop-blur-xl"
          >
            <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-white">Lecture queued for analysis: </span>
              <span className="text-neutral-400 font-mono">
                {ingestedLecture.type === "file"
                  ? ingestedLecture.name
                  : ingestedLecture.url}
              </span>
            </div>
            <button
              onClick={() => setIngestedLecture(null)}
              className="ml-3 text-[11px] text-neutral-500 hover:text-white transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
