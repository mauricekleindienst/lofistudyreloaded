"use client";

import { useEffect } from 'react';
import { initializeServiceWorker } from '@/utils/serviceWorkerManager';

export default function ClientServiceWorkerInit() {
  useEffect(() => {
    // Initialize service worker on client side
    initializeServiceWorker()
      .then((success) => {
        if (success) {
          console.log('Service Worker initialized successfully');
        }
      })
      .catch((error) => {
        console.error('Service Worker initialization failed:', error);
      });
  }, []);

  return null; // This component doesn't render anything
}
