'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  CanvasObject,
  ToolType,
  ViewportTransform,
  WhiteboardState,
  WhiteboardLessonBeat,
  WhiteboardSessionRecord,
  SessionEvent,
  MultiStageCourseRecord,
} from '@/lib/whiteboard/types';
import { Toolbar } from '@/components/whiteboard/Toolbar';
import { WhiteboardCanvas } from '@/components/whiteboard/WhiteboardCanvas';
import { CommandPlayer } from '@/components/whiteboard/CommandPlayer';
import { AudioTimingTester } from '@/components/whiteboard/AudioTimingTester';
import { SynchronizedLessonPlayer } from '@/components/whiteboard/SynchronizedLessonPlayer';
import { AILessonGeneratorModal } from '@/components/whiteboard/AILessonGeneratorModal';
import { InterruptionTray } from '@/components/whiteboard/InterruptionTray';
import { StudentReviewModal } from '@/components/whiteboard/StudentReviewModal';
import { SessionReplayPlayer } from '@/components/whiteboard/SessionReplayPlayer';
import { SessionHistoryModal } from '@/components/whiteboard/SessionHistoryModal';
import { MultiStageCoursePlayer } from '@/components/whiteboard/MultiStageCoursePlayer';
import { WhiteboardSessionManager } from '@/lib/whiteboard/sessionManager';
import { LESSON_CIRCUIT_SYNCHRONIZED } from '@/lib/whiteboard/lessonPresets';
import {
  Layers,
  Code2,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowLeft,
  Info,
  Trash2,
  PlaySquare,
  Volume2,
  Radio,
  Sliders,
  Wand2,
  Hand,
  Award,
  Film,
  FolderOpen,
  Save,
  GraduationCap,
  Pin,
  PinOff,
  X,
} from 'lucide-react';

export default function WhiteboardLabPage() {
  // Canvas State
  const [objects, setObjects] = useState<CanvasObject[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [strokeColor, setStrokeColor] = useState<string>('#818CF8');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [viewport, setViewport] = useState<ViewportTransform>({
    x: 0,
    y: 0,
    scale: 1.0,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Active Highlight Glows (targetId -> color)
  const [activeHighlights, setActiveHighlights] = useState<Record<string, string>>({});

  // History for Undo / Redo
  const [historyPast, setHistoryPast] = useState<CanvasObject[][]>([]);
  const [historyFuture, setHistoryFuture] = useState<CanvasObject[][]>([]);

  // Studio Mode: 'multi_stage_course' | 'sync_lesson' | 'replay_studio' | 'command_player'
  const [studioMode, setStudioMode] = useState<
    'multi_stage_course' | 'sync_lesson' | 'replay_studio' | 'command_player'
  >('sync_lesson');

  // Multi-Stage Course State
  const [activeCourse, setActiveCourse] = useState<MultiStageCourseRecord | null>(null);

  // AI Generation State (Step 5)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeAiLesson, setActiveAiLesson] = useState<WhiteboardLessonBeat | null>(null);

  // Student Interruption State (Step 6 & 7)
  const [isInterruptionOpen, setIsInterruptionOpen] = useState(false);
  const [interruptedTimestampMs, setInterruptedTimestampMs] = useState(0);

  // Student Work Review State (Step 8)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const userElementsCount = objects.filter((o) => o.authoredBy === 'user').length;

  // Session Persistence & Replay State (Step 9)
  const [activeSession, setActiveSession] = useState<WhiteboardSessionRecord | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');

  // UI state
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isInspectorPinned, setIsInspectorPinned] = useState(false);
  const [isInspectorHovered, setIsInspectorHovered] = useState(false);
  const [isTtsTesterOpen, setIsTtsTesterOpen] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const objectsRef = useRef<CanvasObject[]>(objects);
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);

  // Initialize Session from localStorage or default on initial mount
  useEffect(() => {
    const cached = WhiteboardSessionManager.loadFromLocalStorage();
    if (cached && cached.activeObjects && cached.activeObjects.length > 0) {
      setActiveSession(cached);
      setObjects(cached.activeObjects);
      if (cached.viewport) setViewport(cached.viewport);
    } else {
      const newSession: WhiteboardSessionRecord = {
        sessionId: `session_${Date.now()}`,
        lessonId: 'circuit-sync',
        title: "Ohm's Law Circuit Session",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activeObjects: [],
        viewport: { x: 0, y: 0, scale: 1.0 },
        events: [
          {
            id: 'ev_init_lecture',
            type: 'lecture_beat',
            timestampMs: 0,
            title: "Lesson: Ohm's Law Circuit",
            speechText: LESSON_CIRCUIT_SYNCHRONIZED.speechScript,
            audioUrl: LESSON_CIRCUIT_SYNCHRONIZED.audioUrl,
            durationMs: LESSON_CIRCUIT_SYNCHRONIZED.durationMs,
            timingMarks: LESSON_CIRCUIT_SYNCHRONIZED.timingMarks,
            commands: LESSON_CIRCUIT_SYNCHRONIZED.timedCommands,
            resultingObjects: [],
          },
        ],
      };
      setActiveSession(newSession);
    }
  }, []);

  // Auto-Save whenever objects or viewport change (debounced)
  useEffect(() => {
    if (!activeSession) return;

    const updatedSession: WhiteboardSessionRecord = {
      ...activeSession,
      activeObjects: objects,
      viewport,
      updatedAt: Date.now(),
    };

    WhiteboardSessionManager.autoSave(updatedSession, () => {
      setLastSavedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    });
  }, [objects, viewport, activeSession]);

  // Trigger temporary highlight glow
  const triggerHighlight = useCallback((targetId: string, color: string, durationMs: number = 1500) => {
    setActiveHighlights((prev) => ({ ...prev, [targetId]: color }));
    setTimeout(() => {
      setActiveHighlights((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
    }, durationMs);
  }, []);

  // Commit action to history stack (stable reference)
  const commitAction = useCallback(
    (newObjects: CanvasObject[]) => {
      setHistoryPast((prev) => [...prev, objectsRef.current]);
      setHistoryFuture([]);
      setObjects(newObjects);
    },
    []
  );

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, historyPast.length - 1);
    setHistoryFuture((prev) => [objectsRef.current, ...prev]);
    setHistoryPast(newPast);
    setObjects(previous);
    setSelectedId(null);
  }, [historyPast]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);
    setHistoryPast((prev) => [...prev, objectsRef.current]);
    setHistoryFuture(newFuture);
    setObjects(next);
    setSelectedId(null);
  }, [historyFuture]);

  // Zoom handlers
  const handleZoomIn = () =>
    setViewport((v) => ({ ...v, scale: Math.min(v.scale * 1.2, 5.0) }));
  const handleZoomOut = () =>
    setViewport((v) => ({ ...v, scale: Math.max(v.scale / 1.2, 0.15) }));
  const handleResetZoom = () => setViewport({ x: 0, y: 0, scale: 1.0 });

  // Clear Canvas
  const handleClear = () => {
    if (objects.length === 0) return;
    if (window.confirm('Are you sure you want to clear the whiteboard?')) {
      commitAction([]);
      setSelectedId(null);
    }
  };

  // Export to JSON file
  const handleExportJson = () => {
    const state: WhiteboardState = {
      version: '1.0',
      objects,
      viewport,
      selectedId,
    };
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboard-state-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON file
  const handleImportJson = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && Array.isArray(parsed.objects)) {
          commitAction(parsed.objects);
          if (parsed.viewport) setViewport(parsed.viewport);
        } else if (Array.isArray(parsed)) {
          commitAction(parsed);
        } else {
          alert('Invalid whiteboard JSON format');
        }
      } catch (err) {
        alert('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(objects, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const selectedObject = objects.find((o) => o.id === selectedId);

  return (
    <div className="relative w-screen h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Hidden File Input for JSON Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={onFileSelected}
        className="hidden"
      />

      {/* Top Header Bar */}
      <header className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/workspace"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Workspace
          </Link>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Whiteboard Lab
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-sky-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
              Step 10 — High-Precision Sync & Animation
            </span>
          </div>

          {/* Sub-50ms Sync & Auto-Save Indicator */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>⚡ 75ms Lookahead Lead</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Auto-Saved {lastSavedTime}</span>
            </div>
          </div>
        </div>

        {/* Header Center / Right Actions */}
        <div className="flex items-center gap-2">
          {/* Step 8 Check My Work Button */}
          {userElementsCount > 0 && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95 animate-pulse"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Check My Work ({userElementsCount})</span>
            </button>
          )}

          {/* Step 5 AI Generation Button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Generate with AI</span>
          </button>

          {/* Sessions Library Button (Step 9) */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Open Saved Whiteboard Sessions"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Sessions</span>
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
            {activeCourse && (
              <button
                onClick={() => setStudioMode('multi_stage_course')}
                className={`px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
                  studioMode === 'multi_stage_course'
                    ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>Masterclass ({activeCourse.syllabus.totalStages} Stages)</span>
              </button>
            )}

            <button
              onClick={() => setStudioMode('sync_lesson')}
              className={`px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
                studioMode === 'sync_lesson'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>Live Lesson</span>
            </button>

            <button
              onClick={() => setStudioMode('replay_studio')}
              className={`px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
                studioMode === 'replay_studio'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-3 h-3 text-sky-400" />
              <span>Replay Studio</span>
            </button>

            <button
              onClick={() => setStudioMode('command_player')}
              className={`px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
                studioMode === 'command_player'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlaySquare className="w-3 h-3 text-indigo-400" />
              <span>Command Dock</span>
            </button>
          </div>

          <button
            onClick={() => setIsTtsTesterOpen(!isTtsTesterOpen)}
            className={`px-2.5 py-1 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
              isTtsTesterOpen
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title="Open Speech & Timing Verification Card"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">TTS Tester</span>
          </button>

          <button
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            title={isInspectorOpen ? 'Collapse Inspector' : 'Expand Inspector'}
          >
            <Code2 className="w-4 h-4 text-indigo-400" />
          </button>
        </div>
      </header>

      {/* Main Canvas Workspace */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Floating AI Generator Modal (Step 5 & Multi-Stage Masterclass) */}
        <AILessonGeneratorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onCourseGenerated={(course) => {
            setActiveCourse(course);
            setStudioMode('multi_stage_course');
            // Clear or reset canvas for fresh masterclass if desired
            setObjects([]);
            setViewport({ x: 0, y: 0, scale: 1.0 });
          }}
          onLessonGenerated={(lesson) => {
            setActiveAiLesson(lesson);
            setStudioMode('sync_lesson');

            // Add generated lesson beat to active session events
            if (activeSession) {
              const newEvent: SessionEvent = {
                id: `ev_${Date.now()}`,
                type: 'lecture_beat',
                timestampMs: Date.now(),
                title: lesson.title,
                speechText: lesson.speechScript,
                audioUrl: lesson.audioUrl,
                durationMs: lesson.durationMs,
                timingMarks: lesson.timingMarks,
                commands: lesson.timedCommands,
                resultingObjects: [],
              };
              setActiveSession({
                ...activeSession,
                title: lesson.title,
                events: [...activeSession.events, newEvent],
              });
            }
          }}
        />

        {/* Floating Student Interruption Tray (Step 6 & 7) */}
        <InterruptionTray
          isOpen={isInterruptionOpen}
          onClose={() => setIsInterruptionOpen(false)}
          currentBoardObjects={objects}
          setObjects={setObjects}
          onCommitAction={commitAction}
          activeLesson={activeAiLesson}
          currentTimestampMs={interruptedTimestampMs}
          selectedObject={selectedObject}
          onResumeLesson={() => {
            setIsInterruptionOpen(false);
          }}
          onTriggerHighlight={triggerHighlight}
        />

        {/* Floating Student Work Review Modal (Step 8) */}
        <StudentReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          objects={objects}
          setObjects={setObjects}
          onCommitAction={commitAction}
          activeLesson={activeAiLesson}
          onTriggerHighlight={triggerHighlight}
        />

        {/* Floating Session History Switcher Modal (Step 9) */}
        <SessionHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          currentSessionId={activeSession?.sessionId || ''}
          onLoadSession={(loaded) => {
            setActiveSession(loaded);
            setObjects(loaded.activeObjects || []);
            if (loaded.viewport) setViewport(loaded.viewport);
          }}
          onNewSession={() => {
            const fresh: WhiteboardSessionRecord = {
              sessionId: `session_${Date.now()}`,
              lessonId: 'new_session',
              title: `Whiteboard Session ${new Date().toLocaleDateString()}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              activeObjects: [],
              viewport: { x: 0, y: 0, scale: 1.0 },
              events: [],
            };
            setActiveSession(fresh);
            setObjects([]);
            setViewport({ x: 0, y: 0, scale: 1.0 });
          }}
        />

        {/* Floating TTS Timing Tester Modal */}
        {isTtsTesterOpen && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-fade-in">
            <div className="relative shadow-2xl">
              <AudioTimingTester onClose={() => setIsTtsTesterOpen(false)} />
            </div>
          </div>
        )}

        {/* Floating Top Toolbar */}
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          scale={viewport.scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          canUndo={historyPast.length > 0}
          canRedo={historyFuture.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
        />

        {/* Vector SVG Canvas */}
        <WhiteboardCanvas
          objects={objects}
          setObjects={setObjects}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          viewport={viewport}
          setViewport={setViewport}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onCommitAction={commitAction}
          onAskAboutObject={(obj) => {
            setSelectedId(obj.id);
            setIsInterruptionOpen(true);
          }}
          activeHighlights={activeHighlights}
          hideFloatingBadge={
            isInterruptionOpen ||
            isAiModalOpen ||
            isTtsTesterOpen ||
            isReviewModalOpen ||
            isHistoryModalOpen
          }
        />

        {/* Bottom Playback Engine Dock (Mode Dependent) */}
        {studioMode === 'multi_stage_course' ? (
          <MultiStageCoursePlayer
            course={activeCourse}
            onUpdateCourse={setActiveCourse}
            objects={objects}
            setObjects={setObjects}
            onCommitAction={commitAction}
            viewport={viewport}
            setViewport={setViewport}
            onTriggerHighlight={triggerHighlight}
            onRaiseHand={(timeMs) => {
              setInterruptedTimestampMs(timeMs);
              setIsInterruptionOpen(true);
            }}
          />
        ) : studioMode === 'sync_lesson' ? (
          <SynchronizedLessonPlayer
            objects={objects}
            setObjects={setObjects}
            onCommitAction={commitAction}
            setViewport={setViewport}
            onTriggerHighlight={triggerHighlight}
            activeLesson={activeAiLesson}
            onRaiseHand={(timeMs) => {
              setInterruptedTimestampMs(timeMs);
              setIsInterruptionOpen(true);
            }}
          />
        ) : studioMode === 'replay_studio' ? (
          <SessionReplayPlayer
            session={activeSession}
            objects={objects}
            setObjects={setObjects}
            onCommitAction={commitAction}
            setViewport={setViewport}
            onTriggerHighlight={triggerHighlight}
          />
        ) : (
          <CommandPlayer
            objects={objects}
            setObjects={setObjects}
            onCommitAction={commitAction}
            setViewport={setViewport}
            onTriggerHighlight={triggerHighlight}
          />
        )}

        {/* Floating Debug / Inspector Drawer with Sleek Peek-on-Hover Tab */}
        {isInspectorOpen && (
          <aside
            onMouseEnter={() => setIsInspectorHovered(true)}
            onMouseLeave={() => setIsInspectorHovered(false)}
            className={`absolute right-0 top-4 bottom-32 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-t border-b border-indigo-500/30 rounded-l-2xl shadow-2xl flex flex-col z-30 transition-transform duration-300 ease-in-out ${
              isInspectorPinned || isInspectorHovered
                ? 'translate-x-0'
                : 'translate-x-[calc(100%-36px)]'
            }`}
          >
            {/* Left Edge Peek Strip Handle (always visible when collapsed) */}
            <div
              onClick={() => setIsInspectorPinned(!isInspectorPinned)}
              className="absolute left-0 top-0 bottom-0 w-9 flex flex-col items-center justify-between py-4 cursor-pointer bg-slate-950/60 hover:bg-slate-800/80 border-r border-slate-800/80 transition-colors select-none"
              title={isInspectorPinned ? 'Unpin Drawer (Auto-hide on leave)' : 'Hover to view or click to pin open'}
            >
              <div className="flex flex-col items-center gap-2.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="[writing-mode:vertical-lr] text-[10px] font-bold uppercase tracking-wider text-slate-400 rotate-180">
                  Inspector
                </span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-mono flex items-center justify-center font-bold">
                  {objects.length}
                </span>
                <ChevronLeft
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${
                    isInspectorPinned || isInspectorHovered ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>

            {/* Inner Content Container */}
            <div className="ml-9 flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Header */}
              <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs tracking-wide text-white">
                    State & Object Inspector
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {objects.length} {objects.length === 1 ? 'object' : 'objects'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsInspectorPinned(!isInspectorPinned)}
                    className={`p-1 rounded-lg border transition-colors ${
                      isInspectorPinned
                        ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                        : 'text-slate-400 hover:text-white border-transparent hover:bg-slate-800'
                    }`}
                    title={isInspectorPinned ? 'Unpin Drawer (Auto-hide on leave)' : 'Pin Drawer Open'}
                  >
                    {isInspectorPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setIsInspectorOpen(false)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Close Inspector"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
                {/* Selected Object Info */}
                {selectedObject ? (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-indigo-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-300">
                        Selected: {selectedObject.type}
                      </span>
                      <button
                        onClick={() => {
                          const updated = objects.filter((o) => o.id !== selectedObject.id);
                          setSelectedId(null);
                          commitAction(updated);
                        }}
                        className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded transition-colors"
                        title="Delete Object"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 break-all">
                      ID: {selectedObject.id}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      Author: <span className="text-indigo-400 font-semibold">{selectedObject.authoredBy}</span>
                    </div>
                    {selectedObject.linkedStepId && (
                      <div className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                        Linked Step: {selectedObject.linkedStepId}
                      </div>
                    )}
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[10px] text-slate-300 max-h-24 overflow-y-auto">
                      {JSON.stringify(selectedObject.geometry, null, 2)}
                    </div>

                    {/* Ask AI about this object button */}
                    <button
                      onClick={() => {
                        setIsInterruptionOpen(true);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95 mt-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Ask AI About This Component</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-slate-500 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Click any object on canvas to inspect, or raise hand to ask questions!</span>
                  </div>
                )}

                {/* Viewport Info */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-300">Viewport Metrics</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono text-[11px]">
                    <div>Scale: {Math.round(viewport.scale * 100)}%</div>
                    <div>Pan: {Math.round(viewport.x)}, {Math.round(viewport.y)}</div>
                  </div>
                </div>

                {/* Live JSON Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold">Live Canvas State (JSON)</span>
                    <button
                      onClick={handleCopyJson}
                      className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 px-2 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20 transition-colors"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 max-h-56 overflow-auto">
                    {JSON.stringify(objects, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
