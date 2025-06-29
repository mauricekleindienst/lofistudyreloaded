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
  const [currentBackground, setCurrentBackground] = useState<Background>(DEFAULT_BACKGROUND as Background);
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
  const [customBackground] = useState<Background | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Simple video state management
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs for video handling
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize client-side rendering flag
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Simple video loading handlers
  const handleVideoLoad = useCallback(() => {
    if (videoRef.current) {
      setVideoLoadError(false);
      setRetryCount(0);
      videoRef.current.play().catch(console.error);
    }
  }, []);

  const handleVideoError = useCallback(() => {
    console.error('Video failed to load:', currentBackground.src);
    setVideoLoadError(true);
    
    // Simple retry mechanism
    if (retryCount < 2 && currentBackground.id !== DEFAULT_BACKGROUND.id) {
      const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 8000);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, retryDelay);
    } else if (currentBackground.id !== DEFAULT_BACKGROUND.id) {
      // Final fallback to default background
      console.error('Background video failed to load after retries. Using default background.');
      setCurrentBackground(DEFAULT_BACKGROUND as Background);
    }
  }, [currentBackground.src, currentBackground.id, retryCount]);

  // Simple background video effect
  useEffect(() => {
    setRetryCount(0);
    setVideoLoadError(false);
    
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(console.error);
    }
  }, [currentBackground]);

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

  // Handle background change with database persistence
  const handleBackgroundChange = useCallback(async (background: Background) => {
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
  }, [isAuthenticated, saveSelectedBackground]);

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
          <div className={desktopStyles.loadingText}>LoFi Study</div>
          <div className={desktopStyles.loadingSubtext}>Preparing your focus environment</div>
        </div>
      </div>
    );
  }

  return (
    <div className={desktopStyles.desktop}>
      {/* Simple Background Video */}
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
            preload="metadata"
            onCanPlay={handleVideoLoad}
            onError={handleVideoError}
            style={{
              opacity: videoLoadError ? 0 : 1,
              transition: 'opacity 0.5s ease'
            }}
            crossOrigin="anonymous"
            disablePictureInPicture
            controlsList="nodownload noplaybackrate"
          />
        )}

        {/* Fallback for video errors */}
        {videoLoadError && (
          <div className={desktopStyles.backgroundFallback}>
            <div className={desktopStyles.fallbackContent}>
              <p>Background video unavailable</p>
              <button 
                onClick={() => setCurrentBackground(DEFAULT_BACKGROUND as Background)}
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
