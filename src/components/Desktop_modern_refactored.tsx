"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Timer, 
  CheckSquare, 
  Calculator as CalculatorIcon,
  Settings,
  Volume2
} from 'lucide-react';
import { backgrounds, DEFAULT_BACKGROUND } from '@/data/backgrounds';
import desktopStyles from '../../styles/Desktop.module.css';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { useDataPersistence } from '../hooks/useDataPersistence';

// Import individual app components
import PomodoroTimer from './apps/PomodoroTimer';
import TodoList from './apps/TodoList';
import Calculator from './apps/Calculator';
import Calendar from './Calendar';
import AccountSettings from './apps/AccountSettings';
import MusicPlayerSidebar from './MusicPlayerSidebar';
import StatsModal from './StatsModal';
import SoundPlayer from './apps/SoundPlayer';

// Import desktop components
import TopBar from './desktop/TopBar';
import BottomBar from './desktop/BottomBar';
import WindowManager from './desktop/WindowManager';
import BackgroundSelector from './desktop/BackgroundSelector';
import NotificationManager from './desktop/NotificationManager';
import { type DesktopProps, type ModernApp, type ModernWindow, type ModernNotification, type Background } from './desktop/types';

// Modern Apps Configuration
const modernApps: ModernApp[] = [
  {
    id: 'pomodoro',
    name: 'Focus Timer',
    icon: Timer,
    component: PomodoroTimer,
    color: 'orange',
    description: 'Pomodoro technique for enhanced focus',
    category: 'study'
  },
  {
    id: 'todo',
    name: 'Tasks',
    icon: CheckSquare,
    component: TodoList,
    color: 'blue',
    description: 'Organize your tasks and goals',
    category: 'study'
  },
  {
    id: 'calculator',
    name: 'Calculator',
    icon: CalculatorIcon,
    component: Calculator,
    color: 'orange',
    description: 'Basic calculator for quick calculations',
    category: 'study'
  },
  {
    id: 'sound-player',
    name: 'Sound Mixer',
    icon: Volume2,
    component: SoundPlayer,
    color: 'purple',
    description: 'Mix relaxing sounds for focus',
    category: 'study'
  },
  {
    id: 'account-settings',
    name: 'Account Settings',
    icon: Settings,
    component: AccountSettings,
    color: 'blue',
    description: 'Manage your account and preferences',
    category: 'study'
  }
];

// Main Modern Desktop Component
const ModernDesktop: React.FC<DesktopProps> = ({ onShowAuth }) => {
  // Access app state context
  const { appStates } = useAppState();
  const { user, isConfigured } = useAuth();
  const { 
    isAuthenticated, 
    saveSelectedBackground, 
    loadSelectedBackground 
  } = useDataPersistence();

  // State management
  const [openWindows, setOpenWindows] = useState<ModernWindow[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(100);
  const [currentBackground, setCurrentBackground] = useState<Background>(DEFAULT_BACKGROUND);
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [notifications, setNotifications] = useState<ModernNotification[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [backgroundSaveLoading, setBackgroundSaveLoading] = useState(false);
  const [isMusicSidebarOpen, setIsMusicSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [customBackground, setCustomBackground] = useState<Background | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Enhanced video buffering state
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [preloadedVideos, setPreloadedVideos] = useState<Map<string, HTMLVideoElement>>(new Map());
  const [currentlyBuffering, setCurrentlyBuffering] = useState<string[]>([]);
  const [bufferHealths, setBufferHealths] = useState<Map<string, number>>(new Map());
  
  // Refs for event handling
  const videoRef = useRef<HTMLVideoElement>(null);
  const bufferCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const preloadManagerRef = useRef<{
    preloadVideo: (background: Background) => Promise<HTMLVideoElement>;
    getBufferedVideo: (backgroundId: string) => HTMLVideoElement | null;
    clearOldBuffers: (keepCount?: number) => void;
    getBufferHealth: (backgroundId: string) => number;
  } | null>(null);

  // Initialize client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Advanced Video Buffer Management System
  useEffect(() => {
    const createBufferManager = () => {
      const MAX_BUFFERED_VIDEOS = 5;
      const MIN_BUFFER_HEALTH = 0.3; // 30% buffered considered healthy

      const preloadVideo = async (background: Background): Promise<HTMLVideoElement> => {
        return new Promise((resolve, reject) => {
          if (preloadedVideos.has(background.id.toString())) {
            const existingVideo = preloadedVideos.get(background.id.toString())!;
            resolve(existingVideo);
            return;
          }

          const video = document.createElement('video');
          video.preload = 'auto';
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.crossOrigin = 'anonymous';
          
          let progressTimer: NodeJS.Timeout | null = null;
          let timeoutTimer: NodeJS.Timeout | null = null;
          
          const updateProgress = () => {
            if (video.buffered.length > 0) {
              const bufferedEnd = video.buffered.end(video.buffered.length - 1);
              const duration = video.duration || 0;
              const progress = duration > 0 ? bufferedEnd / duration : 0;
              
              setBufferHealths(prev => new Map(prev.set(background.id.toString(), progress)));
              
              if (progress >= MIN_BUFFER_HEALTH) {
                if (progressTimer) clearInterval(progressTimer);
                resolve(video);
              }
            }
          };

          const onLoadedMetadata = () => {
            progressTimer = setInterval(updateProgress, 500);
            timeoutTimer = setTimeout(() => {
              if (progressTimer) clearInterval(progressTimer);
              // Accept video even if not fully buffered after timeout
              resolve(video);
            }, 10000); // 10 second timeout
          };

          const onError = () => {
            if (progressTimer) clearInterval(progressTimer);
            if (timeoutTimer) clearTimeout(timeoutTimer);
            reject(new Error(`Failed to preload video: ${background.src}`));
          };

          const onCanPlay = () => {
            updateProgress();
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          video.addEventListener('canplay', onCanPlay);
          video.addEventListener('progress', updateProgress);
          
          video.src = background.src;
          video.load();

          // Store the video element immediately to prevent duplicates
          setPreloadedVideos(prev => {
            if (prev.has(background.id.toString())) {
              return prev; // Already exists, don't create new Map
            }
            return new Map(prev.set(background.id.toString(), video));
          });
        });
      };

      const getBufferedVideo = (backgroundId: string): HTMLVideoElement | null => {
        return preloadedVideos.get(backgroundId) || null;
      };

      const clearOldBuffers = (keepCount = MAX_BUFFERED_VIDEOS) => {
        const entries = Array.from(preloadedVideos.entries());
        if (entries.length > keepCount) {
          const toRemove = entries.slice(0, entries.length - keepCount);
          toRemove.forEach(([id, video]) => {
            video.pause();
            video.src = '';
            video.load();
            setPreloadedVideos(prev => {
              const newMap = new Map(prev);
              newMap.delete(id);
              return newMap;
            });
          });
        }
      };

      const getBufferHealth = (backgroundId: string): number => {
        return bufferHealths.get(backgroundId) || 0;
      };

      return { preloadVideo, getBufferedVideo, clearOldBuffers, getBufferHealth };
    };

    preloadManagerRef.current = createBufferManager();

    // Cleanup on unmount
    return () => {
      if (bufferCheckIntervalRef.current) {
        clearInterval(bufferCheckIntervalRef.current);
      }
      // Clean up all preloaded videos
      if (preloadManagerRef.current) {
        preloadManagerRef.current.clearOldBuffers(0); // Clear all
      }
    };
  }, []); // Empty dependency array to run only once

  // Intelligent preloading effect
  useEffect(() => {
    if (!preloadManagerRef.current || !isClient) return;

    const preloadPopularBackgrounds = async () => {
      // Preload the most popular/commonly used backgrounds
      const priorityBackgrounds = backgrounds
        .filter(bg => bg.src.endsWith('.mp4')) // All backgrounds are videos
        .slice(0, 3); // Preload first 3 video backgrounds

      for (const background of priorityBackgrounds) {
        const backgroundId = background.id.toString();
        
        if (!currentlyBuffering.includes(backgroundId) && !preloadedVideos.has(backgroundId)) {
          setCurrentlyBuffering(prev => [...prev, backgroundId]);
          try {
            await preloadManagerRef.current!.preloadVideo(background);
          } catch (error) {
            console.warn(`Failed to preload background ${background.id}:`, error);
          } finally {
            setCurrentlyBuffering(prev => prev.filter(id => id !== backgroundId));
          }
        }
      }
    };

    // Start preloading after a short delay to not interfere with initial load
    const timer = setTimeout(preloadPopularBackgrounds, 3000);
    return () => clearTimeout(timer);
  }, [isClient]); // Remove currentlyBuffering from dependencies to avoid loops

  // Update time and date every second
  useEffect(() => {
    if (!isClient) return;
    
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    
    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, [isClient]);

  // Enhanced Video loading and error handling with buffering support
  const handleVideoLoad = useCallback(() => {
    if (videoRef.current) {
      setVideoLoadError(false);
      setRetryCount(0);
      
      // Start buffer health monitoring
      if (bufferCheckIntervalRef.current) {
        clearInterval(bufferCheckIntervalRef.current);
      }
      
      bufferCheckIntervalRef.current = setInterval(() => {
        if (videoRef.current && videoRef.current.buffered.length > 0) {
          const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
          const duration = videoRef.current.duration || 0;
          const progress = duration > 0 ? bufferedEnd / duration : 0;
          
          // Update buffer health for current background
          setBufferHealths(prev => new Map(prev.set(currentBackground.id.toString(), progress)));
        }
      }, 1000);
      
      videoRef.current.play().catch(console.error);
    }
  }, [currentBackground.id]);

  const handleVideoError = useCallback(() => {
    console.error('Video failed to load:', currentBackground.src);
    setVideoLoadError(true);
    
    // Stop buffer monitoring
    if (bufferCheckIntervalRef.current) {
      clearInterval(bufferCheckIntervalRef.current);
    }
    
    // Try using preloaded version first
    if (preloadManagerRef.current) {
      const bufferedVideo = preloadManagerRef.current.getBufferedVideo(currentBackground.id.toString());
      if (bufferedVideo && videoRef.current) {
        console.log('Using preloaded video as fallback');
        videoRef.current.src = bufferedVideo.src;
        videoRef.current.load();
        return;
      }
    }
    
    // Retry mechanism - try up to 3 times
    if (retryCount < 3 && currentBackground.id !== DEFAULT_BACKGROUND.id) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        if (videoRef.current) {
          videoRef.current.load(); // Force reload
        }
      }, 2000 * (retryCount + 1)); // Exponential backoff
    } else {
      // Final fallback to default background
      if (currentBackground.id !== DEFAULT_BACKGROUND.id) {
        showNotification({
          id: Date.now().toString(),
          message: 'Background video failed to load. Using default background.',
          type: 'error'
        });
        setCurrentBackground(DEFAULT_BACKGROUND);
      }
    }
  }, [currentBackground.src, currentBackground.id, retryCount]);

  // Enhanced video loading with preload hint and buffer management
  const handleVideoLoadStart = useCallback(() => {
    setVideoLoadError(false);
    
    // Check if we have this video preloaded
    if (preloadManagerRef.current) {
      const bufferedVideo = preloadManagerRef.current.getBufferedVideo(currentBackground.id.toString());
      const bufferHealth = preloadManagerRef.current.getBufferHealth(currentBackground.id.toString());
      
      if (bufferedVideo && bufferHealth > 0.3) {
        console.log(`Using preloaded video for background ${currentBackground.id} (${Math.round(bufferHealth * 100)}% buffered)`);
      }
    }
  }, [currentBackground.id]);

  // Enhanced background video effect with buffer management
  useEffect(() => {
    setRetryCount(0); // Reset retry count when background changes
    setVideoLoadError(false);
    
    // Clear any existing buffer monitoring
    if (bufferCheckIntervalRef.current) {
      clearInterval(bufferCheckIntervalRef.current);
    }
    
    // Check if we have this video preloaded and ready
    if (preloadManagerRef.current) {
      const bufferedVideo = preloadManagerRef.current.getBufferedVideo(currentBackground.id.toString());
      const bufferHealth = preloadManagerRef.current.getBufferHealth(currentBackground.id.toString());
      
      if (bufferedVideo && bufferHealth > 0.3) {
        console.log(`Instantly switching to preloaded background ${currentBackground.id}`);
        
        if (videoRef.current) {
          videoRef.current.src = bufferedVideo.src;
          videoRef.current.currentTime = bufferedVideo.currentTime;
          videoRef.current.play().catch(() => {
            // Video autoplay was prevented
          });
        }
        return;
      }
    }
    
    // Fallback to normal loading
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Video autoplay was prevented
      });
    }
  }, [currentBackground]);

  // Separate effect for preloading videos to avoid infinite loops
  useEffect(() => {
    if (!preloadManagerRef.current || currentlyBuffering.includes(currentBackground.id.toString())) {
      return;
    }

    const preloadCurrentBackground = async () => {
      try {
        setCurrentlyBuffering(prev => [...prev, currentBackground.id.toString()]);
        await preloadManagerRef.current!.preloadVideo(currentBackground);
        console.log(`Successfully preloaded background ${currentBackground.id}`);
      } catch (error) {
        console.warn(`Failed to preload background ${currentBackground.id}:`, error);
      } finally {
        setCurrentlyBuffering(prev => prev.filter(id => id !== currentBackground.id.toString()));
      }
    };

    // Only preload if not already preloaded or buffering
    if (!preloadedVideos.has(currentBackground.id.toString())) {
      preloadCurrentBackground();
    }
  }, [currentBackground.id, preloadedVideos]);

  // Load saved background when user authenticates
  useEffect(() => {
    const loadSavedBackground = async () => {
      if (isAuthenticated) {
        try {
          const savedBackgroundId = await loadSelectedBackground();
          if (savedBackgroundId) {
            const savedBackground = backgrounds.find(bg => bg.id.toString() === savedBackgroundId);
            if (savedBackground) {
              setCurrentBackground(savedBackground);
            }
          }
        } catch (error) {
          console.error('Failed to load saved background:', error);
        }
      }
    };
    loadSavedBackground();
  }, [isAuthenticated, loadSelectedBackground]);

  // Notification management
  const showNotification = useCallback((notification: ModernNotification) => {
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Handle background change with database persistence and intelligent preloading
  const handleBackgroundChange = useCallback(async (background: Background, showNotificationParam = true) => {
    // Check if video is already buffered for instant switching
    let isInstantSwitch = false;
    if (preloadManagerRef.current) {
      const bufferedVideo = preloadManagerRef.current.getBufferedVideo(background.id.toString());
      const bufferHealth = preloadManagerRef.current.getBufferHealth(background.id.toString());
      isInstantSwitch = bufferedVideo !== null && bufferHealth > 0.3;
    }
    
    setCurrentBackground(background);
    
    if (showNotificationParam) {
      const bufferStatus = isInstantSwitch ? ' (instant)' : '';
      showNotification({
        id: Date.now().toString(),
        message: `Background changed to ${background.alt}${bufferStatus}`,
        type: 'success'
      });
    }

    // Save to localStorage for non-authenticated users
    try {
      localStorage.setItem('selectedBackground', background.id.toString());
    } catch (error) {
      console.warn('Failed to save background to localStorage:', error);
    }

    // Save to database for authenticated users
    if (isAuthenticated) {
      setBackgroundSaveLoading(true);
      try {
        const success = await saveSelectedBackground(background.id.toString());
        if (!success) {
          console.warn('Failed to save background preference to database');
        }
      } catch (error) {
        console.error('Error saving background preference:', error);
      } finally {
        setBackgroundSaveLoading(false);
      }
    }
    
    // Clean up old buffers and preload nearby backgrounds
    if (preloadManagerRef.current) {
      preloadManagerRef.current.clearOldBuffers(5);
      
      // Preload next and previous backgrounds for smooth navigation
      const currentIndex = backgrounds.findIndex(bg => bg.id === background.id);
      const nextBackgrounds = [
        backgrounds[currentIndex + 1],
        backgrounds[currentIndex - 1],
        backgrounds[currentIndex + 2]
      ].filter(Boolean);
      
      nextBackgrounds.forEach(nextBg => {
        if (!currentlyBuffering.includes(nextBg.id.toString()) && 
            !preloadedVideos.has(nextBg.id.toString())) {
          setCurrentlyBuffering(prev => [...prev, nextBg.id.toString()]);
          preloadManagerRef.current!.preloadVideo(nextBg)
            .then(() => {
              console.log(`Preloaded nearby background ${nextBg.id}`);
            })
            .catch(error => {
              console.warn(`Failed to preload nearby background ${nextBg.id}:`, error);
            })
            .finally(() => {
              setCurrentlyBuffering(prev => prev.filter(id => id !== nextBg.id.toString()));
            });
        }
      });
    }
  }, [isAuthenticated, saveSelectedBackground, showNotification, currentlyBuffering, preloadedVideos]);

  // Get responsive size for each app type based on viewport
  const getResponsiveSize = useCallback((appId: string) => {
    if (!isClient) return { width: 350, height: 300, minWidth: 300, minHeight: 250 };
    
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const baseSizes: Record<string, { width: number; height: number; minWidth: number; minHeight: number }> = {
      'pomodoro': { width: 300, height: 450, minWidth: 220, minHeight: 280 },
      'todo': { width: 350, height: 650, minWidth: 300, minHeight: 360 },
      'music': { width: 280, height: 220, minWidth: 240, minHeight: 180 },
      'notes': { width: 400, height: 320, minWidth: 350, minHeight: 280 },
      'calculator': { width: 240, height: 350, minWidth: 200, minHeight: 280 },
      'sound-player': { width: 350, height: 450, minWidth: 320, minHeight: 380 },
      'account-settings': { width: 360, height: 400, minWidth: 320, minHeight: 360 }
    };

    const baseSize = baseSizes[appId] || { width: 350, height: 300, minWidth: 300, minHeight: 250 };

    let scaleFactor = 1;
    
    if (viewport.width < 768) {
      scaleFactor = 0.75;
    } else if (viewport.width < 1024) {
      scaleFactor = 0.85;
    } else if (viewport.width > 1920) {
      scaleFactor = 1.15;
    }

    const maxWidth = Math.min(baseSize.width * scaleFactor, viewport.width * 0.45);
    const maxHeight = Math.min(baseSize.height * scaleFactor, viewport.height * 0.7);

    return {
      width: Math.max(maxWidth, baseSize.minWidth),
      height: Math.max(maxHeight, baseSize.minHeight),
      minWidth: baseSize.minWidth,
      minHeight: baseSize.minHeight
    };
  }, [isClient]);

  // App management functions
  const openApp = useCallback((app: ModernApp) => {
    const existingWindow = openWindows.find(w => w.app.id === app.id);
    
    if (existingWindow) {
      // Bring to front if already open
      setOpenWindows(prev => prev.map(w => 
        w.id === existingWindow.id 
          ? { ...w, zIndex: highestZIndex + 1, isMinimized: false }
          : w
      ));
      setHighestZIndex(prev => prev + 1);
      return;
    }

    const windowCount = openWindows.length;
    const size = getResponsiveSize(app.id);
    
    const newWindow: ModernWindow = {
      id: `${app.id}-${Date.now()}`,
      app,
      isMinimized: false,
      position: { 
        x: 80 + (windowCount * 30), 
        y: 60 + (windowCount * 30) 
      },
      size,
      zIndex: highestZIndex + 1
    };

    setOpenWindows([...openWindows, newWindow]);
    setHighestZIndex(prev => prev + 1);
  }, [openWindows, highestZIndex, getResponsiveSize]);

  const closeWindow = useCallback((windowId: string) => {
    setOpenWindows(openWindows.filter(w => w.id !== windowId));
  }, [openWindows]);

  const minimizeWindow = useCallback((windowId: string) => {
    setOpenWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, isMinimized: true } : w
    ));
  }, []);

  const bringToFront = useCallback((windowId: string) => {
    setOpenWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, zIndex: highestZIndex + 1 } : w
    ));
    setHighestZIndex(prev => prev + 1);
  }, [highestZIndex]);

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className={desktopStyles.desktop}>
        <div className={desktopStyles.loadingState}>
          {/* Minimal decorative floating dots */}
          <div className={desktopStyles.loadingDecorations}>
            <div className={desktopStyles.floatingDot}></div>
            <div className={desktopStyles.floatingDot}></div>
            <div className={desktopStyles.floatingDot}></div>
            <div className={desktopStyles.floatingDot}></div>
          </div>
          
          {/* Modern spinner with study icon */}
          <div className={desktopStyles.bookLoader}>
            <div className={desktopStyles.modernSpinner}>
              <div className={desktopStyles.spinnerRing}></div>
              <div className={desktopStyles.spinnerRing}></div>
              <div className={desktopStyles.spinnerRing}></div>
              <div className={desktopStyles.spinnerCenter}></div>
            </div>
          </div>
          
          {/* Loading text with shimmer effect */}
          <div className={desktopStyles.loadingText}>LoFi Study</div>
          <div className={desktopStyles.loadingSubtext}>Preparing your focus environment</div>
          
          {/* Smooth progress indicator */}
          <div className={desktopStyles.loadingProgress}>
            <div className={desktopStyles.progressBar}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={desktopStyles.desktop}>
      {/* Background Video with Enhanced Buffering */}
      <div className={desktopStyles.backgroundContainer}>
        {currentBackground?.src && (
          <video
            ref={videoRef}
            className={desktopStyles.backgroundVideo}
            src={currentBackground.src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadStart={handleVideoLoadStart}
            onCanPlay={handleVideoLoad}
            onError={handleVideoError}
            style={{
              opacity: videoLoadError ? 0 : 1,
              transition: 'opacity 0.3s ease'
            }}
          />
        )}
        
       

        {/* Fallback for video errors */}
        {videoLoadError && (
          <div className={desktopStyles.backgroundFallback}>
            <div className={desktopStyles.fallbackContent}>
              <p>Background video unavailable</p>
              <button 
                onClick={() => setCurrentBackground(DEFAULT_BACKGROUND)}
                className={desktopStyles.fallbackButton}
              >
                Use Default Background
              </button>
            </div>
          </div>
        )}
        
        <div className={desktopStyles.backgroundOverlay} />
      </div>

      {/* Desktop UI Components */}
      <TopBar 
        user={user}
        onToggleStats={() => setShowStats(!showStats)}
        onShare={() => {}} // Empty function for now
      />

      <BottomBar 
        currentTime={currentTime}
        currentDate={currentDate}
        modernApps={modernApps}
        openWindows={openWindows}
        appStates={appStates}
        user={user}
        isConfigured={isConfigured}
        backgroundSaveLoading={backgroundSaveLoading}
        onOpenCalendar={() => setShowCalendar(true)}
        onOpenApp={openApp}
        onOpenBackgrounds={() => setShowBackgrounds(true)}
        onAccountAction={() => {
          if (!user) {
            onShowAuth();
          } else {
            const accountSettingsApp = modernApps.find(app => app.id === 'account-settings');
            if (accountSettingsApp) {
              openApp(accountSettingsApp);
            }
          }
        }}
      />

      <WindowManager 
        openWindows={openWindows}
        onMinimize={minimizeWindow}
        onClose={closeWindow}
        onBringToFront={bringToFront}
      />

      {/* Background Selector Modal */}
      {showBackgrounds && (
        <BackgroundSelector
          showBackgrounds={showBackgrounds}
          currentBackground={currentBackground}
         
          selectedCategory={selectedCategory}
          youtubeUrl={youtubeUrl}
          customBackground={customBackground}
          onClose={() => {
            setShowBackgrounds(false);
            
          }}
          onBackgroundChange={handleBackgroundChange}
          onCategoryChange={setSelectedCategory}
         
          onYoutubeSubmit={() => {
            // YouTube submission logic would go here
          }}
          onYoutubeUrlChange={setYoutubeUrl}
        />
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <Calendar 
          isVisible={showCalendar}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* Stats Modal */}
      {showStats && (
        <StatsModal 
          isOpen={showStats}
          onClose={() => setShowStats(false)} 
        />
      )}

      {/* Music Player Sidebar */}
      <MusicPlayerSidebar 
        isOpen={isMusicSidebarOpen}
        onToggle={() => setIsMusicSidebarOpen(!isMusicSidebarOpen)}
      />

      {/* Notification System */}
      <NotificationManager 
        notifications={notifications} 
        onRemoveNotification={(id: string) => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }}
      />
    </div>
  );
};

export default ModernDesktop;
