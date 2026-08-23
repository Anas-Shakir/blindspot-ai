"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import {
  Upload,
  Link2,
  FileAudio,
  FileVideo,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

export interface HeroDropzoneProps {
  onActiveStateChange?: (isActive: boolean) => void;
  onFileSelect?: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
  isProcessing?: boolean;
  className?: string;
  maxFileSizeBytes?: number;
  acceptedFormats?: string[];
}

export const HeroDropzone: React.FC<HeroDropzoneProps> = ({
  onActiveStateChange,
  onFileSelect,
  onUrlSubmit,
  isProcessing = false,
  className,
  maxFileSizeBytes = 500 * 1024 * 1024, // 500 MB
  acceptedFormats = [".mp3", ".mp4", ".wav", ".m4a", ".webm", ".aac"],
}) => {
  // Drag states
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // URL state
  const [mediaUrl, setMediaUrl] = useState("");
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [isUrlSubmitting, setIsUrlSubmitting] = useState(false);

  // Trailing mouse coordinates with smooth spring physics
  const mouseX = useSpring(useMotionValue(0), { stiffness: 350, damping: 35 });
  const mouseY = useSpring(useMotionValue(0), { stiffness: 350, damping: 35 });
  const [isHovered, setIsHovered] = useState(false);

  const dropzoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);

  // Active state to trigger 3D orb speed up and glowing border
  const isActive = isHovered || isDragOver || isWindowDragging;

  useEffect(() => {
    onActiveStateChange?.(isActive);
  }, [isActive, onActiveStateChange]);

  const handleMouseMove = useCallback(
    ({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) => {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    },
    [mouseX, mouseY]
  );

  const radialBackground = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(59, 130, 246, 0.12), transparent 80%)`;
  const borderGlow = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, rgba(59, 130, 246, 0.35), transparent 70%)`;

  // Window drag listeners
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsWindowDragging(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsWindowDragging(false);
        setIsDragOver(false);
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsWindowDragging(false);
      setIsDragOver(false);
    };

    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
    };
  }, []);

  const validateFile = (file: File): string | null => {
    const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const isValidFormat =
      acceptedFormats.includes(fileExt) ||
      file.type.startsWith("audio/") ||
      file.type.startsWith("video/");

    if (!isValidFormat) {
      return `Unsupported format. Please upload MP3, MP4, WAV, or M4A.`;
    }

    if (file.size > maxFileSizeBytes) {
      return `File exceeds ${formatFileSize(maxFileSizeBytes)} limit.`;
    }

    return null;
  };

  const handleFileProcess = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          onFileSelect?.(file);
          return 100;
        }
        return prev + 14;
      });
    }, 85);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsWindowDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileProcess(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileProcess(file);
    }
  };

  const handleUrlSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = mediaUrl.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
    } catch {
      setErrorMessage("Please enter a valid URL (e.g. https://...)");
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    setErrorMessage(null);
    setIsUrlSubmitting(true);
    onUrlSubmit?.(trimmed);

    setTimeout(() => {
      setIsUrlSubmitting(false);
    }, 1000);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setMediaUrl("");
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <motion.div
        ref={dropzoneRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{
          opacity: 1,
          scale: isDragOver ? 1.025 : isHovered ? 1.01 : 1,
          y: isDragOver ? -4 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 22,
        }}
        className={cn(
          "relative w-full rounded-2xl p-6 sm:p-8",
          "backdrop-blur-md bg-white/[0.04] sm:bg-neutral-900/40",
          "transition-all duration-300 overflow-hidden select-none",
          isActive
            ? "shadow-[0_0_60px_-10px_rgba(59,130,246,0.3)]"
            : "shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
        )}
      >
        {/* Dynamic Trailing Mouse Radial Glow */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
          style={{
            background: radialBackground,
            opacity: isHovered && !isDragOver ? 1 : 0,
          }}
        />

        {/* Dynamic Border Spotlight Glow on Hover */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
          style={{
            background: borderGlow,
            opacity: isHovered && !isDragOver ? 0.6 : 0,
            maskImage:
              "linear-gradient(black, black) content-box, linear-gradient(black, black)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: "1px",
          }}
        />

        {/* Dashed Border -> Solid Glowing Blue Line on Drag/Active */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl transition-all duration-300",
            isActive
              ? "border border-solid border-blue-500/90 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]"
              : "border border-dashed border-white/15"
          )}
        />

        {/* Specular Highlight Line */}
        <div className="pointer-events-none absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              /* Idle / Drop / URL Input Mode */
              <motion.div
                key="idle-mode"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col items-center"
              >
                {/* Upload Icon Badge */}
                <motion.div
                  animate={{
                    y: isDragOver ? -5 : 0,
                    scale: isDragOver ? 1.06 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "group relative mb-4 flex h-13 w-13 cursor-pointer items-center justify-center rounded-xl",
                    "bg-white/[0.05] border border-white/10",
                    "transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/10"
                  )}
                >
                  <Upload
                    className={cn(
                      "h-5 w-5 transition-colors duration-300",
                      isActive
                        ? "text-blue-400"
                        : "text-zinc-400 group-hover:text-blue-400"
                    )}
                    strokeWidth={1.8}
                  />
                </motion.div>

                {/* Primary Heading & Secondary Text */}
                <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-white mb-1.5">
                  {isDragOver ? "Release to drop lecture" : "Drop a lecture to begin"}
                </h3>

                <p className="text-xs sm:text-sm text-neutral-400 tracking-tight max-w-xs mb-5 font-normal">
                  Supports MP3, MP4, WAV, or paste a URL.
                </p>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedFormats.join(",")}
                  onChange={handleFileInputChange}
                  className="hidden"
                  aria-label="Upload lecture file"
                />

                {/* Local Browse Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-tight",
                    "bg-white/[0.04] text-zinc-300 border border-white/[0.08]",
                    "hover:bg-white/[0.08] hover:text-white hover:border-white/[0.16]",
                    "active:scale-95 transition-all duration-150"
                  )}
                >
                  <span>Or browse local files</span>
                </button>

                {/* Subtle Divider */}
                <div className="w-full flex items-center gap-3 my-5 px-2">
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
                    or
                  </span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
                </div>

                {/* Borderless URL Input with Glowing Bottom Accent on Focus */}
                <form
                  onSubmit={handleUrlSubmit}
                  className="relative w-full max-w-sm px-1"
                >
                  <div className="relative flex items-center">
                    <Link2
                      className={cn(
                        "h-3.5 w-3.5 transition-colors duration-200 ml-0.5 mr-2.5 flex-shrink-0",
                        isUrlFocused ? "text-blue-400" : "text-zinc-500"
                      )}
                    />

                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      onFocus={() => setIsUrlFocused(true)}
                      onBlur={() => setIsUrlFocused(false)}
                      placeholder="Paste YouTube, Zoom, or media link..."
                      className={cn(
                        "w-full bg-transparent py-2 pr-8 text-xs tracking-tight text-white placeholder-zinc-500",
                        "focus:outline-none border-none",
                        "selection:bg-blue-600/40"
                      )}
                    />

                    {/* Quick submit button */}
                    <div className="absolute right-0 flex items-center">
                      {mediaUrl.trim().length > 0 && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          type="submit"
                          disabled={isUrlSubmitting}
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-md",
                            "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]",
                            "hover:bg-blue-500 active:scale-95 transition-all duration-150"
                          )}
                          aria-label="Submit URL"
                        >
                          {isUrlSubmitting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ArrowRight className="h-3 w-3" />
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Static minimal bottom base line */}
                  <div className="h-[1px] w-full bg-white/[0.08]" />

                  {/* Animated glowing bottom accent border */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{
                      scaleX: isUrlFocused ? 1 : 0,
                      opacity: isUrlFocused ? 1 : 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                    style={{
                      transformOrigin: "center",
                      boxShadow: "0 0 10px rgba(59, 130, 246, 0.6)",
                    }}
                  />
                </form>
              </motion.div>
            ) : (
              /* Selected / Progress Mode */
              <motion.div
                key="uploading-mode"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col items-center py-1"
              >
                <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-inner">
                  {selectedFile.type.startsWith("video/") ||
                  selectedFile.name.endsWith(".mp4") ? (
                    <FileVideo className="h-7 w-7" strokeWidth={1.75} />
                  ) : (
                    <FileAudio className="h-7 w-7" strokeWidth={1.75} />
                  )}
                  {uploadProgress === 100 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-black shadow"
                    >
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </motion.div>
                  )}
                </div>

                <div className="w-full max-w-xs text-center mb-5">
                  <h4 className="text-sm font-semibold tracking-tight text-white truncate mb-0.5">
                    {selectedFile.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-mono tracking-tight">
                    {formatFileSize(selectedFile.size)} •{" "}
                    {uploadProgress < 100
                      ? `Uploading ${uploadProgress}%`
                      : "Ready for processing"}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="relative w-full max-w-xs h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: "easeOut", duration: 0.2 }}
                    style={{
                      boxShadow: "0 0 10px rgba(59, 130, 246, 0.6)",
                    }}
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium tracking-tight bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <X className="h-3 w-3" />
                    <span>Cancel</span>
                  </button>

                  <button
                    type="button"
                    disabled={uploadProgress < 100 || isProcessing}
                    onClick={() => onFileSelect?.(selectedFile)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium tracking-tight",
                      "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]",
                      "hover:bg-blue-500 active:scale-95 transition-all duration-150",
                      (uploadProgress < 100 || isProcessing) &&
                        "opacity-50 cursor-not-allowed shadow-none"
                    )}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        <span>Process Lecture</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-4 flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400"
              >
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span className="tracking-tight">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroDropzone;

