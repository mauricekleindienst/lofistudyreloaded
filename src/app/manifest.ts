import type { MetadataRoute } from 'next';
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Focus & Study Space`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    id: '/',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    background_color: '#12141a',
    theme_color: '#12141a',
    lang: 'en',
    categories: ['productivity', 'education', 'music'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      { src: '/og-image.png', sizes: '1200x630', type: 'image/png', form_factor: 'wide', label: 'Lo-Fi.Study focus space' },
    ],
  };
}
