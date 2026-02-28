"use client";
import {
  Play,
  Bookmark,
  Star,
  Clock,
  Eye,
  ListFilter,
  ArrowLeft,
  Heart,
} from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import { useRouter } from "next/navigation";

export default function MangaDetailPage() {
  const { push } = useRouter();
  const manga = {
    title: "high school sucks",
    altTitle: "나 혼자만",
    author: "turuu",
    artist: "turuk_ii",
    rating: "5",
    views: "1000M",
    status: "Ongoing",
    description: "turuugiin ynztai manga turuk_ii zursn puahahah",
    genres: ["Action", "Adventure", "Fantasy", "Shonen"],
    chapters: Array.from({ length: 20 }, (_, i) => ({
      number: 20 - i,
      date: "2 days ago",
      id: `ch-${20 - i}`,
    })),
    cover: "/att.1azSXSaLiT3pMbT-Qxsyd56KAayX1XVPPS7TWNHncmY.JPG",
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 pb-20">
      <div className="relative h-[400px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-xl scale-110 opacity-30"
          style={{ backgroundImage: `url(${manga.cover})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 -mt-64 relative z-10">
        <button
          onClick={() => push("/")}
          className="mb-6 flex items-center gap-2 text-sm font-medium hover:text-white transition group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Browse
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Cover & Quick Stats */}
          <div className="w-full md:w-72 shrink-0">
            <div className="sticky top-24">
              <div className="aspect-[2/3] w-full overflow-hidden rounded-xl border border-zinc-800 shadow-2xl">
                <img
                  src={manga.cover}
                  alt={manga.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => push("/reader")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 font-bold text-white hover:bg-red-700 transition"
                >
                  <Play size={20} fill="currentColor" />
                  READ CHAPTER 1
                </button>
                <div className="flex gap-2">
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 py-3 font-semibold hover:bg-zinc-800 transition">
                    <Bookmark size={18} />
                    Save
                  </button>
                  <button className="flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 p-3 hover:bg-zinc-800 transition">
                    <Heart size={18} />
                  </button>
                </div>
              </div>

              {/* Sidebar Metadata */}
              <div className="mt-8 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <span className="text-green-500 font-bold">
                    {manga.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Author</span>
                  <span className="text-white">{manga.author}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Updated</span>
                  <span className="text-white">Oct 24, 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Synopsis, Chapters */}
          <div className="flex-1">
            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                {manga.title}
              </h1>
              <p className="text-lg text-zinc-500 font-medium mb-4">
                {manga.altTitle}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={16} fill="currentColor" />
                  <span className="font-bold">{manga.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                  <Eye size={16} />
                  <span>{manga.views} views</span>
                </div>
                <div className="h-4 w-[1px] bg-zinc-800" />
                <div className="flex gap-2">
                  {manga.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:border-red-600 hover:text-white cursor-pointer transition"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </header>

            <Tabs.Root defaultValue="chapters" className="mt-10">
              <Tabs.List className="flex border-b border-zinc-800 gap-8 mb-6">
                <Tabs.Trigger
                  value="chapters"
                  className="pb-4 text-sm font-bold uppercase tracking-widest text-zinc-500 data-[state=active]:text-red-500 data-[state=active]:border-b-2 data-[state=active]:border-red-500 transition-all"
                >
                  Chapters
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="details"
                  className="pb-4 text-sm font-bold uppercase tracking-widest text-zinc-500 data-[state=active]:text-red-500 data-[state=active]:border-b-2 data-[state=active]:border-red-500 transition-all"
                >
                  Synopsis
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content
                value="details"
                className="animate-in fade-in slide-in-from-bottom-2"
              >
                <p className="text-lg leading-relaxed text-zinc-300">
                  {manga.description}
                </p>
              </Tabs.Content>

              <Tabs.Content
                value="chapters"
                className="animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="mb-4 flex items-center justify-between px-2">
                  <span className="text-sm font-bold text-zinc-400 uppercase tracking-tighter">
                    {manga.chapters.length} Chapters Found
                  </span>
                  <button className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white">
                    <ListFilter size={14} />
                    Sort
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {manga.chapters.map((chapter) => (
                    <a
                      key={chapter.id}
                      href={`/reader/${chapter.id}`}
                      className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-4 hover:border-red-600/50 hover:bg-zinc-800/50 transition group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-zinc-700 group-hover:text-red-500 transition">
                          #{chapter.number}
                        </span>
                        <span className="font-bold text-zinc-200">
                          Chapter {chapter.number}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                        <span className="hidden sm:inline">Free</span>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {chapter.date}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </div>
      </div>
    </div>
  );
}
