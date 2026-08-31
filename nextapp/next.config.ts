import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow local avatar images from public/avatars
    localPatterns: [
      {
        pathname: '/avatars/**',
        search: '',
      },
    ],
  },
  // Required for Vercel AI SDK streaming
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
