import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Dokument-Uploads bis 10 MB über Server Actions
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;
