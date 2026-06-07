import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Poster/cover art is uploaded directly from the browser through a
      // Server Action. The framework default body limit is 1 MB, which silently
      // rejects most cover images before the action runs (chapter pages come in
      // via the server-side Google Drive import, so they are unaffected).
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
