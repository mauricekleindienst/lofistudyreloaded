import { useRef, useCallback } from 'react';
import { Background } from '@/components/desktop/types';
import { CDN_CONFIG, getFallbackUrl } from '@/utils/cdnConfig';

// Minimal NetworkInformation interface to avoid dependency on lib.dom typing
// Covers only properties we actually use
interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g' | string;
}

interface VideoManager {
  preloadVideo: (background: Background) => Promise<HTMLVideoElement>;
  getPreloadedVideo: (backgroundId: string) => HTMLVideoElement | null;
  clearPreloadedVideos: () => void;
  cleanupOldVideos: (maxCount: number) => void;
}

export const useVideoManager = (): VideoManager => {
  const preloadedVideos = useRef<Map<string, HTMLVideoElement>>(new Map());
  const loadingPromises = useRef<Map<string, Promise<HTMLVideoElement>>>(new Map());

  const preloadVideo = useCallback(async (background: Background): Promise<HTMLVideoElement> => {
    const videoId = background.id.toString();
    
    // Return existing preloaded video if available
    if (preloadedVideos.current.has(videoId)) {
      return preloadedVideos.current.get(videoId)!;
    }

    // Return existing loading promise if already loading
    if (loadingPromises.current.has(videoId)) {
      return loadingPromises.current.get(videoId)!;
    }

    // Create new loading promise with CDN fallback support
    const loadingPromise = new Promise<HTMLVideoElement>((resolve: (value: HTMLVideoElement) => void, reject: (reason?: unknown) => void) => {
      let currentFallbackIndex = 0;
      let attempt = 0;

      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!isOnline) {
        console.warn(`Skipping video preload for ${background.alt} (offline)`);
        loadingPromises.current.delete(videoId);
        reject(new Error('Offline: cannot preload video'));
        return;
      }

      type NavigatorWithNetwork = Navigator & {
        connection?: NetworkInformation;
        mozConnection?: NetworkInformation;
        webkitConnection?: NetworkInformation;
      };

      const getPreloadMode = (): 'metadata' | 'auto' => {
        const nav = navigator as NavigatorWithNetwork;
        const connection: NetworkInformation | undefined =
          nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
        const effectiveType = connection?.effectiveType ?? '';
        // Use conservative preload on slow connections
        if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'metadata';
        return 'auto';
      };

      const delay = (ms: number): Promise<void> => new Promise<void>(res => setTimeout(res, ms));

      const tryLoadVideo = async (videoUrl: string): Promise<void> => {
        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.preload = getPreloadMode();
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.disablePictureInPicture = true;
        
        // Add performance optimizations
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('crossorigin', 'anonymous');

        const cleanup = () => {
          video.removeEventListener('canplaythrough', onLoad);
          video.removeEventListener('error', onError);
          video.removeEventListener('loadstart', onLoadStart);
        };

        const onLoad = () => {
          cleanup();
          preloadedVideos.current.set(videoId, video);
          console.log(`Successfully preloaded video from CDN: ${background.alt}`);
          resolve(video);
        };

        const onError = async () => {
          cleanup();
          console.warn(`Failed to load video from: ${videoUrl} (attempt ${attempt + 1})`);
          
          // Try fallback URL if available and we haven't exceeded max attempts
          if (background.filename && currentFallbackIndex < CDN_CONFIG.fallbacks.length) {
            const fallbackUrl = getFallbackUrl(background.filename, currentFallbackIndex);
            if (fallbackUrl && fallbackUrl !== videoUrl) { // Prevent infinite loops
              currentFallbackIndex++;
              console.log(`Trying fallback ${currentFallbackIndex}: ${fallbackUrl}`);
              video.src = '';
              await delay(Math.min(1000 * Math.pow(2, attempt), 8000));
              attempt++;
              tryLoadVideo(fallbackUrl);
              return;
            }
          }
          
          // No more fallbacks available or all fallbacks failed
          console.error(`All video sources failed for ${background.alt}`);
          video.src = '';
          video.remove();
          loadingPromises.current.delete(videoId);
          reject(new Error(`All sources failed for ${background.alt}`));
        };

        const onLoadStart = () => {
          console.log(`Started loading video: ${background.alt}`);
        };

        video.addEventListener('canplaythrough', onLoad, { once: true });
        video.addEventListener('error', onError, { once: true });
        video.addEventListener('loadstart', onLoadStart, { once: true });

        // Set source and start loading
        video.src = videoUrl;
        attempt++;
        video.load();
      };

      // Start with primary CDN URL
      tryLoadVideo(background.src);

      // Timeout after 30 seconds with proper cleanup
      const timeoutId = setTimeout(() => {
        console.warn(`Video preload timeout for ${background.alt} after 30 seconds`);
        loadingPromises.current.delete(videoId);
        reject(new Error(`Video preload timeout: ${background.src}`));
      }, 30000);
      
      // Clear timeout when promise resolves or rejects
      loadingPromise.finally(() => {
        clearTimeout(timeoutId);
      });
    });

    loadingPromises.current.set(videoId, loadingPromise);
    return loadingPromise;
  }, []);

  const getPreloadedVideo = useCallback((backgroundId: string): HTMLVideoElement | null => {
    return preloadedVideos.current.get(backgroundId) || null;
  }, []);

  const clearPreloadedVideos = useCallback(() => {
    const count = preloadedVideos.current.size;
    console.log(`Clearing ${count} preloaded videos`);
    
    if (count === 0) {
      console.log('No preloaded videos to clear');
      return;
    }
    
    preloadedVideos.current.forEach((video, id) => {
      console.log(`Clearing preloaded video: ${id}`);
      video.src = '';
      video.remove();
    });
    preloadedVideos.current.clear();
    loadingPromises.current.clear();
    
    console.log('All preloaded videos cleared successfully');
  }, []);

  const cleanupOldVideos = useCallback((maxCount: number) => {
    if (preloadedVideos.current.size <= maxCount) return;

    const videosToRemove = Array.from(preloadedVideos.current.keys()).slice(0, preloadedVideos.current.size - maxCount);
    console.log(`Cleaning up ${videosToRemove.length} old preloaded videos`);
    
    videosToRemove.forEach(key => {
      const video = preloadedVideos.current.get(key);
      if (video) {
        video.src = '';
        video.remove();
      }
      preloadedVideos.current.delete(key);
    });
  }, []);

  return {
    preloadVideo,
    getPreloadedVideo,
    clearPreloadedVideos,
    cleanupOldVideos
  };
};
