import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable static optimization where possible
  output: 'standalone',
  // Configure SVG handling
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
}

export default nextConfig;