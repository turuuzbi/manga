import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth";
import { listChapterComments } from "@/lib/chapter-comments";

/**
 * GET /api/comments/[chapterId]?cursor=… — one page of a chapter's comments,
 * newest first. Public (guests can read from the homepage carousel); the
 * session only decides which comments come back deletable.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> },
) {
  const { chapterId } = await params;

  if (!/^[A-Za-z0-9_-]{1,64}$/.test(chapterId)) {
    return NextResponse.json({ error: "bad chapter" }, { status: 400 });
  }

  const cursor = new URL(request.url).searchParams.get("cursor");
  const viewer = await getCurrentDbUser();
  const page = await listChapterComments({ chapterId, cursor, viewer });

  return NextResponse.json(page, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
