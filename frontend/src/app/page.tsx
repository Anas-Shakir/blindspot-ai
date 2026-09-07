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
import Navbar from "@/components/common/Navbar";
import HeroDropzone from "@/components/landing/HeroDropzone";
import RobotCompanionWrapper from "@/components/player/RobotCompanionWrapper";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/common/Footer";
import GradientWaves from "@/components/landing/GradientWaves";
import { Button } from "@/components/ui/button";
import type { Lecture } from "@/lib/api";


export default function BlindspotLandingPage() {
  const [isDropzoneActive, setIsDropzoneActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestedLecture, setIngestedLecture] = useState<{
    type: "file" | "url";
    name?: string;
    url?: string;
  } | null>(null);

  const handleFileSelect = (file: File, lecture?: Lecture) => {
    setIngestedLecture({
      type: "file",
      name: lecture?.filename || file.name,
    });
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
    <div className="relative min-h-screen w-full bg-[#09090b] text-neutral-100 selection:bg-[#701a24]/40 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Dynamic Background GradientWaves from React Bits in Deep Oxblood Burgundy */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-85">
        <GradientWaves
          horizonColor="#09090b"
          waveColor="#701a24"
          crestColor="#881337"
          speed={0.35}
          amplitude={2.4}
          waveScale={0.6}
          waveRatio={0.9}
          swell={32}
          turbulence={18}
          tilt={1.11}
          zoom={1.0}
          height={5.0}
          fogDepth={18}
          detail="medium"
          brightness={0.88}
          opacity={0.85}
          mouseInteraction={true}
          parallaxStrength={0.4}
          grain={true}
          grainIntensity={0.03}
        />
      </div>

      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Hero-Input Section (The Split Layout) */}
      <section className="relative z-10 flex items-center max-w-7xl mx-auto w-full px-6 sm:px-8 pt-32 pb-20 lg:pt-36 lg:pb-28">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column (The Hook & Value Proposition) */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Massive Bold Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-white leading-[1.1] mb-6"
            >
              Turn passive lecture recordings into an{" "}
              <span className="bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent">
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
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-white/[0.07] w-full"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#701a24]/20 border border-[#701a24]/30 text-stone-200">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-neutral-300 font-medium tracking-tight">
                  Pedagogical Plan
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#701a24]/20 border border-[#701a24]/30 text-stone-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-neutral-300 font-medium tracking-tight">
                  Source Receipts
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#701a24]/20 border border-[#701a24]/30 text-stone-200">
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
            <div className="relative w-full h-[280px] sm:h-[320px] flex items-center justify-center mb-3 sm:mb-4 z-10 pointer-events-auto">
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

      {/* 5. Bottom CTA */}
      <CTASection />

      {/* 6. Footer */}
      <Footer />

      {/* Toast Notification when Ingestion Queued */}
      <AnimatePresence>
        {ingestedLecture && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg bg-neutral-900/95 border border-white/10 px-4 py-3 shadow-[0_0_30px_rgba(112,26,36,0.25)] backdrop-blur-xl"
          >
            <CheckCircle2 className="h-4 w-4 text-rose-300 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-medium text-neutral-200">Lecture queued for analysis: </span>
              <span className="text-neutral-400 font-mono">
                {ingestedLecture.type === "file"
                  ? ingestedLecture.name
                  : ingestedLecture.url}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIngestedLecture(null)}
              className="ml-2 h-7 px-2 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-white/5 rounded-md cursor-pointer"
            >
              Dismiss
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
