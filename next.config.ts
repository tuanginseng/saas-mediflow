import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress workspace root detection warning
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
