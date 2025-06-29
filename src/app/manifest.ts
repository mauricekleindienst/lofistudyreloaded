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
        src: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      },
      {
        src: '/favicon.ico',
        sizes: '16x16',
        type: 'image/x-icon',
      }
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
