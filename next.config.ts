import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // This disables ESLint during the build process
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This disables TypeScript type checking during the build process
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
