"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizCardProps {
  phaseTitle: string;
  question: string;
  options: QuizOption[];
  correctId: string;
  explanation: string;
  onComplete: (isCorrect: boolean) => void;
  className?: string;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  phaseTitle,
  question,
  options,
  correctId,
  explanation,
  onComplete,
  className,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isEvaluated = selectedId !== null;
  const isCorrect = selectedId === correctId;

  const handleSelect = (id: string) => {
    if (isEvaluated) return;
    setSelectedId(id);
  };

  const handleContinue = () => {
    if (!isEvaluated) return;
    onComplete(isCorrect);
  };

  return (
    <motion.div
      layout
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "relative w-full rounded-xl border border-white/[0.07] bg-zinc-900/60 p-6 backdrop-blur-md",
        className
      )}
    >
      {/* Header - Minimal plain text without pill badges */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-white/[0.07] text-xs font-mono text-neutral-400">
        <span>{phaseTitle}</span>
        {isEvaluated && (
          <span className={isCorrect ? "text-emerald-400" : "text-rose-300"}>
            {isCorrect ? "Correct" : "Incorrect"}
          </span>
        )}
      </div>

      {/* Question */}
      <h4 className="text-sm sm:text-base font-medium text-neutral-100 leading-relaxed mb-4">
        {question}
      </h4>

      {/* Options Stack */}
      <div className="space-y-2">
        {options.map((option, index) => {
          const isSelected = selectedId === option.id;
          const isThisCorrect = option.id === correctId;

          let stateStyle =
            "border-white/[0.06] bg-zinc-950/40 text-neutral-300 hover:border-white/[0.12] hover:bg-zinc-800/50 hover:text-neutral-100";

          if (isEvaluated) {
            if (isSelected) {
              stateStyle = isThisCorrect
                ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200"
                : "border-[#701a24]/80 bg-[#701a24]/20 text-rose-200";
            } else if (isThisCorrect) {
              stateStyle =
                "border-emerald-500/30 bg-emerald-950/10 text-emerald-300/90";
            } else {
              stateStyle =
                "border-white/[0.04] bg-zinc-950/20 text-neutral-500 opacity-40 cursor-not-allowed";
            }
          }

          return (
            <motion.button
              key={option.id}
              layout
              type="button"
              disabled={isEvaluated}
              whileTap={!isEvaluated ? { scale: 0.98 } : undefined}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={() => handleSelect(option.id)}
              className={cn(
                "group w-full p-3 rounded-lg border text-left text-xs sm:text-sm transition-colors flex items-start gap-2.5 cursor-pointer select-none",
                stateStyle
              )}
            >
              {/* Option Index Indicator */}
              <span className="font-mono text-xs text-neutral-500 group-hover:text-neutral-300 mt-0.5 w-4">
                {String.fromCharCode(65 + index)}.
              </span>

              {/* Option Text */}
              <span className="flex-1 leading-snug">{option.text}</span>

              {/* Status Indicator Icon */}
              {isEvaluated && (
                <span className="flex-shrink-0 mt-0.5">
                  {isSelected && isThisCorrect && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                  {isSelected && !isThisCorrect && (
                    <X className="w-4 h-4 text-rose-400" />
                  )}
                  {!isSelected && isThisCorrect && (
                    <Check className="w-4 h-4 text-emerald-400/70" />
                  )}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation Box & Continue Button */}
      <AnimatePresence>
        {isEvaluated && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0, y: 6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {/* Explanation card */}
            <div className="mt-4 p-3.5 rounded-lg bg-zinc-950/60 border border-white/[0.07] text-xs text-neutral-300 leading-relaxed">
              <span className="text-[11px] font-mono text-neutral-400 block mb-1">
                Explanation
              </span>
              <p className="text-neutral-300">{explanation}</p>
            </div>

            {/* Minimal Continue Button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              onClick={handleContinue}
              className="mt-3.5 w-full py-2.5 px-4 rounded-lg bg-white text-neutral-950 hover:bg-neutral-200 text-xs sm:text-sm font-semibold tracking-tight transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Continue to Next Phase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuizCard;
