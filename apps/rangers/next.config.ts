import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  images: {
    remotePatterns: [
      {
        // Supabase Storage (avatars bucket)
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Placeholder images (seed data)
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        // picsum.photos のリダイレクト先（Fastly CDN）
        protocol: "https",
        hostname: "fastly.picsum.photos",
      },
    ],
  },
};

export default nextConfig;
