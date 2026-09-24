import { getCurrentDbUser } from "@/lib/auth";
import { markSeenForUser } from "@/lib/news";

/**
 * Marks МЭДЭЭ items seen (popup dismissed, or the item opened). Signed-out
 * readers keep this in localStorage only, so for them this is a no-op.
 *
 * Body: { keys: string[] } — "a:<articleId>" / "n:<notificationId>".
 */
export async function POST(request: Request) {
  let keys: unknown = [];

  try {
    const body = (await request.json()) as { keys?: unknown };
    keys = body?.keys ?? [];
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  try {
    const user = await getCurrentDbUser();

    if (user) {
      await markSeenForUser(user.id, keys);
    }

    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[news] mark seen failed", error);
    return Response.json({ ok: false }, { status: 503 });
  }
}
