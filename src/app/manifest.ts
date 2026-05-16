import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '勤怠管理システム',
    short_name: '勤怠管理',
    description: '出退勤の打刻・勤務時間の集計',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#2563eb',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
