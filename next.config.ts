import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ws/@neondatabase/serverless/@prisma/adapter-neon は Node ネイティブ依存を含むため
  // Next.js webpack でバンドルせず実行時に require させる
  serverExternalPackages: [
    "ws",
    "@neondatabase/serverless",
    "@prisma/adapter-neon",
    "@prisma/client",
    "bcryptjs",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "yt3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
