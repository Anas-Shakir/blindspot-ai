'use client';

import React from 'react';
import {
  MousePointer,
  Hand,
  PenTool,
  Square,
  Circle,
  ArrowUpRight,
  Type,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Upload,
  Trash2,
} from 'lucide-react';
import { ToolType } from '@/lib/whiteboard/types';

interface ToolbarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
}

const COLORS = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Slate', value: '#94A3B8' },
  { label: 'Indigo', value: '#818CF8' },
  { label: 'Cyan', value: '#38BDF8' },
  { label: 'Emerald', value: '#34D399' },
  { label: 'Amber', value: '#FBBF24' },
  { label: 'Rose', value: '#FB7185' },
];

const STROKE_WIDTHS = [
  { label: 'Thin', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  setActiveTool,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onExportJson,
  onImportJson,
}) => {
  const tools: { id: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { id: 'select', icon: <MousePointer className="w-4 h-4" />, label: 'Select (V)', shortcut: 'V' },
    { id: 'pan', icon: <Hand className="w-4 h-4" />, label: 'Pan (H / Space)', shortcut: 'H' },
    { id: 'pen', icon: <PenTool className="w-4 h-4" />, label: 'Pen (P)', shortcut: 'P' },
    { id: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Rectangle (R)', shortcut: 'R' },
    { id: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Circle (O)', shortcut: 'O' },
    { id: 'arrow', icon: <ArrowUpRight className="w-4 h-4" />, label: 'Arrow (A)', shortcut: 'A' },
    { id: 'text', icon: <Type className="w-4 h-4" />, label: 'Text (T)', shortcut: 'T' },
    { id: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Eraser (E)', shortcut: 'E' },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-2xl text-slate-300">
      {/* Primary Tools */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/50">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
              className={`p-2 rounded-lg transition-all flex items-center justify-center relative group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-medium'
                  : 'hover:bg-slate-800/70 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tool.icon}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-950 text-slate-300 text-[10px] rounded border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-[1px] h-6 bg-slate-800" />

      {/* Colors */}
      <div className="flex items-center gap-1 px-1">
        {COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => setStrokeColor(c.value)}
            title={c.label}
            className={`w-5 h-5 rounded-full border transition-all ${
              strokeColor === c.value
                ? 'scale-110 border-white shadow-sm ring-2 ring-indigo-500/50'
                : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>

      <div className="w-[1px] h-6 bg-slate-800" />

      {/* Stroke width */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/50">
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w.value}
            onClick={() => setStrokeWidth(w.value)}
            title={w.label}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
              strokeWidth === w.value
                ? 'bg-slate-800 text-indigo-400 font-semibold'
                : 'hover:bg-slate-800/50 text-slate-400'
            }`}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: w.value * 1.5, height: w.value * 1.5 }}
            />
          </button>
        ))}
      </div>

      <div className="w-[1px] h-6 bg-slate-800" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-2 rounded-lg hover:bg-slate-800/70 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 hover:text-slate-200 transition-all"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y / Cmd+Shift+Z)"
          className="p-2 rounded-lg hover:bg-slate-800/70 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 hover:text-slate-200 transition-all"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      <div className="w-[1px] h-6 bg-slate-800" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded-xl border border-slate-800/50 text-xs font-mono text-slate-400">
        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-1 hover:text-slate-200 rounded transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onResetZoom}
          title="Reset Zoom to 100%"
          className="px-1 hover:text-indigo-400 font-semibold"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-1 hover:text-slate-200 rounded transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-[1px] h-6 bg-slate-800" />

      {/* Actions: Export / Import / Clear */}
      <div className="flex items-center gap-1">
        <button
          onClick={onExportJson}
          title="Export Board to JSON"
          className="p-2 rounded-lg hover:bg-slate-800/70 text-slate-400 hover:text-emerald-400 transition-all"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onImportJson}
          title="Import Board from JSON"
          className="p-2 rounded-lg hover:bg-slate-800/70 text-slate-400 hover:text-sky-400 transition-all"
        >
          <Upload className="w-4 h-4" />
        </button>
        <button
          onClick={onClear}
          title="Clear Board"
          className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
