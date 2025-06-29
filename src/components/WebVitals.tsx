'use client';

import { useEffect } from 'react';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function sendToAnalytics(name: string, value: number, id: string) {
  // Send to analytics service if available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      non_interaction: true,
    });
  }
  
  // Log for debugging
  console.log('Performance metric:', { name, value, id });
}

export function WebVitals() {
  useEffect(() => {
    // Basic performance monitoring without web-vitals library
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor Largest Contentful Paint (LCP)
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            sendToAnalytics('LCP', entry.startTime, entry.name || 'lcp-entry');
          }
            if (entry.entryType === 'first-input') {
              sendToAnalytics('FID', (entry as PerformanceEventTiming).processingStart - entry.startTime, entry.name || 'fid-entry');
            }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
      } catch (error) {
        // Fallback for browsers that don't support these entry types
        console.warn('Performance observation not supported:', error);
      }
      
      return () => observer.disconnect();
    }
  }, []);

  return null;
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  useEffect(() => {
    // Monitor navigation timing
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('Navigation timing:', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
              loadComplete: navEntry.loadEventEnd - navEntry.fetchStart,
              firstPaint: navEntry.responseEnd - navEntry.fetchStart,
            });
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.warn('Navigation timing observation not supported:', error);
      }
      
      return () => observer.disconnect();
    }
  }, []);
}
