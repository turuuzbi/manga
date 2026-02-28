"use client";

import { Search, Clock, TrendingUp, Bell, User } from "lucide-react";
import { MangaCard } from "./_components/MangaCard";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { push } = useRouter();
  const latestUpdates = [
    {
      title: "manga 1",
      chapter: "42",
      isHot: true,
      image: "/att.1azSXSaLiT3pMbT-Qxsyd56KAayX1XVPPS7TWNHncmY.JPG",
    },
    {
      title: "manga 2",
      chapter: "185",
      isNew: true,
      image: "/att.1azSXSaLiT3pMbT-Qxsyd56KAayX1XVPPS7TWNHncmY.JPG",
    },
    {
      title: "manga 3",
      chapter: "210",
      isHot: true,
      image: "/att.1azSXSaLiT3pMbT-Qxsyd56KAayX1XVPPS7TWNHncmY.JPG",
    },
    {
      title: "manga 4",
      chapter: "612",
      image: "/att.1azSXSaLiT3pMbT-Qxsyd56KAayX1XVPPS7TWNHncmY.JPG",
    },
    {
      title: "manga 5",
      chapter: "254",
      isHot: true,
      image: "/att.1azSXSaLiT3pMbT-Qxsyd56KAayX1XVPPS7TWNHncmY.JPG",
    },
    {
      title: "manga 6",
      chapter: "160",
      isNew: true,
      image: "/att.1azSXSaLiT3pMbT-Qxsyd56KAayX1XVPPS7TWNHncmY.JPG",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300">
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black tracking-tighter text-white italic">
              turuu<span className="text-red-600">MANGA</span>
            </h1>
            <div className="hidden space-x-6 text-sm font-medium md:flex">
              <a href="#" className="text-white hover:text-red-500">
                Home
              </a>
              <a href="#" className="hover:text-red-500">
                Browse
              </a>
              <a href="#" className="hover:text-red-500">
                Popular
              </a>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-8">
            <div className="relative w-full max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search manga..."
                className="w-full rounded-full bg-zinc-900 py-2 pl-10 pr-4 text-sm border border-zinc-800 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="rounded-full p-2 hover:bg-zinc-800">
              <Bell size={20} />
            </button>
            <button className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition">
              <User size={18} />
              Login
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Featured Hero Slider (Static for now) */}
        <section className="relative mb-12 overflow-hidden rounded-xl bg-zinc-900 h-[400px]">
          <img
            src="https://images.unsplash.com/photo-1634655377962-e6e7b446e7e9?q=80&w=1200"
            className="absolute inset-0 h-full w-full object-cover opacity-50"
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8 max-w-xl">
            <span className="mb-2 inline-block rounded bg-red-600 px-2 py-1 text-xs font-bold text-white uppercase tracking-widest">
              Featured
            </span>
            <h2 className="mb-4 text-5xl font-black text-white italic uppercase leading-none">
              Demon Slayer: <br /> Kimetsu no Yaiba
            </h2>
            <p className="mb-6 text-zinc-300 line-clamp-2">
              Tanjiro Kamado, a kindhearted boy who sells charcoal for a living,
              finds his family slaughtered by a demon.
            </p>
            <button className="rounded bg-white px-8 py-3 font-bold text-black hover:bg-red-600 hover:text-white transition">
              READ NOW
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-red-600" size={24} />
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                  Latest Updates
                </h2>
              </div>
              <button className="text-sm font-semibold text-red-500 hover:underline">
                View All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
              {latestUpdates.map((manga, i) => (
                <div key={i} onClick={() => push("/manga")}>
                  <MangaCard {...manga} />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="text-red-600" size={20} />
                <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                  Top Weekly
                </h2>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((rank) => (
                  <div
                    key={rank}
                    className="flex items-center gap-4 group cursor-pointer"
                  >
                    <span
                      className={`text-2xl font-black ${rank === 1 ? "text-red-600" : "text-zinc-700"}`}
                    >
                      0{rank}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-zinc-200 group-hover:text-red-500 transition line-clamp-1">
                        Hero Killer
                      </h4>
                      <p className="text-xs text-zinc-500">Action, Fantasy</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-zinc-800 py-12 px-4">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-xl font-black italic text-white mb-4">
            turuumanga.mn
          </h2>
          <p className="text-xs text-zinc-600">turuu manga lol</p>
        </div>
      </footer>
    </div>
  );
}
