'use client';

import Script from 'next/script';
import { useEffect } from 'react';

interface GoogleAnalyticsProps {
  gaId: string;
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Track page views on client side
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', gaId, {
        page_title: document.title,
        page_location: window.location.href,
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure',
      });
    }
  }, [gaId]);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_title: document.title,
              page_location: window.location.href,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure',
            });
          `,
        }}
      />
    </>
  );
}

// Google Tag Manager component
interface GoogleTagManagerProps {
  gtmId: string;
}

export function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  return (
    <>
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
        }}
      />
    </>
  );
}

// Custom event tracking functions
export const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: 'engagement',
      event_label: eventName,
      ...parameters,
    });
  }
};

export const trackTiming = (name: string, value: number, category = 'performance') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: name,
      value: value,
      event_category: category,
    });
  }
};

export const trackUserEngagement = (action: string, feature: string) => {
  trackEvent('user_engagement', {
    engagement_time_msec: Date.now(),
    action: action,
    feature: feature,
  });
};

export const trackPomodoroSession = (duration: number, completed: boolean) => {
  trackEvent('pomodoro_session', {
    event_category: 'productivity',
    duration_minutes: duration,
    completed: completed,
    value: completed ? duration : 0,
  });
};

export const trackBackgroundChange = (backgroundName: string) => {
  trackEvent('background_change', {
    event_category: 'customization',
    background_name: backgroundName,
  });
};
