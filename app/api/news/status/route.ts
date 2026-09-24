import { getCurrentDbUser } from "@/lib/auth";
import { getNewsStatus } from "@/lib/news";

/**
 * Unread МЭДЭЭ state for the badge and the one-time popup, plus the reader's
 * applied background. Called once per page load by lib/news-client.
 *
 * A route handler rather than a Server Action on purpose: Next runs a client's
 * Server Actions one at a time, so a status check fired on every page load
 * would queue in front of real work like marking a chapter read.
 *
 * Body: { seen?: string[] } — the item keys this browser has seen while signed
 * out, merged into the account on sign-in.
 */
export async function POST(request: Request) {
  let seen: unknown = [];

  try {
    const body = (await request.json()) as { seen?: unknown };
    seen = body?.seen ?? [];
  } catch {
    // An empty or malformed body just means "nothing seen yet".
  }

  try {
    const user = await getCurrentDbUser();
    const status = await getNewsStatus(user, seen);

    return Response.json(status, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[news] status failed", error);
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
