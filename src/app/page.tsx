"use client";

import Desktop from '@/components/Desktop';
import { AppStateProvider } from '@/contexts/AppStateContext';
import AuthModal from '@/components/AuthModal';
import { useState } from 'react';
import Script from 'next/script';

// Structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Lo-Fi.Study",
  "url": "https://lo-fi.study",
  "description": "Boost your productivity with Lo-Fi.Study - the ultimate focus companion featuring Pomodoro timer, ambient sounds, and progress tracking.",
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Pomodoro Timer",
    "Ambient Sounds",
    "Background Customization",
    "Progress Tracking",
    "Task Management",
    "Focus Statistics"
  ],
  "screenshot": "https://lo-fi.study/og-image.svg",
  "author": {
    "@type": "Organization",
    "name": "Lo-Fi.Study Team"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "150"
  }
};

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      {/* Structured Data for SEO */}
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <AppStateProvider>
        <Desktop onShowAuth={() => setShowAuthModal(true)} />
        <AuthModal isVisible={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </AppStateProvider>
    </>
  );
}
