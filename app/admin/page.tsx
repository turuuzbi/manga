"use client";

import React, { useState } from "react";

const SovereignConsole = () => {
  const [mangaTitle, setMangaTitle] = useState("");

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-amber-500/30 selection:text-white">
      {/* BACKGROUND: ARCHITECTURAL DEPTH */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-amber-600/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-16">
        {/* HEADER: RESPONSIVE & AUTHORITATIVE */}
        <header className="mb-12 flex flex-col justify-between gap-6 border-b border-zinc-800 pb-10 md:flex-row md:items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-amber-600">
              <span className="h-2 w-2 bg-amber-500" /> Administrative Access //
              Root
            </div>
            <h1 className="text-4xl font-light tracking-tighter text-white sm:text-6xl lg:text-7xl">
              MANGA<span className="font-black text-amber-500">VAULT</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right md:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                System Status
              </p>
              <p className="text-xs font-medium text-amber-500">
                Optimal // All Nodes Active
              </p>
            </div>
            <button className="bg-amber-600 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-white active:scale-95">
              Sync Database
            </button>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1fr_350px]">
          {/* MAIN MODULES */}
          <main className="space-y-12">
            {/* SECTION: SERIES REGISTER */}
            <section className="border border-zinc-800 bg-[#0A0A0A] p-6 sm:p-10">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-white">
                  01. Series Registration
                </h2>
                <div className="h-px flex-1 bg-zinc-800 ml-6 hidden sm:block" />
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Series Designation
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Title..."
                    className="w-full border border-zinc-800 bg-black p-4 text-sm font-medium text-white outline-none transition-all focus:border-amber-600 focus:ring-1 focus:ring-amber-600/20"
                    value={mangaTitle}
                    onChange={(e) => setMangaTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Publication Status
                  </label>
                  <select className="w-full appearance-none border border-zinc-800 bg-black p-4 text-sm font-medium text-white outline-none transition-all focus:border-amber-600">
                    <option>Serialization Active</option>
                    <option>Archival Complete</option>
                    <option>Indefinite Hiatus</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Identity Artwork
                  </label>
                  <div className="group relative flex h-32 cursor-pointer items-center justify-center border border-dashed border-zinc-800 bg-black transition hover:border-amber-600/50 hover:bg-amber-600/[0.02]">
                    <input
                      type="file"
                      className="absolute inset-0 z-10 cursor-pointer opacity-0"
                    />
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 group-hover:text-amber-500">
                        Upload Source File
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button className="mt-10 w-full border border-amber-600 bg-transparent py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500 transition hover:bg-amber-600 hover:text-black">
                Confirm Series Entry
              </button>
            </section>

            {/* SECTION: BATCH INGEST */}
            <section className="border border-zinc-800 bg-[#0A0A0A] p-6 sm:p-10">
              <h2 className="mb-8 text-lg font-bold uppercase tracking-[0.2em] text-white">
                02. Volumetric Ingest
              </h2>
              <div className="flex h-40 flex-col items-center justify-center border border-zinc-900 bg-black p-6 text-center transition hover:border-zinc-700">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  Drop Chapter Directories or .CBZ Assets
                </p>
                <div className="mt-4 h-[1px] w-12 bg-amber-900" />
              </div>
            </section>
          </main>

          {/* SIDEBAR: SYSTEM TELEMETRY */}
          <aside className="space-y-6">
            <div className="border border-zinc-800 bg-[#0A0A0A] p-8">
              <h3 className="mb-8 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">
                Library Telemetry
              </h3>

              <div className="grid grid-cols-2 gap-8 lg:grid-cols-1">
                <StatItem
                  label="Total Records"
                  value="2,401"
                  trend="+12 This Week"
                />
                <StatItem
                  label="Data Weight"
                  value="84.2 GB"
                  trend="82% Capacity"
                />
                <StatItem
                  label="Last Index"
                  value="14:02"
                  trend="Mar 01, 2026"
                />
              </div>

              <div className="mt-10 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                  <span>Vault Storage</span>
                  <span className="text-amber-500">82.4%</span>
                </div>
                <div className="h-1 w-full bg-zinc-900">
                  <div className="h-full w-[82%] bg-amber-600 shadow-[0_0_10px_rgba(212,175,55,0.2)]" />
                </div>
              </div>
            </div>

            <nav className="border border-zinc-800 bg-[#0A0A0A] p-2">
              <SidebarLink label="Master Index" active />
              <SidebarLink label="System Logs" />
              <SidebarLink label="Node Config" />
              <SidebarLink label="Database Shell" />
            </nav>
          </aside>
        </div>
      </div>
    </div>
  );
};

/* --- REUSABLE UI --- */

function StatItem({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
        {label}
      </p>
      <p className="text-3xl font-light text-white">{value}</p>
      <p className="mt-1 text-[9px] font-medium text-amber-900 italic">
        {trend}
      </p>
    </div>
  );
}

function SidebarLink({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`flex w-full items-center justify-between p-4 text-[10px] font-bold uppercase tracking-widest transition-all ${active ? "bg-amber-600 text-black" : "text-zinc-500 hover:bg-zinc-900 hover:text-white"}`}
    >
      <span>{label}</span>
      {active && <div className="h-1 w-1 bg-black" />}
    </button>
  );
}

export default SovereignConsole;
