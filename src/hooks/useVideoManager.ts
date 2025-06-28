import { useRef, useCallback } from 'react';
import { Background } from '@/components/desktop/types';
import { getFallbackUrl } from '@/utils/cdnConfig';

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
    const loadingPromise = new Promise<HTMLVideoElement>((resolve, reject) => {
      let currentFallbackIndex = 0;
      
      const tryLoadVideo = (videoUrl: string) => {
        const video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.preload = 'metadata';
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.disablePictureInPicture = true;
        
        // Add performance optimizations
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');

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

        const onError = () => {
          cleanup();
          console.warn(`Failed to load video from: ${videoUrl}`);
          
          // Try fallback URL if available
          if (background.filename && currentFallbackIndex < 2) {
            const fallbackUrl = getFallbackUrl(background.filename, currentFallbackIndex);
            if (fallbackUrl) {
              currentFallbackIndex++;
              console.log(`Trying fallback ${currentFallbackIndex}: ${fallbackUrl}`);
              video.src = '';
              tryLoadVideo(fallbackUrl);
              return;
            }
          }
          
          // No more fallbacks available
          video.src = '';
          video.remove();
          reject(new Error(`Failed to preload video with all fallbacks: ${background.src}`));
        };

        const onLoadStart = () => {
          console.log(`Started loading video: ${background.alt}`);
        };

        video.addEventListener('canplaythrough', onLoad, { once: true });
        video.addEventListener('error', onError, { once: true });
        video.addEventListener('loadstart', onLoadStart, { once: true });

        // Set source and start loading
        video.src = videoUrl;
        video.load();
      };

      // Start with primary CDN URL
      tryLoadVideo(background.src);

      // Timeout after 45 seconds (increased for large video files)
      setTimeout(() => {
        loadingPromises.current.delete(videoId);
        reject(new Error(`Video preload timeout: ${background.src}`));
      }, 45000);
    });

    loadingPromises.current.set(videoId, loadingPromise);
    return loadingPromise;
  }, []);

  const getPreloadedVideo = useCallback((backgroundId: string): HTMLVideoElement | null => {
    return preloadedVideos.current.get(backgroundId) || null;
  }, []);

  const clearPreloadedVideos = useCallback(() => {
    console.log(`Clearing ${preloadedVideos.current.size} preloaded videos`);
    preloadedVideos.current.forEach((video) => {
      video.src = '';
      video.remove();
    });
    preloadedVideos.current.clear();
    loadingPromises.current.clear();
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
