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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
        <header className="h-14 px-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#09090b]/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2.5 text-xs text-neutral-400 hover:text-white hover:bg-white/5 gap-2 rounded-md"
            >
              <Link href="/workspace">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Workspace</span>
              </Link>
            </Button>
          </div>

          {/* Save Status Toast & Button */}
          <div className="flex items-center gap-2">
            {savedToast && (
              <Badge variant="success" className="text-xs flex items-center gap-1 py-1 px-2.5">
                <Check className="w-3.5 h-3.5" />
                <span>Preferences synced</span>
              </Badge>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleManualSave}
              className="h-8 px-3.5 rounded-md bg-primary hover:bg-[#881337] text-white text-xs font-medium transition-colors shadow-none cursor-pointer"
            >
              Save Changes
            </Button>
          </div>
        </header>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Header Title Section */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/20 border border-primary/30 text-rose-300">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <h1 className="text-xl font-medium text-neutral-100 tracking-tight">Preferences</h1>
            </div>
            <p className="text-xs text-neutral-400 font-normal">
              Customize your AI model engines, voice synthesis, dialogue languages, and playback options.
            </p>
          </div>

          {/* Tabs: General & AI */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "general" | "ai")}
            className="w-full space-y-6"
          >
            <TabsList className="bg-neutral-900/60 border border-white/5 p-1 rounded-md h-9 gap-1">
              <TabsTrigger
                value="general"
                className="text-xs px-3.5 py-1 text-neutral-400 data-[state=active]:text-white data-[state=active]:bg-neutral-800 rounded-sm cursor-pointer"
              >
                General
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="text-xs px-3.5 py-1 text-neutral-400 data-[state=active]:text-white data-[state=active]:bg-neutral-800 rounded-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>AI & Voice</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: General Settings */}
            <TabsContent value="general" className="mt-0 space-y-4 focus-visible:outline-none">
              <Card className="bg-neutral-900/40 border-white/5 shadow-none rounded-lg">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Lecture Playback
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-4">
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
                        "w-10 h-5.5 rounded-full transition-colors relative cursor-pointer focus:outline-none",
                        autoplayAudio ? "bg-primary" : "bg-neutral-800"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full bg-white transition-transform absolute top-[3px]",
                          autoplayAudio ? "translate-x-5" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  <Separator className="bg-white/5" />

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
                        "w-10 h-5.5 rounded-full transition-colors relative cursor-pointer focus:outline-none",
                        subtitlesEnabled ? "bg-primary" : "bg-neutral-800"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full bg-white transition-transform absolute top-[3px]",
                          subtitlesEnabled ? "translate-x-5" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  <Separator className="bg-white/5" />

                  {/* Select: Default Playback Speed */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-neutral-200 block">
                        Default Playback Speed
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Preferred audio playback speed for lectures
                      </span>
                    </div>

                    <div className="w-full sm:w-80 shrink-0">
                      <CustomSelect
                        value={playbackSpeed}
                        onChange={setPlaybackSpeed}
                        options={speedOptions}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Theme Note */}
              <Card className="bg-neutral-900/40 border-white/5 shadow-none rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-neutral-300">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-neutral-200 block">Appearance</span>
                    <span className="text-[11px] text-neutral-500">
                      Blindspot AI is optimized for dark studio mode
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono text-[11px] border-white/10 bg-black/40">
                  Dark (Default)
                </Badge>
              </Card>
            </TabsContent>

            {/* Tab 2: AI & Voice */}
            <TabsContent value="ai" className="mt-0 space-y-4 focus-visible:outline-none">
              <Card className="bg-neutral-900/40 border-white/5 shadow-none rounded-lg">
                <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Tutor Voice & Model Settings</span>
                  </CardTitle>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Synced with Workspace Top Bar & Backend
                  </span>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  {/* 1. AI Reasoning Model Selection */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
                    <div className="flex-1 min-w-0">
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

                    <div className="w-full sm:w-80 shrink-0">
                      <CustomSelect
                        value={selectedModel}
                        onChange={handleModelChange}
                        options={modelOptions}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  {/* 2. Spoken Neural Voice Selection */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
                    <div className="flex-1 min-w-0">
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

                    <div className="w-full sm:w-80 shrink-0">
                      <CustomSelect
                        value={selectedVoice}
                        onChange={handleVoiceChange}
                        options={voiceOptions}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  {/* 3. Text Reading Language Selection */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
                    <div className="flex-1 min-w-0">
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

                    <div className="w-full sm:w-80 shrink-0">
                      <CustomSelect
                        value={selectedTextLanguage}
                        onChange={handleTextLanguageChange}
                        options={textLanguageOptions}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <Separator className="bg-white/5" />

                  {/* 4. Explanation Verbosity */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-neutral-200 block">
                        Explanation Verbosity
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Depth of explanations when asking questions to the AI tutor
                      </span>
                    </div>

                    <div className="w-full sm:w-80 shrink-0">
                      <CustomSelect
                        value={tutorVerbosity}
                        onChange={setTutorVerbosity}
                        options={verbosityOptions}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sync Note Box */}
              <Card className="bg-neutral-900/20 border-white/5 shadow-none rounded-lg p-4 flex items-start gap-3 text-xs text-neutral-400">
                <HelpCircle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Voice and text languages are independently configurable. Changes made here will immediately update the selectors on the <strong className="text-neutral-200 font-medium">Workspace top bar</strong> and persist across all upcoming AI teaching steps.
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
