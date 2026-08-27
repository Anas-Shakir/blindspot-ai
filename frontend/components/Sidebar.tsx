"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  AudioWaveform,
  Network,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  LogOut,
  ChevronRight,
  Headphones,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  shortcut?: string;
}

export interface SidebarProps {
  initialCollapsed?: boolean;
  className?: string;
  currentPathOverride?: string;
  onNavigate?: (href: string) => void;
}

const defaultNavItems: NavItem[] = [
  {
    id: "workspace",
    label: "Workspace",
    href: "/workspace",
    icon: Compass,
    shortcut: "⌘1",
  },
  {
    id: "lectures",
    label: "Lectures",
    href: "#lectures",
    icon: AudioWaveform,
    badge: "3",
    shortcut: "⌘2",
  },
  {
    id: "graph",
    label: "Knowledge Graph",
    href: "#graph",
    icon: Network,
    shortcut: "⌘3",
  },
  {
    id: "settings",
    label: "Settings",
    href: "#settings",
    icon: Sliders,
    shortcut: "⌘,",
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  initialCollapsed = false,
  className,
  currentPathOverride,
  onNavigate,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const pathname = usePathname();
  const activePath = currentPathOverride || pathname || "/workspace";

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  // Spring transition physics according to Emil Kowalski standard
  const springTransition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 28,
  };

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? 72 : 256,
      }}
      transition={springTransition}
      className={cn(
        "relative flex flex-col justify-between h-screen shrink-0 z-40 select-none",
        "bg-[#09090b]/90 backdrop-blur-xl border-r border-white/[0.07]",
        "text-stone-300 font-sans overflow-hidden",
        className
      )}
    >
      {/* Top Section: Brand Header & Navigation */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.07]">
          <Link
            href="/"
            className="flex items-center gap-3 overflow-hidden group focus:outline-none"
          >
            {/* Minimalist Logo Mark with Oxblood Burgundy Tone */}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#701a24]/20 border border-[#701a24]/40 text-stone-200 group-hover:border-[#701a24] transition-colors duration-200">
              <span className="font-bold text-sm tracking-tighter">B</span>
              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#701a24]" />
            </div>

            {/* App Title with animated crossfade on collapse */}
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-baseline gap-1.5 whitespace-nowrap overflow-hidden"
                >
                  <span className="text-sm font-semibold tracking-tight text-white group-hover:text-stone-200 transition-colors">
                    Blindspot
                  </span>
                  <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-stone-400">
                    AI
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* Collapsible toggle trigger */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:text-white",
              "hover:bg-white/[0.05] transition-colors cursor-pointer focus:outline-none",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </motion.button>
        </div>

        {/* Section Label */}
        <div className="px-4 pt-5 pb-2">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="text-[10px] font-mono font-semibold uppercase tracking-widest text-stone-500 block px-2"
              >
                Navigation
              </motion.span>
            ) : (
              <div className="h-[1px] w-6 mx-auto bg-white/[0.08]" />
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items List */}
        <nav className="px-2 space-y-1 overflow-y-auto overflow-x-hidden flex-1 py-1">
          {defaultNavItems.map((item) => {
            const isActive =
              activePath === item.href ||
              (item.href === "/workspace" && activePath.startsWith("/workspace"));

            const Icon = item.icon;

            return (
              <motion.div key={item.id} whileTap={{ scale: 0.97 }}>
                <Link
                  href={item.href}
                  onClick={() => onNavigate?.(item.href)}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium tracking-tight",
                    "transition-colors duration-150 cursor-pointer focus:outline-none",
                    isActive
                      ? "bg-zinc-900/80 text-stone-100 border-l-2 border-[#701a24]"
                      : "text-stone-400 hover:text-stone-200 hover:bg-white/[0.04] border-l-2 border-transparent"
                  )}
                >
                  {/* Icon */}
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors duration-150",
                      isActive
                        ? "text-stone-200"
                        : "text-stone-400 group-hover:text-stone-200"
                    )}
                  />

                  {/* Label & Badges */}
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.14 }}
                        className="flex items-center justify-between flex-1 whitespace-nowrap overflow-hidden"
                      >
                        <span className="truncate">{item.label}</span>

                        <div className="flex items-center gap-1.5 ml-2">
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-[#701a24]/25 text-stone-300 border border-[#701a24]/40">
                              {item.badge}
                            </span>
                          )}
                          {item.shortcut && (
                            <kbd className="hidden sm:inline-block text-[10px] font-mono text-stone-500 group-hover:text-stone-400">
                              {item.shortcut}
                            </kbd>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Collapsed Active Indicator */}
                  {isCollapsed && isActive && (
                    <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-[#701a24]" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Active Session Module & User Profile */}
      <div className="p-3 space-y-3 border-t border-white/[0.07]">
        {/* Active Session Module */}
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/[0.07] backdrop-blur-md shadow-sm relative overflow-hidden group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#701a24]/20 border border-[#701a24]/40 text-stone-300">
                    <Headphones className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-300 font-semibold">
                    Active Session
                  </span>
                </div>

                {/* Circular Progress Ring */}
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-stone-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#701a24] transition-all duration-500 ease-out"
                      strokeDasharray="68, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="#701a24"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[8px] font-mono font-semibold text-stone-200">
                    68%
                  </span>
                </div>
              </div>

              <h4 className="text-xs font-semibold text-stone-100 truncate mb-0.5 tracking-tight">
                Dynamic Market Equilibria
              </h4>
              <p className="text-[11px] text-stone-400 font-normal truncate mb-2.5">
                Phase 1: Supply & Demand
              </p>

              <Link
                href="/workspace"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-300 hover:text-white transition-colors"
              >
                <span>Resume Lecture</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center p-2 rounded-xl bg-zinc-900/60 border border-white/[0.07] text-stone-300"
              title="Dynamic Market Equilibria (68% Complete)"
            >
              <div className="relative flex items-center justify-center">
                <svg className="w-7 h-7 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-stone-800"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    strokeDasharray="68, 100"
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="#701a24"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute h-2 w-2 rounded-full bg-[#701a24]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User / Profile Footer */}
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl bg-zinc-900/60 border border-white/[0.07]",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Minimalist Avatar with Burgundy Ring */}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#701a24] to-zinc-800 text-white font-semibold text-xs border border-white/10 shadow-sm">
              <span>UC</span>
              <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-stone-950" />
            </div>

            {/* Profile Info */}
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.14 }}
                  className="flex flex-col text-left whitespace-nowrap overflow-hidden"
                >
                  <span className="text-xs font-semibold text-stone-200 truncate">
                    Umair Ch
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono truncate">
                    Student Scholar
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logout / Options Button */}
          {!isCollapsed && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              className="p-1.5 text-stone-500 hover:text-stone-300 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer focus:outline-none"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
