"use client";

import React, { useRef, useEffect, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Float } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square } from "lucide-react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

/**
 * Synchronized Subtitle Script for /audio/intro_audio.mp3
 * Timings (timeMs) and text updates can be dropped in here.
 */
export interface IntroSubtitleCue {
  timeMs: number;
  text: string;
}

export const DEFAULT_INTRO_SUBTITLES: IntroSubtitleCue[] = [
  {
    timeMs: 0,
    text: "Hi.",
  },
  {
    timeMs: 1000,
    text: "I'm your Blindspot AI tutor.",
  },
  {
    timeMs: 2600,
    text: "I can help you visualize complex topics and generate interactive whiteboards on the fly.",
  },
];

const INTRO_AUDIO_SRC = "/audio/intro_audio.mp3";
const INTRO_FALLBACK_DURATION_MS = 15000;

interface RobotModelProps {
  isFast?: boolean;
  isPlaying?: boolean;
}

function RobotModel({ isFast = false, isPlaying = false }: RobotModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/Talking.glb");
  const { actions, names } = useAnimations(animations, group);

  const rotationYRef = useRef(0);
  const targetRotationYRef = useRef(0);

  // Disable frustum culling on all SkinnedMeshes so Three.js doesn't cull bones
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.frustumCulled = false;
          (child as THREE.Mesh).castShadow = true;
          (child as THREE.Mesh).receiveShadow = true;
          if ((child as THREE.Mesh).material) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            mat.side = THREE.DoubleSide;
            mat.needsUpdate = true;
          }
        }
      });
    }
  }, [scene]);

  // Keep the talking animation active at all times so bone transforms never collapse to bind pose
  useEffect(() => {
    if (names.length > 0 && actions) {
      const animName =
        names.find(
          (n) =>
            n.toLowerCase().includes("talk") ||
            n.toLowerCase().includes("layer") ||
            n.toLowerCase().includes("mixamo")
        ) || names[0];

      const action = actions[animName];
      if (action) {
        if (!action.isRunning()) {
          action.reset().play();
        }
        // Full talking animation when playing or fast; subtle living idle rate when idling (maintains exact same height & stance)
        action.timeScale = isPlaying || isFast ? (isFast ? 1.25 : 1.0) : 0.08;
      }
    }
  }, [isPlaying, isFast, actions, names]);

  // Gentle idle rotation, breathing hover, and speaking gestures
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (group.current) {
      // Natural breathing hover (consistent across idle and talking)
      group.current.position.y = Math.sin(time * 1.2) * 0.035 - 0.65;

      // Responsive subtle rotation
      targetRotationYRef.current = Math.sin(time * 0.6) * 0.22;
      if (isFast || isPlaying) {
        targetRotationYRef.current += Math.sin(time * 2.2) * 0.1;
      }

      rotationYRef.current = THREE.MathUtils.lerp(
        rotationYRef.current,
        targetRotationYRef.current,
        delta * 3
      );
      group.current.rotation.y = rotationYRef.current;
    }
  });

  return (
    <group ref={group} position={[0, -0.65, 0]}>
      {/* Direct calibrated scale for Talking.glb */}
      <primitive object={scene} scale={290} />

      {/* Wine/Crimson Core Spotlight from underneath */}
      <pointLight
        position={[0, 0.6, 0.8]}
        color="#e11d48"
        intensity={isPlaying || isFast ? 4.5 : 3.0}
        distance={4.5}
      />
    </group>
  );
}

export interface RobotCompanionProps {
  isFast?: boolean;
  className?: string;
  showIntroButton?: boolean;
  externalSubtitle?: string | null;
  isExternalPlaying?: boolean;
  onIntroPlay?: () => void;
  stopIntroSignal?: number;
}

export default function RobotCompanionCanvas({
  isFast = false,
  className,
  showIntroButton = true,
  externalSubtitle,
  isExternalPlaying = false,
  onIntroPlay,
  stopIntroSignal,
}: RobotCompanionProps) {
  const [mounted, setMounted] = useState(false);

  // State Management: isPlaying boolean state & subtitleText string state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [subtitleText, setSubtitleText] = useState<string>("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Stop the intro sequence and reset all states and animations to idle
  const stopIntro = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
    setIsPlaying(false);
    setSubtitleText("");
  }, []);

  // Stop intro if external signal changes (e.g. user starts playing lecture audio)
  useEffect(() => {
    if (stopIntroSignal && stopIntroSignal > 0) {
      stopIntro();
    }
  }, [stopIntroSignal, stopIntro]);

  // The Trigger: Simultaneously play audio, start talking animation, and cycle timed subtitles
  const handlePlayIntro = useCallback(() => {
    // If already playing, toggle to stop
    if (isPlaying) {
      stopIntro();
      return;
    }

    stopIntro();

    // Signal parent to pause any playing audio
    onIntroPlay?.();

    // 1. Play intro audio with format support and preload
    const audio = new Audio();
    audio.preload = "auto";

    if (audio.canPlayType("audio/mpeg")) {
      audio.src = "/audio/intro_audio.mp3";
    } else if (audio.canPlayType("audio/ogg; codecs=vorbis")) {
      audio.src = "/audio/intro_audio.ogg";
    } else {
      audio.src = "/audio/intro_audio.wav";
    }

    audioRef.current = audio;

    // When audio finishes or fails, reset isPlaying and animation to idle
    audio.onended = () => {
      stopIntro();
    };

    audio.onerror = (err) => {
      console.warn("Audio element error during intro playback:", err);
      // Give subtitles a moment before stopping if audio fails
      setTimeout(stopIntro, 4000);
    };

    // Dynamically adjust safety fallback timeout when audio duration loads
    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        const dynamicTimeoutMs = Math.ceil(audio.duration * 1000) + 2000;
        const durTid = setTimeout(() => {
          stopIntro();
        }, dynamicTimeoutMs);
        timeoutIdsRef.current.push(durTid);
      }
    };

    audio.play().catch((err) => {
      console.warn("Audio autoplay blocked or failed:", err);
    });

    // 2. Trigger talking animation
    setIsPlaying(true);

    // 3. Subtitle Sequence: cycle subtitleText state with setTimeout
    const timeouts: NodeJS.Timeout[] = [];

    DEFAULT_INTRO_SUBTITLES.forEach(({ timeMs, text }) => {
      const tid = setTimeout(() => {
        setSubtitleText(text);
      }, timeMs);
      timeouts.push(tid);
    });

    // Absolute safety upper bound fallback timeout (15s) in case onended doesn't trigger
    const endTid = setTimeout(() => {
      stopIntro();
    }, INTRO_FALLBACK_DURATION_MS);
    timeouts.push(endTid);

    timeoutIdsRef.current = timeouts;
  }, [isPlaying, stopIntro, onIntroPlay]);

  // Clean up audio and active timeouts on component unmount
  useEffect(() => {
    return () => {
      stopIntro();
    };
  }, [stopIntro]);

  // Single unified subtitle resolution: visible only when talking or audio is playing
  const activeText = (isPlaying ? subtitleText : externalSubtitle) || "";
  const isTalkingOrPlaying = isPlaying || Boolean(isExternalPlaying);
  const isVisible = isTalkingOrPlaying && Boolean(activeText.trim());

  if (!mounted) {
    return (
      <div
        className={className || "w-full h-full min-h-[300px]"}
        style={{ width: "100%", height: "100%", minHeight: "300px" }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border border-[#701a24]/30 bg-[#701a24]/10 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full h-full min-h-[300px] flex flex-col items-center justify-center pointer-events-auto",
        className
      )}
    >
      {/* 3D Canvas Stage */}
      <div className="relative w-full h-full flex-1 min-h-[260px] overflow-hidden">
        <Canvas
          camera={{ position: [0, 0.3, 3.2], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          style={{
            pointerEvents: "none",
            width: "100%",
            height: "100%",
            minHeight: "260px",
          }}
        >
          {/* Studio Lighting with Deep Oxblood Burgundy Rim */}
          <ambientLight intensity={1.6} />
          <directionalLight position={[5, 7, 5]} intensity={3.2} color="#ffffff" />
          <directionalLight position={[-5, 4, 3]} intensity={2.0} color="#f5f5f4" />
          <directionalLight position={[0, 4, -4]} intensity={2.5} color="#701a24" />
          <pointLight position={[0, -2, 2]} intensity={1.5} color="#881337" />

          <Suspense fallback={null}>
            <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.15}>
              <RobotModel isFast={isFast} isPlaying={isPlaying} />
            </Float>
          </Suspense>
        </Canvas>

        {/* Minimal Luxury Subtitle: Box removed, larger text, luxury font, visible ONLY when talking or playing */}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-8 max-w-2xl mx-auto z-20 pointer-events-none text-center px-4"
            >
              <p className="text-base sm:text-lg md:text-xl text-neutral-100 font-serif tracking-wide leading-relaxed drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] select-none">
                &ldquo;{activeText}&rdquo;
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The Trigger: Sleek "Play Intro" button below the 3D Canvas */}
      {showIntroButton && (
        <div className="pt-2 pb-1 z-20 pointer-events-auto shrink-0 flex items-center justify-center">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={handlePlayIntro}
            className={cn(
              "px-3.5 py-1.5 rounded-xl border text-xs font-semibold tracking-tight flex items-center gap-2 cursor-pointer transition-all shadow-md",
              isPlaying
                ? "bg-[#701a24] hover:bg-[#881337] border-[#881337] text-white shadow-[#701a24]/30 ring-1 ring-[#701a24]/50"
                : "bg-neutral-900/90 hover:bg-neutral-800 border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white"
            )}
            title={isPlaying ? "Stop Intro" : "Play Intro"}
          >
            {isPlaying ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Square className="w-3 h-3 fill-current text-white/90" />
                <span>Stop Intro</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-neutral-300" />
                <span>Play Intro</span>
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}

useGLTF.preload("/Talking.glb");

