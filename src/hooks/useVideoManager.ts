import { useRef, useCallback } from 'react';
import { Background } from '@/components/desktop/types';

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

    // Create new loading promise
    const loadingPromise = new Promise<HTMLVideoElement>((resolve, reject) => {
      const video = document.createElement('video');
      video.src = background.src;
      video.muted = true;
      video.loop = true;
      video.preload = 'metadata';
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.disablePictureInPicture = true;

      const cleanup = () => {
        video.removeEventListener('canplaythrough', onLoad);
        video.removeEventListener('error', onError);
        video.removeEventListener('loadstart', onLoadStart);
        loadingPromises.current.delete(videoId);
      };

      const onLoad = () => {
        cleanup();
        preloadedVideos.current.set(videoId, video);
        resolve(video);
      };

      const onError = () => {
        cleanup();
        video.src = '';
        video.remove();
        reject(new Error(`Failed to preload video: ${background.src}`));
      };

      const onLoadStart = () => {
        // Video started loading
      };

      video.addEventListener('canplaythrough', onLoad, { once: true });
      video.addEventListener('error', onError, { once: true });
      video.addEventListener('loadstart', onLoadStart, { once: true });

      // Start loading
      video.load();

      // Timeout after 30 seconds
      setTimeout(() => {
        cleanup();
        video.src = '';
        video.remove();
        reject(new Error(`Video preload timeout: ${background.src}`));
      }, 30000);
    });

    loadingPromises.current.set(videoId, loadingPromise);
    return loadingPromise;
  }, []);

  const getPreloadedVideo = useCallback((backgroundId: string): HTMLVideoElement | null => {
    return preloadedVideos.current.get(backgroundId) || null;
  }, []);

  const clearPreloadedVideos = useCallback(() => {
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
