"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  const [backgroundsToShow, setBackgroundsToShow] = useState(8);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [customBackground, setCustomBackground] = useState<Background | null>(null);
  const [showStats, setShowStats] = useState(false);
  
  // Refs for event handling
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

  // Video loading and error handling
  const handleVideoLoad = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  };

  const handleVideoError = () => {
    console.error('Video failed to load:', currentBackground.src);
    if (currentBackground.id !== DEFAULT_BACKGROUND.id) {
      setCurrentBackground(DEFAULT_BACKGROUND);
    }
  };

  // Background video effect
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Video autoplay was prevented
      });
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
  const handleBackgroundChange = async (background: Background, showNotificationParam = true) => {
    setCurrentBackground(background);
    
    if (showNotificationParam) {
      showNotification({
        id: Date.now().toString(),
        message: `Background changed to ${background.alt}`,
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
          // Don't show error notification since localStorage backup exists
        }
      } catch (error) {
        console.error('Failed to save background to database:', error);
        // Don't show error notification since localStorage backup exists
      } finally {
        setBackgroundSaveLoading(false);
      }
    }
  };

  // Get responsive size for each app type based on viewport
  const getResponsiveSize = (appId: string) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const baseSizes: Record<string, { width: number; height: number; minWidth: number; minHeight: number }> = {
      'pomodoro': { width: 260, height: 350, minWidth: 220, minHeight: 280 },
      'todo': { width: 350, height: 420, minWidth: 300, minHeight: 360 },
      'music': { width: 280, height: 220, minWidth: 240, minHeight: 180 },
      'notes': { width: 400, height: 320, minWidth: 350, minHeight: 280 },
      'calculator': { width: 240, height: 350, minWidth: 200, minHeight: 280 },
      'sound-player': { width: 380, height: 450, minWidth: 320, minHeight: 380 },
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
  };

  const openApp = (app: ModernApp) => {
    const existingWindow = openWindows.find(w => w.app.id === app.id);
    if (existingWindow) {
      bringToFront(existingWindow.id);
      if (existingWindow.isMinimized) {
        minimizeWindow(existingWindow.id);
      }
      return;
    }

    const optimalSize = getResponsiveSize(app.id);
    const windowCount = openWindows.length;
    const baseX = 100 + (windowCount * 30) % 200;
    const baseY = 50 + (windowCount * 25) % 100;
      
    const newWindow: ModernWindow = {
      id: `${app.id}-${Date.now()}`,
      app,
      position: { x: baseX, y: baseY },
      size: optimalSize,
      isMinimized: false,
      zIndex: highestZIndex + 1
    };
    
    setOpenWindows([...openWindows, newWindow]);
    setHighestZIndex(prev => prev + 1);
  };

  const closeWindow = (windowId: string) => {
    setOpenWindows(openWindows.filter(w => w.id !== windowId));
  };

  const minimizeWindow = (windowId: string) => {
    setOpenWindows(openWindows.map(w => 
      w.id === windowId ? { ...w, isMinimized: !w.isMinimized } : w
    ));
  };

  const bringToFront = (windowId: string) => {
    const newZIndex = highestZIndex + 1;
    setHighestZIndex(newZIndex);
    setOpenWindows(openWindows.map(w => 
      w.id === windowId ? { ...w, zIndex: newZIndex } : w
    ));
  };

  const showNotification = (notification: ModernNotification) => {
    setNotifications(prev => [...prev, notification]);
    if (notification.duration !== 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, notification.duration || 5000);
    }
  };

  const handleAccountAction = () => {
    if (!user) {
      onShowAuth();
    } else {
      const accountSettingsApp = modernApps.find(app => app.id === 'account-settings');
      if (accountSettingsApp) {
        openApp(accountSettingsApp);
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Lofi Study Environment',
        text: 'Check out this amazing study environment!',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showNotification({
        id: Date.now().toString(),
        message: 'Link copied to clipboard!',
        type: 'success'
      });
    }
  };

  const convertYouTubeUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId[1]}?autoplay=1&mute=1&loop=1&playlist=${videoId[1]}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`;
    }
    return null;
  };

  const handleYouTubeSubmit = () => {
    const embedUrl = convertYouTubeUrl(youtubeUrl);
    if (embedUrl) {
      const customBg: Background = {
        id: 999,
        src: embedUrl,
        alt: 'Custom YouTube Background',
        note: 'Custom YouTube video background',
        createdby: 'User',
        priority: false,
        category: 'custom',
        isYoutube: true
      };
      setCustomBackground(customBg);
      handleBackgroundChange(customBg);
      setYoutubeUrl('');
      setShowBackgrounds(false);
    } else {
      alert('Please enter a valid YouTube URL');
    }
  };

  return (
    <div className={desktopStyles.desktop}>
      {/* Background Video or YouTube */}
      {currentBackground.isYoutube ? (
        <iframe
          className={desktopStyles.backgroundVideo}
          src={currentBackground.src}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          className={desktopStyles.backgroundVideo}
          src={currentBackground.src}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
        />
      )}

      {/* Background Overlay */}
      <div className={desktopStyles.backgroundOverlay} />

      {/* Top Bar */}
      <TopBar 
        user={user}
        onToggleStats={() => setShowStats(true)}
        onShare={handleShare}
      />

      {/* Music Player Sidebar */}
      <MusicPlayerSidebar 
        isOpen={isMusicSidebarOpen}
        onToggle={() => setIsMusicSidebarOpen(!isMusicSidebarOpen)}
      />

      {/* Background Selection Panel */}
      <BackgroundSelector
        showBackgrounds={showBackgrounds}
        currentBackground={currentBackground}
        backgroundsToShow={backgroundsToShow}
        selectedCategory={selectedCategory}
        youtubeUrl={youtubeUrl}
        customBackground={customBackground}
        onClose={() => {
          setShowBackgrounds(false);
          setBackgroundsToShow(8);
        }}
        onBackgroundChange={handleBackgroundChange}
        onCategoryChange={setSelectedCategory}
        onLoadMore={() => setBackgroundsToShow(prev => Math.min(prev + 8, backgrounds.length))}
        onYoutubeSubmit={handleYouTubeSubmit}
        onYoutubeUrlChange={setYoutubeUrl}
      />

      {/* Window Manager */}
      <WindowManager
        openWindows={openWindows}
        onMinimize={minimizeWindow}
        onClose={closeWindow}
        onBringToFront={bringToFront}
      />

      {/* Bottom Bar */}
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
        onAccountAction={handleAccountAction}
      />

      {/* Notification Manager */}
      <NotificationManager
        notifications={notifications}
        onRemoveNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />

      {/* Keyboard Shortcuts */}
      <div className={desktopStyles.hiddenInput}>
        <input
          onKeyDown={(e) => {
            if (e.key === 'b' || e.key === 'B') {
              setShowBackgrounds(true);
            } else if (e.key === 'm' || e.key === 'M') {
              setIsMusicSidebarOpen(!isMusicSidebarOpen);
            } else if (e.key === 'Escape') {
              setShowBackgrounds(false);
              setShowCalendar(false);
              setIsMusicSidebarOpen(false);
              setShowStats(false);
            }
          }}
          autoFocus
        />
      </div>

      {/* Calendar Modal */}
      <Calendar 
        isVisible={showCalendar} 
        onClose={() => setShowCalendar(false)} 
      />

      {/* Stats Modal */}
      <StatsModal 
        isOpen={showStats} 
        onClose={() => setShowStats(false)} 
      />
    </div>
  );
};

export default ModernDesktop;
