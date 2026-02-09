import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    // Optimize package imports for better tree-shaking
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
