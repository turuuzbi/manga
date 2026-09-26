import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentDbUser } from "@/lib/auth";
import { DEVICE_COOKIE, isDeviceId, recordArticleView } from "@/lib/news";

/**
 * Records a view of an МЭДЭЭ article, called by the article page when it
 * opens (the page itself is cached, so it cannot count on the server). One
 * view per signed-in account, or per device for signed-out readers — the
 * device is identified by a long-lived cookie this route sets on first use.
 *
 * Body: { articleId: string }
 */
export async function POST(request: Request) {
  let articleId = "";

  try {
    const body = (await request.json()) as { articleId?: unknown };
    articleId = typeof body?.articleId === "string" ? body.articleId.slice(0, 64) : "";
  } catch {
    // handled below
  }

  if (!articleId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const user = await getCurrentDbUser();
    const jar = await cookies();
    const existingDevice = jar.get(DEVICE_COOKIE)?.value;
    const deviceId = isDeviceId(existingDevice) ? existingDevice : randomUUID();
    const viewerKey = user ? `u:${user.id}` : `d:${deviceId}`;

    const found = await recordArticleView(articleId, viewerKey);
    const response = NextResponse.json(
      { ok: found },
      { status: found ? 200 : 404, headers: { "Cache-Control": "private, no-store" } },
    );

    if (!isDeviceId(existingDevice)) {
      response.cookies.set(DEVICE_COOKIE, deviceId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 400,
      });
    }

    return response;
  } catch (error) {
    console.error("[news] record view failed", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
