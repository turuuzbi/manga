import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // No image bytes go through Server Actions any more: admin uploads go
      // browser → R2 on a signed URL, and actions receive only the resulting
      // URLs (app/admin/direct-upload). The old 50 MB setting was never
      // reachable anyway — Vercel rejects any function body over 4.5 MB with a
      // plain-text 413 first, which is what broke poster saves. Kept just under
      // that platform ceiling so an oversized body fails inside Next instead.
      bodySizeLimit: "4mb",
    },
  },
  async redirects() {
    return [
      // The schedule used to be one page per month (/schedule/2026-10). It is
      // weekly now, so old links and bookmarks land on the one weekly page.
      { source: "/schedule/:month", destination: "/schedule", permanent: true },
    ];
  },
};

export default nextConfig;
