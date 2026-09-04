import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exposes SHREK to client code too, without the usual NEXT_PUBLIC_ prefix requirement
  env: {
    SHREK: process.env.SHREK,
  },
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
