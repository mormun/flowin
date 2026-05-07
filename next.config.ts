import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
}

export default nextConfig