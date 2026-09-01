'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  CanvasObject,
  ToolType,
  ViewportTransform,
  WhiteboardState,
} from '@/lib/whiteboard/types';
import { Toolbar } from '@/components/whiteboard/Toolbar';
import { WhiteboardCanvas } from '@/components/whiteboard/WhiteboardCanvas';
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

  // History for Undo / Redo
  const [historyPast, setHistoryPast] = useState<CanvasObject[][]>([]);
  const [historyFuture, setHistoryFuture] = useState<CanvasObject[][]>([]);

  // UI state
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [copiedJson, setCopiedJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Commit action to history stack
  const commitAction = useCallback(
    (newObjects: CanvasObject[]) => {
      setHistoryPast((prev) => [...prev, objects]);
      setHistoryFuture([]);
      setObjects(newObjects);
    },
    [objects]
  );

  // Undo / Redo handlers
  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, historyPast.length - 1);
    setHistoryFuture((prev) => [objects, ...prev]);
    setHistoryPast(newPast);
    setObjects(previous);
    setSelectedId(null);
  }, [historyPast, objects]);

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);
    setHistoryPast((prev) => [...prev, objects]);
    setHistoryFuture(newFuture);
    setObjects(next);
    setSelectedId(null);
  }, [historyFuture, objects]);

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

  // Load Preset Demos
  const loadPreset = (presetName: 'binary-tree' | 'circuit') => {
    if (presetName === 'binary-tree') {
      const bstDemo: CanvasObject[] = [
        {
          id: 'root-50',
          type: 'shape',
          authoredBy: 'user',
          geometry: { x: 300, y: 80, width: 70, height: 70, subtype: 'circle', label: '50' },
          style: { strokeColor: '#818CF8', strokeWidth: 3, opacity: 1, fillColor: 'rgba(99, 102, 241, 0.15)', fontSize: 18 },
          createdAt: Date.now(),
        },
        {
          id: 'node-30',
          type: 'shape',
          authoredBy: 'user',
          geometry: { x: 180, y: 220, width: 60, height: 60, subtype: 'circle', label: '30' },
          style: { strokeColor: '#34D399', strokeWidth: 3, opacity: 1, fillColor: 'rgba(52, 211, 153, 0.15)', fontSize: 16 },
          createdAt: Date.now(),
        },
        {
          id: 'node-70',
          type: 'shape',
          authoredBy: 'user',
          geometry: { x: 440, y: 220, width: 60, height: 60, subtype: 'circle', label: '70' },
          style: { strokeColor: '#38BDF8', strokeWidth: 3, opacity: 1, fillColor: 'rgba(56, 189, 248, 0.15)', fontSize: 16 },
          createdAt: Date.now(),
        },
        {
          id: 'arrow-left',
          type: 'arrow',
          authoredBy: 'user',
          geometry: { from: { x: 310, y: 145 }, to: { x: 230, y: 220 }, arrowheadEnd: true },
          style: { strokeColor: '#94A3B8', strokeWidth: 2, opacity: 1 },
          createdAt: Date.now(),
        },
        {
          id: 'arrow-right',
          type: 'arrow',
          authoredBy: 'user',
          geometry: { from: { x: 360, y: 145 }, to: { x: 450, y: 220 }, arrowheadEnd: true },
          style: { strokeColor: '#94A3B8', strokeWidth: 2, opacity: 1 },
          createdAt: Date.now(),
        },
        {
          id: 'text-title',
          type: 'text',
          authoredBy: 'user',
          geometry: { x: 230, y: 25, text: 'Binary Search Tree (BST)' },
          style: { strokeColor: '#F8FAFC', strokeWidth: 1, opacity: 1, fontSize: 22, fontFamily: 'sans-serif' },
          createdAt: Date.now(),
        },
      ];
      commitAction(bstDemo);
      setViewport({ x: 100, y: 80, scale: 1.0 });
    } else if (presetName === 'circuit') {
      const circuitDemo: CanvasObject[] = [
        {
          id: 'battery-rect',
          type: 'shape',
          authoredBy: 'user',
          geometry: { x: 120, y: 150, width: 90, height: 50, subtype: 'rectangle', label: '9V DC' },
          style: { strokeColor: '#FB7185', strokeWidth: 3, opacity: 1, fillColor: 'rgba(251, 113, 133, 0.15)' },
          createdAt: Date.now(),
        },
        {
          id: 'resistor-rect',
          type: 'shape',
          authoredBy: 'user',
          geometry: { x: 340, y: 150, width: 110, height: 50, subtype: 'rectangle', label: '100 Ω Resistor' },
          style: { strokeColor: '#FBBF24', strokeWidth: 3, opacity: 1, fillColor: 'rgba(251, 191, 36, 0.15)' },
          createdAt: Date.now(),
        },
        {
          id: 'wire-top',
          type: 'arrow',
          authoredBy: 'user',
          geometry: { from: { x: 210, y: 175 }, to: { x: 340, y: 175 }, arrowheadEnd: true },
          style: { strokeColor: '#38BDF8', strokeWidth: 3, opacity: 1 },
          createdAt: Date.now(),
        },
        {
          id: 'circuit-text',
          type: 'text',
          authoredBy: 'user',
          geometry: { x: 230, y: 140, text: 'I = 90 mA' },
          style: { strokeColor: '#38BDF8', strokeWidth: 1, opacity: 1, fontSize: 16 },
          createdAt: Date.now(),
        },
      ];
      commitAction(circuitDemo);
      setViewport({ x: 120, y: 100, scale: 1.0 });
    }
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
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to App
          </Link>
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Whiteboard Lab
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
              Step 1 — Standalone Canvas Engine
            </span>
          </div>
        </div>

        {/* Preset demo loaders */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Load Template:
          </span>
          <button
            onClick={() => loadPreset('binary-tree')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Binary Tree
          </button>
          <button
            onClick={() => loadPreset('circuit')}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            Ohm's Circuit
          </button>

          <button
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition-colors ml-2"
            title={isInspectorOpen ? 'Collapse Inspector' : 'Expand Inspector'}
          >
            <Code2 className="w-4 h-4 text-indigo-400" />
          </button>
        </div>
      </header>

      {/* Main Canvas Workspace */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Floating Toolbar */}
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
        />

        {/* Floating Debug / Inspector Drawer */}
        {isInspectorOpen && (
          <aside className="absolute right-4 top-4 bottom-4 w-80 bg-slate-900/95 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-2xl flex flex-col z-20 overflow-hidden">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-xs tracking-wide uppercase text-slate-200">
                  State Inspector
                </span>
              </div>
              <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {objects.length} {objects.length === 1 ? 'object' : 'objects'}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
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
                    Author: <span className="text-slate-200 font-semibold">{selectedObject.authoredBy}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[10px] text-slate-300 max-h-24 overflow-y-auto">
                    {JSON.stringify(selectedObject.geometry, null, 2)}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-slate-500 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Click any object on the canvas with the Select tool to inspect.</span>
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
                  <span className="font-semibold">Serialized State (JSON)</span>
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
          </aside>
        )}
      </div>
    </div>
  );
}
