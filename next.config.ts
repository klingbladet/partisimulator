import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Vercel AI SDK streaming
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
