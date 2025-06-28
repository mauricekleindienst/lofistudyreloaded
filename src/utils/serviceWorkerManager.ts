// Service Worker registration and management utilities

export interface ServiceWorkerManager {
  register: () => Promise<boolean>;
  clearVideoCache: () => Promise<boolean>;
  preloadVideo: (url: string) => Promise<boolean>;
  isSupported: () => boolean;
}

class ServiceWorkerManagerImpl implements ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window;
  }

  async register(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Service Worker not supported in this browser');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', this.registration.scope);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New Service Worker available, reload to update');
              // Optionally show notification to user about update
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async clearVideoCache(): Promise<boolean> {
    if (!this.registration) {
      console.warn('Service Worker not registered');
      return false;
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success || false);
        };

        this.registration?.active?.postMessage(
          { type: 'CLEAR_VIDEO_CACHE' },
          [messageChannel.port2]
        );

        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
      });
    } catch (error) {
      console.error('Failed to clear video cache:', error);
      return false;
    }
  }

  async preloadVideo(url: string): Promise<boolean> {
    if (!this.registration) {
      console.warn('Service Worker not registered');
      return false;
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success || false);
        };

        this.registration?.active?.postMessage(
          { type: 'PRELOAD_VIDEO', url },
          [messageChannel.port2]
        );

        // Timeout after 30 seconds for video preloading
        setTimeout(() => resolve(false), 30000);
      });
    } catch (error) {
      console.error('Failed to preload video:', error);
      return false;
    }
  }
}

// Singleton instance
export const serviceWorkerManager: ServiceWorkerManager = new ServiceWorkerManagerImpl();

// Auto-register on app load (call this in your main app component)
export const initializeServiceWorker = async (): Promise<boolean> => {
  if (process.env.NODE_ENV === 'production') {
    return await serviceWorkerManager.register();
  }
  return false;
};
