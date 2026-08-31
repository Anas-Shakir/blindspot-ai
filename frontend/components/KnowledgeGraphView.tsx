"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  AlertTriangle,
  Search,
  Sparkles,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, GraphNode, GraphEdge } from "@/lib/api";

interface KnowledgeGraphViewProps {
  lectureId: number | string;
  onJumpToTimestamp?: (startSec: number) => void;
  onAskTutor?: (question: string) => void;
  className?: string;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  lectureId,
  onJumpToTimestamp,
  onAskTutor,
  className,
}) => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "gaps">("all");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fetch live knowledge graph from GET /api/lectures/{id}/graph
  useEffect(() => {
    if (!lectureId) return;

    let isMounted = true;
    setIsLoading(true);

    api
      .getGraph(lectureId)
      .then((data) => {
        if (!isMounted) return;
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        if (data.nodes && data.nodes.length > 0) {
          setSelectedNodeId(data.nodes[0].id);
        }
      })
      .catch((err) => {
        console.warn("Failed to load knowledge graph:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lectureId]);

  // Filtered nodes based on search & filter mode
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesSearch =
        !searchQuery || node.label.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMode = filterMode === "all" || (filterMode === "gaps" && node.is_gap);
      return matchesSearch && matchesMode;
    });
  }, [nodes, searchQuery, filterMode]);

  // Compute layout coordinates for nodes in an organic concentric graph
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const total = nodes.length;
    if (total === 0) return positions;

    const centerX = 450;
    const centerY = 350;

    // Group nodes into Core Concepts vs Gap Concepts
    const coreNodes = nodes.filter((n) => !n.is_gap);
    const gapNodes = nodes.filter((n) => n.is_gap);

    // Inner ring for Core Concepts
    coreNodes.forEach((node, i) => {
      const radius = 220;
      const angle = (i / Math.max(1, coreNodes.length)) * 2 * Math.PI - Math.PI / 2;
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    // Outer ring for Blindspot Gap Concepts
    gapNodes.forEach((node, i) => {
      const radius = 350;
      const angle = (i / Math.max(1, gapNodes.length)) * 2 * Math.PI - Math.PI / 3;
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    return positions;
  }, [nodes]);

  // Currently selected node object
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Connected edges and neighbors for selected node
  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [edges, selectedNodeId]);

  const neighborNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    const neighborIds = new Set<string>();
    connectedEdges.forEach((e) => {
      if (e.source === selectedNodeId) neighborIds.add(e.target);
      if (e.target === selectedNodeId) neighborIds.add(e.source);
    });
    return nodes.filter((n) => neighborIds.has(n.id));
  }, [nodes, connectedEdges, selectedNodeId]);

  // Stats
  const gapCount = useMemo(() => nodes.filter((n) => n.is_gap).length, [nodes]);
  const coreCount = nodes.length - gapCount;

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const formatTimestamp = (sec?: number | null) => {
    if (typeof sec !== "number") return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "relative flex flex-col lg:flex-row h-full w-full bg-[#09090b] text-neutral-100 overflow-hidden select-none",
        className
      )}
    >
      {/* 1. Main Graph Canvas Area (70% Width) */}
      <div className="flex-1 relative flex flex-col h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-white/[0.08]">
        {/* Top Floating Controls Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2 pointer-events-auto bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-xl border border-white/[0.08] shadow-xl">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-black/40 rounded-lg border border-white/[0.05]">
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none w-32 sm:w-44"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-lg text-[11px] font-medium">
              <button
                onClick={() => setFilterMode("all")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-colors",
                  filterMode === "all"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                All ({nodes.length})
              </button>
              <button
                onClick={() => setFilterMode("gaps")}
                className={cn(
                  "px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors",
                  filterMode === "gaps"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-neutral-400 hover:text-amber-300"
                )}
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>Gaps ({gapCount})</span>
              </button>
            </div>
          </div>

          {/* Zoom & View Controls */}
          <div className="flex items-center gap-1 pointer-events-auto bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-xl border border-white/[0.08] shadow-xl">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.15))}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-neutral-300 hover:text-white transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive SVG / Graph Viewport */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px]"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-400">
              <Network className="w-8 h-8 text-neutral-500 animate-pulse" />
              <span className="text-xs font-mono">Loading knowledge graph...</span>
            </div>
          ) : (
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.1s ease-out",
              }}
              className="w-[900px] h-[700px] absolute inset-0 m-auto"
            >
              {/* SVG Link Edges */}
              <svg className="w-full h-full absolute inset-0 pointer-events-none">
                <defs>
                  <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="gap-edge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                {edges.map((edge, idx) => {
                  const sourcePos = nodePositions[edge.source];
                  const targetPos = nodePositions[edge.target];
                  if (!sourcePos || !targetPos) return null;

                  const isConnectedToSelected =
                    edge.source === selectedNodeId || edge.target === selectedNodeId;

                  return (
                    <g key={`edge-${idx}`}>
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={
                          isConnectedToSelected
                            ? "#38bdf8"
                            : "rgba(255, 255, 255, 0.12)"
                        }
                        strokeWidth={isConnectedToSelected ? 2.5 : 1.2}
                        strokeDasharray={isConnectedToSelected ? "none" : "4 4"}
                        className="transition-all duration-300"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Concept Nodes */}
              {filteredNodes.map((node) => {
                const pos = nodePositions[node.id];
                if (!pos) return null;

                const isSelected = node.id === selectedNodeId;
                const isNeighbor = neighborNodes.some((n) => n.id === node.id);

                return (
                  <motion.div
                    key={node.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                    }}
                    style={{
                      left: pos.x,
                      top: pos.y,
                    }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.96 }}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer p-3 rounded-2xl border backdrop-blur-md shadow-lg transition-all duration-200 flex items-center gap-2 max-w-[220px]",
                      isSelected
                        ? "bg-zinc-800/95 border-sky-400 ring-2 ring-sky-400/30 z-30 shadow-sky-500/20"
                        : node.is_gap
                        ? "bg-amber-950/40 border-amber-500/50 hover:border-amber-400 z-20 shadow-amber-500/10"
                        : isNeighbor
                        ? "bg-zinc-900/90 border-sky-500/40 hover:border-sky-400 z-10"
                        : "bg-zinc-900/80 border-white/[0.08] hover:border-white/[0.2] z-10"
                    )}
                  >
                    {node.is_gap ? (
                      <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                        <Network className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-neutral-100 truncate">
                        {node.label}
                      </span>
                      {node.is_gap && (
                        <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                          Blindspot Gap
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/[0.08] text-[11px] font-mono text-neutral-400 shadow-xl">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Core Concept ({coreCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Blindspot Gap ({gapCount})</span>
          </div>
        </div>
      </div>

      {/* 2. Concept Detail Inspector Panel (30% Width) */}
      <div className="w-full lg:w-96 flex flex-col h-full bg-[#0d0d10] p-6 overflow-y-auto border-t lg:border-t-0 border-white/[0.08]">
        {selectedNode ? (
          <div className="flex flex-col justify-between h-full space-y-6">
            <div className="space-y-5">
              {/* Badge & Type */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1.5",
                    selectedNode.is_gap
                      ? "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                      : "bg-sky-950/60 text-sky-300 border border-sky-500/30"
                  )}
                >
                  {selectedNode.is_gap ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Blindspot Gap Concept</span>
                    </>
                  ) : (
                    <>
                      <Network className="w-3 h-3 text-sky-400" />
                      <span>Core Lecture Topic</span>
                    </>
                  )}
                </span>

                {selectedNode.source_timestamp && (
                  <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>{formatTimestamp(selectedNode.source_timestamp.start)}</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                  {selectedNode.label}
                </h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  {selectedNode.is_gap
                    ? "This concept is foundational to understanding the lecture but was assumed or under-explained by the instructor."
                    : "Extracted directly from the lecture transcript and connected to prerequisite ideas."}
                </p>
              </div>

              {/* Jump to Timestamp Action */}
              {selectedNode.source_timestamp && onJumpToTimestamp && (
                <button
                  onClick={() =>
                    onJumpToTimestamp(selectedNode.source_timestamp?.start || 0)
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] hover:border-white/[0.15] text-xs font-semibold text-neutral-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Jump to Lecture Excerpt (
                    {formatTimestamp(selectedNode.source_timestamp.start)})
                  </span>
                </button>
              )}

              {/* Connected Concepts / Relationships */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Connected Concepts ({neighborNodes.length})</span>
                </span>

                <div className="flex flex-col gap-2">
                  {neighborNodes.length === 0 ? (
                    <span className="text-xs text-neutral-500 italic">
                      No direct adjacent nodes in current slice.
                    </span>
                  ) : (
                    neighborNodes.map((neighbor) => (
                      <div
                        key={neighbor.id}
                        onClick={() => setSelectedNodeId(neighbor.id)}
                        className="p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/[0.05] hover:border-white/[0.12] flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              neighbor.is_gap ? "bg-amber-400" : "bg-sky-400"
                            )}
                          />
                          <span className="text-xs text-neutral-200 truncate group-hover:text-white">
                            {neighbor.label}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Ask AI Tutor Prompt */}
            {onAskTutor && (
              <div className="pt-4 border-t border-white/[0.08]">
                <button
                  onClick={() =>
                    onAskTutor(
                      `Can you explain the concept of "${selectedNode.label}" and how it connects to our lecture?`
                    )
                  }
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-stone-200 to-stone-100 hover:from-white hover:to-stone-200 text-neutral-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-white/5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#701a24]" />
                  <span>Ask AI Tutor About This</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 gap-2">
            <Network className="w-8 h-8 text-neutral-600" />
            <span className="text-xs">Select any concept node on the graph to inspect details.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraphView;
