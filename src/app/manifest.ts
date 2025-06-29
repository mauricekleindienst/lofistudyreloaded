import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lo-Fi.Study - Focus & Productivity App',
    short_name: 'Lo-Fi.Study',
    description: 'Boost your productivity with Lo-Fi.Study - the ultimate focus companion featuring Pomodoro timer, ambient sounds, and progress tracking.',
    start_url: '/',
    display: 'standalone',
    background_color: '#667eea',
    theme_color: '#667eea',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en',
    categories: ['productivity', 'utilities', 'education'],
    icons: [
      {
        src: '/icon?size=72',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icon?size=96',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icon?size=128',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icon?size=144',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icon?size=152',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon?size=384',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/og-image.svg',
        sizes: '1200x630',
        type: 'image/svg+xml',
        form_factor: 'wide',
        label: 'Lo-Fi.Study Desktop Interface'
      }
    ],
    prefer_related_applications: false
  }
}
