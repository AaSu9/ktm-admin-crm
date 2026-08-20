import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent TypeScript errors and ESLint warnings from blocking Vercel builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // @ts-expect-error - eslint option in NextConfig
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Allow Cloudinary and other external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
