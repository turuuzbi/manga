import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookMarked, MessageCircleMore, UserRound } from "lucide-react";
import prisma from "@/lib/db";
import {
  formatRelativeTime,
  getUserDisplayName,
  getUserInitial,
} from "@/lib/community";

export const dynamic = "force-dynamic";

type UserProfilePageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          bookmarks: true,
          comments: true,
        },
      },
      comments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        include: {
          manga: {
            select: {
              id: true,
              mangaName: true,
            },
          },
        },
      },
      bookmarks: {
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        include: {
          manga: {
            select: {
              id: true,
              mangaName: true,
              coverImage: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const displayName = getUserDisplayName(user);

  return (
    <main className="min-h-screen bg-[#fffdf8] px-4 pb-14 pt-24 text-[#1f1a16] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <Link
          href="/"
          className="motion-ink-up inline-flex items-center gap-2 text-sm font-semibold text-[#6a584c] transition hover:text-[#1e1813]"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <section className="panel-frame motion-ink-up motion-ink-up-delay-1 overflow-hidden">
          <div className="grid lg:grid-cols-[320px_1fr]">
            <div className="border-b-[3px] border-[#1a1108] bg-[#fff7ea] p-6 lg:border-b-0 lg:border-r-[3px]">
              <div className="flex items-center gap-4">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="h-20 w-20 rounded-full border-[3px] border-[#1a1108] object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-[#1a1108] bg-[#f5c518] text-3xl font-extrabold uppercase text-[#1a1108]">
                    {getUserInitial(user)}
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a57]">
                    Reader Profile
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-[#1a1108]">
                    {displayName}
                  </h1>
                  <p className="mt-2 text-sm text-[#6f5c50]">
                    Member since {user.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <StatCard label="Comments" value={String(user._count.comments)} />
                <StatCard label="Bookmarks" value={String(user._count.bookmarks)} />
              </div>
            </div>

            <div className="grid gap-6 p-6">
              <section className="panel-box bg-[#fffaf1]">
                <div className="border-b-2 border-[#1a1108] bg-[#fbf5ea] px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#1a1108]">
                    Recent Comments
                  </p>
                </div>
                <div className="p-4">
                  {user.comments.length === 0 ? (
                    <EmptyBlock
                      icon={<MessageCircleMore size={18} />}
                      title="No comments yet"
                      copy="Once this reader posts on a manga page, their recent comments will show up here."
                    />
                  ) : (
                    <div className="space-y-4">
                      {user.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="border-2 border-[#1a1108]/15 bg-[#fffdf8] px-4 py-4"
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <Link
                              href={`/manga/${comment.manga.id}`}
                              className="text-sm font-semibold text-[#1a1108] transition hover:text-[#e8637e]"
                            >
                              {comment.manga.mangaName}
                            </Link>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6a57]">
                              {formatRelativeTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-[#3f342b]">
                            {comment.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="panel-box bg-[#fffaf1]">
                <div className="border-b-2 border-[#1a1108] bg-[#fbf5ea] px-4 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#1a1108]">
                    Saved Manga
                  </p>
                </div>
                <div className="p-4">
                  {user.bookmarks.length === 0 ? (
                    <EmptyBlock
                      icon={<BookMarked size={18} />}
                      title="No bookmarks yet"
                      copy="Bookmarked manga will show up here so other readers can see what they follow."
                    />
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {user.bookmarks.map((bookmark) => (
                        <Link
                          key={bookmark.id}
                          href={`/manga/${bookmark.manga.id}`}
                          className="group overflow-hidden border-2 border-[#1a1108] bg-[#fffdf8] shadow-[3px_3px_0_#1a1108] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_#1a1108]"
                        >
                          <div className="aspect-[3/4] bg-[#fff8ed]">
                            {bookmark.manga.coverImage ? (
                              <img
                                src={bookmark.manga.coverImage}
                                alt={bookmark.manga.mangaName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[#d4c9b0]">
                                <UserRound size={28} />
                              </div>
                            )}
                          </div>
                          <div className="border-t-2 border-[#1a1108] px-4 py-3">
                            <p className="text-sm font-semibold text-[#1a1108] transition group-hover:text-[#e8637e]">
                              {bookmark.manga.mangaName}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-[#1a1108] bg-[#fffdf8] px-4 py-4 shadow-[3px_3px_0_#1a1108]">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#8a6a57]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[#1a1108]">{value}</p>
    </div>
  );
}

function EmptyBlock({
  icon,
  title,
  copy,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="border-2 border-dashed border-[#1a1108]/20 bg-[#fffdf8] px-5 py-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center border-2 border-[#1a1108] bg-[#f5c518] text-[#1a1108]">
        {icon}
      </div>
      <p className="mt-4 text-lg font-semibold text-[#1a1108]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#6f5c50]">{copy}</p>
    </div>
  );
}
