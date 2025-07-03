"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Timer, 
  CheckSquare, 
  Calculator as CalculatorIcon,
  Settings,
  Volume2,
  StickyNote
} from 'lucide-react';
import { backgrounds, DEFAULT_BACKGROUND } from '@/data/backgrounds';
import desktopStyles from '../../styles/Desktop.module.css';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { useDataPersistence } from '../hooks/useDataPersistence';
import { useResponsive } from '../hooks/useResponsive';

// Import individual app components
import PomodoroTimer from './apps/PomodoroTimer';
import TodoList from './apps/TodoList';
import Calculator from './apps/Calculator';
import NotesApp from './apps/NotesApp';
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
    id: 'notes',
    name: 'Notes',
    icon: StickyNote,
    component: NotesApp,
    color: 'yellow',
    description: 'Write and organize your notes',
    category: 'productivity'
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
  
  // Responsive utilities
  const { getResponsiveSize: getResponsiveSizeUtil, breakpointInfo, isClient: isResponsiveClient } = useResponsive();

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
  const [animationDisabled, setAnimationDisabled] = useState(false);
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
  const processingBackgroundsRef = useRef<Set<string>>(new Set());
  const preloadManagerRef = useRef<{
    preloadVideo: (background: Background) => Promise<HTMLVideoElement>;
    getBufferedVideo: (backgroundId: string) => HTMLVideoElement | null;
    clearOldBuffers: (keepCount?: number) => void;
    getBufferHealth: (backgroundId: string) => number;
  } | null>(null);

  // Initialize client-side rendering flag
  useEffect(() => {
    setIsClient(true);
    
    // Load animation disabled preference from localStorage
    const savedAnimationDisabled = localStorage.getItem('desktop_animationDisabled');
    if (savedAnimationDisabled !== null) {
      setAnimationDisabled(savedAnimationDisabled === 'true');
    }
  }, []);

  // Save animation disabled preference to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('desktop_animationDisabled', animationDisabled.toString());
    }
  }, [animationDisabled, isClient]);

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
            // Remove from preloaded videos if it failed
            setPreloadedVideos(prev => {
              const newMap = new Map(prev);
              newMap.delete(background.id.toString());
              return newMap;
            });
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
  }, [bufferHealths, preloadedVideos]); // Add missing dependencies

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
        
        // Skip if already processing or already preloaded
        if (processingBackgroundsRef.current.has(backgroundId) || 
            preloadedVideos.has(backgroundId)) {
          continue;
        }

        processingBackgroundsRef.current.add(backgroundId);
        setCurrentlyBuffering(prev => [...prev, backgroundId]);
        
        try {
          await preloadManagerRef.current!.preloadVideo(background);
        } catch (error) {
          console.warn(`Failed to preload background ${background.id}:`, error);
        } finally {
          processingBackgroundsRef.current.delete(backgroundId);
          setCurrentlyBuffering(prev => prev.filter(id => id !== backgroundId));
        }
      }
    };

    // Start preloading after a short delay to not interfere with initial load
    const timer = setTimeout(preloadPopularBackgrounds, 3000);
    return () => clearTimeout(timer);
  }, [isClient]); // Remove currentlyBuffering and preloadedVideos from deps

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
      
      // Only play the video if animation is not disabled
      if (!animationDisabled) {
        videoRef.current.play().catch(console.error);
      } else {
        // Set to first frame when animation is disabled
        videoRef.current.currentTime = 0;
      }
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
        console.error('Background video failed to load. Using default background.');
        setCurrentBackground(DEFAULT_BACKGROUND);
      }
    }
  }, [currentBackground.src, currentBackground.id, retryCount]); // Remove showNotification dependency

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
          if (!animationDisabled) {
            videoRef.current.play().catch(() => {
              // Video autoplay was prevented
            });
          }
        }
        return;
      }
    }
    
    // Fallback to normal loading
    if (videoRef.current) {
      if (!animationDisabled) {
        videoRef.current.play().catch(() => {
          // Video autoplay was prevented
        });
      }
    }
  }, [currentBackground, animationDisabled]);

  // Separate effect for preloading videos to avoid infinite loops
  useEffect(() => {
    if (!preloadManagerRef.current) {
      return;
    }

    const backgroundId = currentBackground.id.toString();
    
    // Skip if already processing or already preloaded
    if (processingBackgroundsRef.current.has(backgroundId) || 
        preloadedVideos.has(backgroundId)) {
      return;
    }

    const preloadCurrentBackground = async () => {
      try {
        processingBackgroundsRef.current.add(backgroundId);
        setCurrentlyBuffering(prev => [...prev, backgroundId]);
        await preloadManagerRef.current!.preloadVideo(currentBackground);
        console.log(`Successfully preloaded background ${currentBackground.id}`);
      } catch (error) {
        console.warn(`Failed to preload background ${currentBackground.id}:`, error);
      } finally {
        processingBackgroundsRef.current.delete(backgroundId);
        setCurrentlyBuffering(prev => prev.filter(id => id !== backgroundId));
      }
    };

    preloadCurrentBackground();
  }, [currentBackground.id]); // Remove preloadedVideos and currentlyBuffering from deps

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

  // Control video playback based on animation disabled state
  useEffect(() => {
    if (videoRef.current && currentBackground?.src) {
      if (animationDisabled) {
        // Pause the video and show first frame when animation is disabled
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      } else {
        // Play the video when animation is enabled
        videoRef.current.play().catch((error) => {
          console.error('Failed to play background video:', error);
        });
      }
    }
  }, [animationDisabled, currentBackground?.src]);

  // Handle background change with database persistence and intelligent preloading
  const handleBackgroundChange = useCallback(async (background: Background) => {
    // Check if video is already buffered for instant switching
    if (preloadManagerRef.current) {
      const bufferedVideo = preloadManagerRef.current.getBufferedVideo(background.id.toString());
      const bufferHealth = preloadManagerRef.current.getBufferHealth(background.id.toString());
      const isInstantSwitch = bufferedVideo !== null && bufferHealth > 0.3;
      console.log(`Background switch - instant: ${isInstantSwitch}`);
    }
    
    setCurrentBackground(background);
    
   

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
  }, [isAuthenticated, saveSelectedBackground, currentlyBuffering, preloadedVideos]);

  // Get responsive size for each app type based on viewport
  const getResponsiveSize = useCallback((appId: string) => {
    if (!isClient) return { width: 350, height: 300, minWidth: 300, minHeight: 250 };

    // Enhanced base sizes with better mobile considerations
    const baseSizes: Record<string, { 
      width: number; 
      height: number; 
      minWidth: number; 
      minHeight: number;
      aspectRatio?: number; // Optional aspect ratio for responsive scaling
    }> = {
      'pomodoro': { 
        width: 320, 
        height: 450, 
        minWidth: 280, 
        minHeight: 360,
        aspectRatio: 0.71 // width/height
      },
      'todo': { 
        width: 380, 
        height: 680, 
        minWidth: 320, 
        minHeight: 400,
        aspectRatio: 0.56
      },
      'music': { 
        width: 300, 
        height: 240, 
        minWidth: 280, 
        minHeight: 200,
        aspectRatio: 1.25
      },
      'notes': { 
        width: 800, 
        height: 600, 
        minWidth: 400, 
        minHeight: 300,
        aspectRatio: 1.33
      },
      'calculator': { 
        width: 280, 
        height: 380, 
        minWidth: 240, 
        minHeight: 320,
        aspectRatio: 0.74
      },
      'sound-player': { 
        width: 380, 
        height: 480, 
        minWidth: 320, 
        minHeight: 400,
        aspectRatio: 0.79
      },
      'account-settings': { 
        width: 400, 
        height: 500, 
        minWidth: 340, 
        minHeight: 400,
        aspectRatio: 0.8
      },
      'chatbot': {
        width: 420,
        height: 600,
        minWidth: 350,
        minHeight: 450,
        aspectRatio: 0.7
      },
      'weather': {
        width: 350,
        height: 400,
        minWidth: 300,
        minHeight: 350,
        aspectRatio: 0.875
      }
    };

    const baseSize = baseSizes[appId] || { 
      width: 380, 
      height: 450, 
      minWidth: 320, 
      minHeight: 350,
      aspectRatio: 0.84
    };

    // Use the responsive utility to calculate size
    return getResponsiveSizeUtil(baseSize.width, baseSize.height, {
      aspectRatio: baseSize.aspectRatio,
      minWidth: baseSize.minWidth,
      minHeight: baseSize.minHeight,
      maxWidthPercent: breakpointInfo.maxWidthPercent,
      maxHeightPercent: breakpointInfo.maxHeightPercent
    });
  }, [isClient, getResponsiveSizeUtil, breakpointInfo]);

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
    
    // Responsive positioning logic
    const getResponsivePosition = () => {
      if (!isResponsiveClient) {
        return { x: 80 + (windowCount * 30), y: 60 + (windowCount * 30) };
      }

      // Base offset calculations using responsive utilities
      let baseOffsetX = 60;
      let baseOffsetY = 40;
      let cascadeOffset = 25;

      // Adjust for different breakpoints
      if (breakpointInfo.name === 'xs') {
        baseOffsetX = 10;
        baseOffsetY = 10;
        cascadeOffset = 10;
      } else if (breakpointInfo.name === 'sm') {
        baseOffsetX = 20;
        baseOffsetY = 20;
        cascadeOffset = 15;
      } else if (breakpointInfo.name === 'md') {
        baseOffsetX = 40;
        baseOffsetY = 30;
        cascadeOffset = 20;
      }

      // Calculate position with cascade
      let x = baseOffsetX + (windowCount * cascadeOffset);
      let y = baseOffsetY + (windowCount * cascadeOffset);

      // Get viewport constraints from responsive utility
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // Prevent windows from going off-screen
      const maxX = viewport.width - size.width - 20;
      const maxY = viewport.height - size.height - (breakpointInfo.isMobile ? 80 : 60);

      // Reset cascade if we're going off-screen
      if (x > maxX || y > maxY) {
        // Start a new cascade row/column
        const resetCount = Math.floor(windowCount / 4); // Reset every 4 windows
        x = baseOffsetX + (resetCount * cascadeOffset * 2);
        y = baseOffsetY + ((windowCount % 4) * cascadeOffset);
        
        // Final bounds check
        x = Math.min(Math.max(x, 10), maxX);
        y = Math.min(Math.max(y, 10), maxY);
      }

      // For very small screens, center the window
      if (breakpointInfo.name === 'xs') {
        x = Math.max((viewport.width - size.width) / 2, 5);
        y = Math.max((viewport.height - size.height) / 2, 30);
      }

      return { x, y };
    };
    
    const newWindow: ModernWindow = {
      id: `${app.id}-${Date.now()}`,
      app,
      isMinimized: false,
      position: getResponsivePosition(),
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
          <>
            {animationDisabled ? (
              // Still image when animation is disabled
              <video
                ref={videoRef}
                className={desktopStyles.backgroundVideo}
                src={currentBackground.src}
                muted
                preload="metadata"
                onLoadStart={handleVideoLoadStart}
                onCanPlay={handleVideoLoad}
                onError={handleVideoError}
                style={{
                  opacity: videoLoadError ? 0 : 1,
                  transition: 'opacity 0.3s ease'
                }}
                poster={`${currentBackground.src}#t=0.1`}
              />
            ) : (
              // Animated video when animation is enabled
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
          </>
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
          animationDisabled={animationDisabled}
          onClose={() => {
            setShowBackgrounds(false);
            
          }}
          onBackgroundChange={handleBackgroundChange}
          onCategoryChange={setSelectedCategory}
          onAnimationToggle={setAnimationDisabled}
         
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
