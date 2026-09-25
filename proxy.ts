import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

/**
 * Clerk's middleware runs only where the server reads the session. Every
 * request it matches is a middleware invocation, so this is deliberately not
 * "everything": cached pages (/news, /updates, the /manga library) and static
 * files never touch it.
 *
 * Every entry is a route whose server code calls auth() — directly or through
 * lib/auth — including the Server Actions posted from that page. auth() throws
 * on any request this matcher skips, so a route that starts reading the
 * session must be added here. Pages that only need to know who is looking for
 * their menu get that from /api/news/status in the browser instead.
 */
export const config = {
  matcher: [
    "/", // continue reading, per-reader chapter feed flags, menu state
    "/manga/:path+", // series pages: read state, poster choice, comments (not the /manga library)
    "/reader/:path*", // sign-in gate and the free/paid reading rules
    "/subscribe/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/users/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
    "/api/news/:path*", // unread state, seen marks, menu state
    "/api/reading/:path*", // per-reader flags for the cached chapter feed
  ],
};
