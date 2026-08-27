"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Github, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#09090b]/85 backdrop-blur-xl border-b border-white/[0.07] py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#701a24]/20 border border-[#701a24]/40 text-stone-200 group-hover:border-[#701a24] transition-colors">
            <span className="font-bold text-sm tracking-tighter">B</span>
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#701a24]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-stone-200 transition-colors">
              Blindspot
            </span>
            <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-stone-400">
              AI
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-neutral-400 tracking-tight">
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-white transition-colors">
            How it Works
          </a>
          <Link href="/workspace" className="hover:text-white transition-colors">
            Workspace
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors tracking-tight px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.01 }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-neutral-950 hover:bg-neutral-200 text-xs font-semibold tracking-tight transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

