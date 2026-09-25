import { getCurrentDbUser } from "@/lib/auth";
import { getViewerFeedFlags } from "@/lib/chapter-feed";

/**
 * The per-reader half of the cached /updates page: premium (hide the locks)
 * and which of the shown chapters would spend a daily free read (so a tap asks
 * first). The browser only calls this for signed-in readers — guests cannot
 * spend free reads; the reader sends them to sign in.
 *
 * Body: { chapterIds: string[] } — the cards on screen.
 */
export async function POST(request: Request) {
  let chapterIds: string[] = [];

  try {
    const body = (await request.json()) as { chapterIds?: unknown };
    if (Array.isArray(body?.chapterIds)) {
      chapterIds = body.chapterIds
        .filter((id): id is string => typeof id === "string" && id.length <= 64)
        .slice(0, 60);
    }
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  try {
    const viewer = await getCurrentDbUser();
    const flags = await getViewerFeedFlags(viewer, chapterIds);

    return Response.json(flags, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[feed-flags] failed", error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
