import HomeClient from './HomeClient';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

// JSON-LD rendered on the server so crawlers see it without running JS.
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript',
      image: `${SITE_URL}/og-image.png`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Pomodoro focus timer',
        'Lo-fi music player',
        'Ambient sound mixer',
        'Animated lo-fi backgrounds',
        'Tasks and notes',
        'Calendar',
        'Focus statistics and leaderboard',
        'Community chat',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: 'en',
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <h1 className="sr-only">Lo-Fi.Study — free online study space with a Pomodoro timer and lo-fi music</h1>
      <noscript>
        <div style={{ padding: 24, color: '#fff', background: '#12141a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
          <p>
            {SITE_NAME} is an online study space with a Pomodoro focus timer, lo-fi music, ambient sounds, tasks, notes
            and focus statistics. Please enable JavaScript to use it.
          </p>
        </div>
      </noscript>
      <HomeClient />
    </>
  );
}
