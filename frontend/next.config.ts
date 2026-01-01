import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-4749e28d793f4ca4bf16b44a7648ed78.r2.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
