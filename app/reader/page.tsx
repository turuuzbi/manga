"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Rows3,
  Columns2,
  Maximize2,
  Home,
  Menu,
} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

// Mock images for the reader
const PAGES = [
  "/att.0_utHq1wtO3qcGLpMEL5zAkz-taRz11hJmDHHvEkIJ4.JPG",
  "/att.2U3tCkT5HGUUrJKVou2WHCQf9ibZ2NPE2a_3OB1wQ6M.JPG",
  "/att.a-HCaAERM7Ey9nROd47heRNK468njKSqWsd63g1Xm0A.JPG",
  "/att.N8ph0pe2IhkKXIepPDkk3upQQTFDe7-FjJ-Tqd8AekM.JPG",
  "/att.xGXDUtdOUABxQa7aOpIINT4S4wg7XSUqGbGGTmjxcRs.JPG",
];

type ViewMode = "vertical" | "horizontal";

export default function ReaderPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("vertical");
  const [currentPage, setCurrentPage] = useState(0);
  const [showUI, setShowUI] = useState(true);

  // Toggle UI visibility when clicking the center of the screen
  const toggleUI = (e: React.MouseEvent) => {
    // Prevent toggle if clicking buttons
    if ((e.target as HTMLElement).closest("button")) return;
    setShowUI(!showUI);
  };

  const nextSidePage = () => {
    if (currentPage < PAGES.length - 1) setCurrentPage((prev) => prev + 1);
  };

  const prevSidePage = () => {
    if (currentPage > 0) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-md border-b border-zinc-800 transition-transform duration-300 ${
          showUI ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-zinc-800 rounded-full transition">
            <Home size={20} />
          </button>
          <div>
            <h2 className="text-sm font-bold truncate max-w-[150px] md:max-w-none uppercase tracking-tight">
              Solo Leveling: Ragnarok
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              Chapter 142
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Reader Settings Popover */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md text-sm font-bold hover:bg-zinc-800 transition">
                <Settings size={16} />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="z-[60] w-64 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-2xl animate-in fade-in zoom-in-95"
                sideOffset={10}
              >
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">
                  Reading Mode
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setViewMode("vertical")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition ${viewMode === "vertical" ? "bg-red-600/10 border-red-600 text-red-500" : "bg-zinc-800 border-transparent text-zinc-400"}`}
                  >
                    <Rows3 size={20} />
                    <span className="text-[10px] font-bold uppercase">
                      Vertical
                    </span>
                  </button>
                  <button
                    onClick={() => setViewMode("horizontal")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition ${viewMode === "horizontal" ? "bg-red-600/10 border-red-600 text-red-500" : "bg-zinc-800 border-transparent text-zinc-400"}`}
                  >
                    <Columns2 size={20} />
                    <span className="text-[10px] font-bold uppercase">
                      Horizontal
                    </span>
                  </button>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          <button className="hidden sm:flex p-2 hover:bg-zinc-800 rounded-full">
            <Maximize2 size={20} />
          </button>
        </div>
      </header>

      {/* Main Reader Content */}
      <main
        className="flex-1 flex flex-col items-center cursor-pointer pt-16 pb-20"
        onClick={toggleUI}
      >
        {viewMode === "vertical" ? (
          /* Vertical Webtoon Style */
          <div className="w-full max-w-3xl flex flex-col items-center gap-1">
            {PAGES.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Page ${idx + 1}`}
                className="w-full h-auto object-contain select-none"
                loading="lazy"
              />
            ))}
          </div>
        ) : (
          /* Horizontal Traditional Style */
          <div className="relative w-full h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="relative h-full max-w-4xl w-full flex items-center justify-center">
              <img
                src={PAGES[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="h-full w-auto object-contain shadow-2xl animate-in fade-in duration-300"
              />

              {/* Click Areas for Horizontal Navigation */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1/4 z-10 hover:bg-white/5 transition-colors cursor-left"
                onClick={(e) => {
                  e.stopPropagation();
                  prevSidePage();
                }}
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-1/4 z-10 hover:bg-white/5 transition-colors cursor-right"
                onClick={(e) => {
                  e.stopPropagation();
                  nextSidePage();
                }}
              />
            </div>

            {/* Page Counter for Horizontal Mode */}
            <div className="absolute bottom-4 bg-black/60 px-3 py-1 rounded-full text-xs font-bold border border-white/10">
              {currentPage + 1} / {PAGES.length}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-4 bg-black/90 backdrop-blur-md border-t border-zinc-800 transition-transform duration-300 ${
          showUI ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center gap-6">
          <button className="group flex items-center gap-2 text-zinc-400 hover:text-white transition">
            <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">
              Prev
            </span>
          </button>

          <div className="h-6 w-[1px] bg-zinc-800" />

          <button className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-red-500">
            <Menu size={18} />
            <span className="hidden sm:inline">CHAPTER LIST</span>
          </button>

          <div className="h-6 w-[1px] bg-zinc-800" />

          <button className="group flex items-center gap-2 text-zinc-400 hover:text-white transition">
            <span className="text-sm font-bold uppercase tracking-widest">
              Next
            </span>
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </footer>
    </div>
  );
}
