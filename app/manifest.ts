import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IcatronicApp',
    short_name: 'Icatronic',
    description: 'Sistema de gestión para taller de electrónica automotriz',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#111c2e',
    theme_color: '#111c2e',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
