import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent TypeScript errors from blocking the build
  typescript: {
    ignoreBuildErrors: true,
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
    ],
  },
};

export default nextConfig;
