import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  allowedDevOrigins: ['192.168.0.45', '192.168.56.1'],
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', '192.168.0.45:3000', '192.168.56.1:3000'] },
  },
}

export default nextConfig
