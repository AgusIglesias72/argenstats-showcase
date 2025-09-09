import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Add this to images: img.clerk.com
  images: {
    remotePatterns: [{ hostname: 'img.clerk.com' }],
  },
};

export default nextConfig;
