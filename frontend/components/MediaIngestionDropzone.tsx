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

export interface MediaIngestionDropzoneProps {
  onFileSelect?: (file: File) => void;
  onUrlSubmit?: (url: string) => void;
  isProcessing?: boolean;
  className?: string;
  maxFileSizeBytes?: number; // default: 500MB
  acceptedFormats?: string[]; // default: mp3, mp4, wav, m4a, webm
}

export const MediaIngestionDropzone: React.FC<MediaIngestionDropzoneProps> = ({
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

  // Mouse coordinate tracking for trailing radial spotlight
  const mouseX = useSpring(useMotionValue(0), { stiffness: 350, damping: 35 });
  const mouseY = useSpring(useMotionValue(0), { stiffness: 350, damping: 35 });
  const [isHovered, setIsHovered] = useState(false);

  const dropzoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);

  // Mouse move handler for the radial glow
  const handleMouseMove = useCallback(
    ({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) => {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    },
    [mouseX, mouseY]
  );

  // Radial glow spotlight dynamic styling
  const radialBackground = useMotionTemplate`radial-gradient(450px circle at ${mouseX}px ${mouseY}px, rgba(112, 26, 36, 0.1), transparent 80%)`;
  const borderGlow = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, rgba(136, 19, 55, 0.35), transparent 70%)`;

  // Window-level drag event listeners to detect drag initiation from anywhere
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

  // Validation
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
      setTimeout(() => setErrorMessage(null), 4500);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setUploadProgress(0);

    // Simulate progress animation for realistic UI feel
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onFileSelect) {
            onFileSelect(file);
          }
          return 100;
        }
        return prev + 12;
      });
    }, 90);
  };

  // Drag over dropzone handlers
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

  // URL submission handler
  const handleUrlSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = mediaUrl.trim();
    if (!trimmed) return;

    // Basic URL validation
    try {
      new URL(trimmed);
    } catch {
      setErrorMessage("Please enter a valid lecture link (e.g. https://...)");
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setErrorMessage(null);
    setIsUrlSubmitting(true);

    if (onUrlSubmit) {
      onUrlSubmit(trimmed);
    }

    setTimeout(() => {
      setIsUrlSubmitting(false);
    }, 1200);
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

  const isDraggingState = isDragOver || isWindowDragging;

  return (
    <div className={cn("relative flex items-center justify-center w-full", className)}>
      {/* Background ambient lighting */}
      <div className="ambient-glow" />

      {/* Main Upload Card Container */}
      <motion.div
        ref={dropzoneRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        layout
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{
          opacity: 1,
          scale: isDragOver ? 1.025 : isWindowDragging ? 1.012 : 1,
          y: isDragOver ? -4 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 22,
        }}
        className={cn(
          "relative w-full max-w-[560px] rounded-3xl p-8 md:p-10",
          "backdrop-blur-2xl bg-[#0e1017]/70",
          "shadow-sprawling transition-shadow duration-500",
          isHovered && "shadow-sprawling-hover",
          isDraggingState && "shadow-sprawling-drag",
          "overflow-hidden select-none"
        )}
      >
        {/* Dynamic Trailing Mouse Glow (Hover state) */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300"
          style={{
            background: radialBackground,
            opacity: isHovered && !isDraggingState ? 1 : 0,
          }}
        />

        {/* Dynamic Border Spotlight Glow on Hover */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300"
          style={{
            background: borderGlow,
            opacity: isHovered && !isDraggingState ? 0.6 : 0,
            maskImage: "linear-gradient(black, black) content-box, linear-gradient(black, black)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: "1px",
          }}
        />

        {/* Outer Border Layer: Ultra-thin Low-opacity Dashed Border -> Solid Glowing Blue Line on Drag */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-3xl transition-all duration-300",
            isDraggingState
              ? "border border-solid border-brand-500/90 shadow-[inset_0_0_24px_rgba(37,99,235,0.25)]"
              : "border border-dashed border-white/[0.12]"
          )}
        />

        {/* Inner subtle specular highlight */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              /* Idle / Drop / URL Input Mode */
              <motion.div
                key="idle-dropzone"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col items-center"
              >
                {/* Upload Icon Badge */}
                <motion.div
                  animate={{
                    y: isDragOver ? -6 : 0,
                    scale: isDragOver ? 1.08 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "group relative mb-6 flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl",
                    "bg-gradient-to-b from-white/[0.08] to-white/[0.02]",
                    "border border-white/[0.1] shadow-inner-glow",
                    "transition-all duration-300 hover:border-brand-500/50 hover:bg-brand-500/10"
                  )}
                >
                  {/* Subtle Pulse Rings when Dragging */}
                  {isDraggingState && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.8 }}
                      animate={{ scale: 1.4, opacity: 0 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.6,
                        ease: "easeOut",
                      }}
                      className="absolute inset-0 rounded-2xl border border-brand-500/60"
                    />
                  )}

                  <Upload
                    className={cn(
                      "h-7 w-7 transition-colors duration-300",
                      isDraggingState
                        ? "text-brand-400"
                        : "text-zinc-300 group-hover:text-brand-400"
                    )}
                    strokeWidth={1.75}
                  />
                </motion.div>

                {/* Typography: Primary Heading & Secondary Muted Text */}
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white/95 mb-2">
                  {isDragOver ? "Release to drop lecture" : "Drop a lecture to begin"}
                </h2>

                <p className="text-sm text-zinc-400 font-normal tracking-tight max-w-[340px] leading-relaxed mb-6">
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

                {/* Browse Button Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-tight",
                    "bg-white/[0.04] text-zinc-300 border border-white/[0.08]",
                    "hover:bg-white/[0.08] hover:text-white hover:border-white/[0.15]",
                    "active:scale-95 transition-all duration-200"
                  )}
                >
                  <span>Or browse local files</span>
                </button>

                {/* Minimalist Divider */}
                <div className="w-full flex items-center gap-3 my-7 px-4">
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                  <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500/80">
                    or
                  </span>
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                </div>

                {/* URL Input: Sleek, Borderless with Bottom Accent Line */}
                <form
                  onSubmit={handleUrlSubmit}
                  className="relative w-full max-w-[440px] px-2"
                >
                  <div className="relative flex items-center">
                    <Link2
                      className={cn(
                        "h-4 w-4 transition-colors duration-200 ml-1 mr-3 flex-shrink-0",
                        isUrlFocused ? "text-brand-400" : "text-zinc-500"
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
                        "w-full bg-transparent py-2.5 pr-10 text-sm tracking-tight text-white placeholder-zinc-500",
                        "focus:outline-none border-none",
                        "selection:bg-brand-600/40"
                      )}
                    />

                    {/* Submit / Action indicator */}
                    <div className="absolute right-1 flex items-center gap-1.5">
                      {mediaUrl.trim().length > 0 && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          type="submit"
                          disabled={isUrlSubmitting}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg",
                            "bg-brand-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]",
                            "hover:bg-brand-500 active:scale-95 transition-all duration-150"
                          )}
                          aria-label="Submit URL"
                        >
                          {isUrlSubmitting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5" />
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Static minimal bottom base line */}
                  <div className="h-[1px] w-full bg-white/[0.08]" />

                  {/* Animated Glowing Bottom Accent Border on Focus */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-brand-600 via-brand-400 to-brand-600"
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
                    }}
                  />
                </form>
              </motion.div>
            ) : (
              /* File Selected / Uploading Progress Mode */
              <motion.div
                key="uploading-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="w-full flex flex-col items-center py-2"
              >
                {/* File Icon Badge */}
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 shadow-inner-glow">
                  {selectedFile.type.startsWith("video/") ||
                  selectedFile.name.endsWith(".mp4") ? (
                    <FileVideo className="h-8 w-8" strokeWidth={1.75} />
                  ) : (
                    <FileAudio className="h-8 w-8" strokeWidth={1.75} />
                  )}
                  {uploadProgress === 100 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </motion.div>
                  )}
                </div>

                {/* File Information */}
                <div className="w-full max-w-[360px] text-center mb-6">
                  <h3 className="text-base font-semibold tracking-tight text-white truncate mb-1">
                    {selectedFile.name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono tracking-tight">
                    {formatFileSize(selectedFile.size)} •{" "}
                    {uploadProgress < 100
                      ? `Uploading ${uploadProgress}%`
                      : "Ready for processing"}
                  </p>
                </div>

                <div className="relative w-full max-w-[400px] h-2 rounded-full bg-white/[0.06] overflow-hidden mb-8">
                  <motion.div
                    className="h-full bg-gradient-to-r from-brand-700 via-brand-500 to-rose-400 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: "easeOut", duration: 0.2 }}
                    style={{
                      boxShadow: "0 0 12px rgba(185, 28, 61, 0.6)",
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium tracking-tight bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </button>

                  <button
                    type="button"
                    disabled={uploadProgress < 100 || isProcessing}
                    onClick={() => onFileSelect && onFileSelect(selectedFile)}
                    className={cn(
                      "inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-medium tracking-tight",
                      "bg-brand-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]",
                      "hover:bg-brand-500 active:scale-95 transition-all duration-150",
                      (uploadProgress < 100 || isProcessing) &&
                        "opacity-50 cursor-not-allowed shadow-none"
                    )}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Analyzing Lecture...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Process Lecture</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast / Error Alert Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="mt-6 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2 text-xs text-red-400"
              >
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="tracking-tight">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default MediaIngestionDropzone;

