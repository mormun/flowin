import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Modo standalone: genera un servidor Node.js autónomo optimizado para Docker
  output: "standalone",

  experimental: {
    serverActions: {
      // Límite de 12 MB para permitir subida de archivos adjuntos en tickets
      bodySizeLimit: "12mb",
    },
  },
}

export default nextConfig