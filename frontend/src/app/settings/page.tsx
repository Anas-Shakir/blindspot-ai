"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sliders,
  Volume2,
  Sparkles,
  Moon,
  Check,
  Globe,
  HelpCircle,
  Cpu,
} from "lucide-react";
import Sidebar from "@/components/common/Sidebar";
import CustomSelect, { SelectOption } from "@/components/common/CustomSelect";
import { cn } from "@/lib/utils";
import { api, VoiceOption } from "@/lib/api";

const TEXT_LANGUAGES = [
  { id: "English", name: "English", flag: "🌐" },
  { id: "Urdu", name: "Urdu (اردو)", flag: "🇵🇰" },
  { id: "Spanish", name: "Spanish (Español)", flag: "🇪🇸" },
  { id: "French", name: "French (Français)", flag: "🇫🇷" },
  { id: "German", name: "German (Deutsch)", flag: "🇩🇪" },
  { id: "Arabic", name: "Arabic (العربية)", flag: "🇸🇦" },
  { id: "Chinese", name: "Chinese (中文)", flag: "🇨🇳" },
  { id: "Hindi", name: "Hindi (हिन्दी)", flag: "🇮🇳" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "ai">("general");
  const [autoplayAudio, setAutoplayAudio] = useState(true);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState("1.0x");
  const [tutorVerbosity, setTutorVerbosity] = useState("balanced");
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("blindspot_selected_model") || "openai/gpt-oss-120b";
    }
    return "openai/gpt-oss-120b";
  });
  const [savedToast, setSavedToast] = useState(false);

  // Live Neural Voices from Backend
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("en-US-ChristopherNeural");
  const [selectedTextLanguage, setSelectedTextLanguage] = useState<string>("English");
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  // Load voices and sync preferences on mount
  useEffect(() => {
    // 1. Fetch available neural voices
    api.getVoices()
      .then((res) => {
        if (res && res.length > 0) {
          setVoices(res);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch available voices in settings:", err);
      });

    // 2. Fetch active preferences from backend or localStorage
    api.getPreferences()
      .then((prefs) => {
        if (prefs.voice) setSelectedVoice(prefs.voice);
        if (prefs.text_language) setSelectedTextLanguage(prefs.text_language);
        if (prefs.model) setSelectedModel(prefs.model);
      })
      .catch((err) => {
        console.warn("Failed to load preferences:", err);
      })
      .finally(() => {
        setIsLoadingPreferences(false);
      });
  }, []);

  // Map voices to CustomSelect option format
  const voiceOptions = useMemo<SelectOption[]>(() => {
    if (voices.length === 0) {
      return [
        { value: "en-US-ChristopherNeural", label: "English", sublabel: "Christopher", flag: "🇺🇸", badge: "Neural" },
        { value: "en-US-JennyNeural", label: "English", sublabel: "Jenny", flag: "🇺🇸", badge: "Neural" },
        { value: "ur-PK-AsadNeural", label: "Urdu", sublabel: "Asad", flag: "🇵🇰", badge: "Neural" },
        { value: "es-ES-AlvaroNeural", label: "Spanish", sublabel: "Alvaro", flag: "🇪🇸", badge: "Neural" },
      ];
    }
    return voices.map((v) => ({
      value: v.id,
      label: v.language,
      sublabel: v.name,
      flag: v.flag,
      badge: "Neural",
    }));
  }, [voices]);

  // Map text languages to CustomSelect option format
  const textLanguageOptions = useMemo<SelectOption[]>(() => {
    return TEXT_LANGUAGES.map((t) => ({
      value: t.id,
      label: t.name,
      flag: t.flag,
    }));
  }, []);

  const modelOptions: SelectOption[] = [
    {
      value: "openai/gpt-oss-120b",
      label: "GPT-OSS 120B",
      sublabel: "Groq LPU · 120B flagship reasoning",
      badge: "Recommended",
    },
    {
      value: "openai/gpt-oss-20b",
      label: "GPT-OSS 20B",
      sublabel: "Groq LPU · Low-latency dialogue & fast response",
      badge: "Ultra Fast",
    },
    {
      value: "qwen/qwen3.8-27b",
      label: "Qwen 3.8 27B",
      sublabel: "Alibaba Qwen · High STEM reasoning & clarity",
      badge: "Deep Reasoning",
    },
    {
      value: "qwen/qwen3.6-27b",
      label: "Qwen 3.6 27B",
      sublabel: "Alibaba Qwen · Balanced academic pedagogy",
      badge: "Balanced",
    },
    {
      value: "groq/compound",
      label: "Groq Compound",
      sublabel: "Groq · Multi-step agentic reasoning engine",
      badge: "Compound",
    },
    {
      value: "groq/compound-mini",
      label: "Groq Compound Mini",
      sublabel: "Groq · Lightweight agentic inference",
      badge: "Fast Engine",
    },
  ];

  const verbosityOptions: SelectOption[] = [
    { value: "concise", label: "Concise", sublabel: "Quick & direct takeaways" },
    { value: "balanced", label: "Balanced", sublabel: "Standard academic depth" },
    { value: "comprehensive", label: "Comprehensive", sublabel: "Deep dive with examples" },
  ];

  const speedOptions: SelectOption[] = [
    { value: "0.75x", label: "0.75x", sublabel: "Slower pacing" },
    { value: "1.0x", label: "1.0x", sublabel: "Normal speed" },
    { value: "1.25x", label: "1.25x", sublabel: "Brisk pace" },
    { value: "1.5x", label: "1.5x", sublabel: "Fast pace" },
    { value: "2.0x", label: "2.0x", sublabel: "Double speed" },
  ];

  // Update AI model setting and sync with backend
  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);
    try {
      await api.setPreferences({
        voice: selectedVoice,
        text_language: selectedTextLanguage,
        model: modelId,
      });
      showSavedToast();
    } catch (err) {
      console.warn("Failed to persist model preference:", err);
    }
  };

  // Update voice setting and sync with backend
  const handleVoiceChange = async (voiceId: string) => {
    setSelectedVoice(voiceId);
    try {
      await api.setPreferences({
        voice: voiceId,
        text_language: selectedTextLanguage,
        model: selectedModel,
      });
      showSavedToast();
    } catch (err) {
      console.warn("Failed to persist voice preference:", err);
    }
  };

  // Update text reading language setting and sync with backend
  const handleTextLanguageChange = async (langId: string) => {
    setSelectedTextLanguage(langId);
    try {
      await api.setPreferences({
        voice: selectedVoice,
        text_language: langId,
        model: selectedModel,
      });
      showSavedToast();
    } catch (err) {
      console.warn("Failed to persist text language preference:", err);
    }
  };

  const showSavedToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2400);
  };

  const handleManualSave = async () => {
    try {
      await api.setPreferences({
        voice: selectedVoice,
        text_language: selectedTextLanguage,
        model: selectedModel,
      });
      showSavedToast();
    } catch (err) {
      console.warn("Failed to save settings:", err);
    }
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-neutral-100 overflow-hidden font-sans select-none">
      {/* Shared Collapsible Sidebar */}
      <Sidebar />

      {/* Main Settings Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-14 px-6 border-b border-white/[0.07] flex items-center justify-between shrink-0 bg-[#09090b]/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <Link
              href="/workspace"
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Workspace</span>
            </Link>

            <div className="h-4 w-[1px] bg-white/[0.08]" />

            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#701a24]" />
              <h1 className="text-sm font-semibold text-white tracking-tight">Settings</h1>
            </div>
          </div>

          {/* Save Status Toast & Button */}
          <div className="flex items-center gap-2">
            {savedToast && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" />
                <span>Preferences synced</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleManualSave}
              className="px-3.5 py-1.5 rounded-lg bg-[#701a24] hover:bg-[#8b2330] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </header>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Header Title Section */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">System Settings</h2>
            <p className="text-xs text-neutral-400">
              Configure your general playback behavior, AI companion preferences, and language synthesis.
            </p>
          </div>

          {/* Tab Switcher: General First, AI & Voice Second */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                activeTab === "general"
                  ? "bg-zinc-800 text-white shadow-sm border border-white/[0.08] font-semibold"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                activeTab === "ai"
                  ? "bg-zinc-800 text-white shadow-sm border border-white/[0.08] font-semibold"
                  : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#701a24]" />
              <span>AI & Voice</span>
            </button>
          </div>

          {/* Tab 1: General Settings (First) */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#121216]/90 border border-white/[0.07] space-y-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Lecture Playback
                </h3>

                {/* Toggle: Autoplay Audio */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs font-medium text-neutral-200 block">
                      Autoplay Lecture Audio
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Automatically start playing lesson audio when opening a lecture
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoplayAudio((prev) => !prev)}
                    className={cn(
                      "w-10 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none",
                      autoplayAudio ? "bg-[#701a24]" : "bg-zinc-700"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white transition-transform absolute top-1",
                        autoplayAudio ? "translate-x-5" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                <div className="h-[1px] bg-white/[0.05]" />

                {/* Toggle: Subtitles */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs font-medium text-neutral-200 block">
                      Interactive Subtitles
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Show synced transcript text during playback
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubtitlesEnabled((prev) => !prev)}
                    className={cn(
                      "w-10 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none",
                      subtitlesEnabled ? "bg-[#701a24]" : "bg-zinc-700"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white transition-transform absolute top-1",
                        subtitlesEnabled ? "translate-x-5" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                <div className="h-[1px] bg-white/[0.05]" />

                {/* Select: Default Playback Speed */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                  <div>
                    <span className="text-xs font-medium text-neutral-200 block">
                      Default Playback Speed
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Preferred audio playback speed for lectures
                    </span>
                  </div>

                  <CustomSelect
                    value={playbackSpeed}
                    onChange={setPlaybackSpeed}
                    options={speedOptions}
                    className="w-full sm:w-60 shrink-0"
                  />
                </div>
              </div>

              {/* Theme Note */}
              <div className="p-4 rounded-2xl bg-[#121216]/90 border border-white/[0.07] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-neutral-300">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-neutral-200 block">Appearance</span>
                    <span className="text-[11px] text-neutral-500">
                      Blindspot AI is optimized for dark studio mode
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-neutral-400 bg-black/40 px-2.5 py-1 rounded-md border border-white/[0.05]">
                  Dark (Default)
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: AI & Voice (Second) */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[#121216]/90 border border-white/[0.07] space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Tutor Voice & Model Settings</span>
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Synced with Workspace Top Bar & Backend
                  </span>
                </div>

                {/* 1. AI Reasoning Model Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs font-medium text-neutral-200">
                        AI Reasoning Model
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      Select the primary foundation LLM engine for curriculum breakdown and tutoring
                    </span>
                  </div>

                  <CustomSelect
                    value={selectedModel}
                    onChange={handleModelChange}
                    options={modelOptions}
                    className="w-full sm:w-80 shrink-0"
                  />
                </div>

                <div className="h-[1px] bg-white/[0.05]" />

                {/* 2. Spoken Neural Voice Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-xs font-medium text-neutral-200">
                        AI Spoken Voice & Accent
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      The neural voice and spoken accent used by the AI tutor when speaking and explaining concepts
                    </span>
                  </div>

                  <CustomSelect
                    value={selectedVoice}
                    onChange={handleVoiceChange}
                    options={voiceOptions}
                    className="w-full sm:w-72 shrink-0"
                  />
                </div>

                <div className="h-[1px] bg-white/[0.05]" />

                {/* 3. Text Reading Language Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-medium text-neutral-200">
                        Reading Text Language
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      The language used for on-screen dialogue text, whiteboard notes, and subtitles
                    </span>
                  </div>

                  <CustomSelect
                    value={selectedTextLanguage}
                    onChange={handleTextLanguageChange}
                    options={textLanguageOptions}
                    className="w-full sm:w-72 shrink-0"
                  />
                </div>

                <div className="h-[1px] bg-white/[0.05]" />

                {/* 3. Explanation Verbosity */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                  <div>
                    <span className="text-xs font-medium text-neutral-200 block">
                      Explanation Verbosity
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Depth of explanations when asking questions to the AI tutor
                    </span>
                  </div>

                  <CustomSelect
                    value={tutorVerbosity}
                    onChange={setTutorVerbosity}
                    options={verbosityOptions}
                    className="w-full sm:w-72 shrink-0"
                  />
                </div>
              </div>

              {/* Sync Note Box */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.07] flex items-start gap-3 text-xs text-neutral-400">
                <HelpCircle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Voice and text languages are independently configurable. Changes made here will immediately update the selectors on the <strong className="text-neutral-200">Workspace top bar</strong> and persist across all upcoming AI teaching steps.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
