"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Clock, 
  User, 
  Timer, 
  CheckSquare, 
  Music, 
  Image as ImageIcon,
  X,
  Minus,
  HelpCircle,
  Star,
  Heart,  Sparkles,
  FileText,
  Calculator as CalculatorIcon,
  Share,
  LogIn,
  Settings,
  AlertTriangle,
  Expand
} from 'lucide-react';
import { backgrounds, DEFAULT_BACKGROUND } from '@/data/backgrounds';
import styles from '../../styles/SelectionBar.module.css';
import desktopStyles from '../../styles/Desktop.module.css';
import { useAppState, type AppStates } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { useDataPersistence } from '../hooks/useDataPersistence';

// Import individual app components
import PomodoroTimer from './apps/PomodoroTimer';
import TodoList from './apps/TodoList';
import NotesApp from './apps/NotesApp';
import Calculator from './apps/Calculator';
import Calendar from './Calendar';
import AccountSettings from './apps/AccountSettings';
import MusicPlayerSidebar from './MusicPlayerSidebar';

// Background interface to support both regular and YouTube backgrounds
interface Background {
  id: number;
  src: string;
  alt: string;
  note: string;
  createdby: string;
  priority: boolean;
  category: string;
  isYoutube?: boolean;
}

// Modern App Interface
interface ModernApp {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  component: React.ComponentType;
  category: 'productivity' | 'entertainment' | 'tools' | 'study';
  color: string;
  description: string;
}

interface ModernWindow {
  id: string;
  app: ModernApp;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  zIndex: number;
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
}

interface ModernNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

// Modern Apps Configuration
const modernApps: ModernApp[] = [
  {
    id: 'pomodoro',
    name: 'Focus Timer',
    icon: Timer,
    component: PomodoroTimer,
    category: 'productivity',
    color: 'orange',
    description: 'Pomodoro technique for enhanced focus'
  },  {
    id: 'todo',
    name: 'Tasks',
    icon: CheckSquare,
    component: TodoList,
    category: 'productivity',
    color: 'blue',
    description: 'Organize your tasks and goals'
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: FileText,
    component: NotesApp,
    category: 'productivity',
    color: 'green',
    description: 'Take quick notes and organize your thoughts'
  },  {
    id: 'calculator',
    name: 'Calculator',
    icon: CalculatorIcon,
    component: Calculator,
    category: 'tools',
    color: 'orange',
    description: 'Basic calculator for quick calculations'
  },
  {
    id: 'account-settings',
    name: 'Account Settings',
    icon: Settings,
    component: AccountSettings,
    category: 'tools',
    color: 'blue',
    description: 'Manage your account and preferences'
  }
];

// Custom Draggable Hook for React 19 compatibility
const useDraggable = (nodeRef: React.RefObject<HTMLElement | null>) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!nodeRef.current) return;
    
    const rect = nodeRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [nodeRef]);
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !nodeRef.current) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep window within viewport bounds
    const maxX = window.innerWidth - nodeRef.current.offsetWidth;
    const maxY = window.innerHeight - nodeRef.current.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
      nodeRef.current.style.left = `${boundedX}px`;
    nodeRef.current.style.top = `${boundedY}px`;
  }, [isDragging, dragOffset.x, dragOffset.y, nodeRef]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    isDragging,
    handleMouseDown
  };
};

// Custom Draggable Component
interface DraggableProps {
  children: React.ReactNode;
  disabled?: boolean;
  bounds?: string;
  defaultPosition?: { x: number; y: number };
  onStart?: () => void;
  handle?: string;
}

const CustomDraggable: React.FC<DraggableProps> = ({ 
  children, 
  disabled = false, 
  defaultPosition = { x: 0, y: 0 },
  onStart,
  handle = '.window-handle'
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const { isDragging, handleMouseDown } = useDraggable(nodeRef);

  useEffect(() => {
    if (nodeRef.current && defaultPosition) {
      nodeRef.current.style.left = `${defaultPosition.x}px`;
      nodeRef.current.style.top = `${defaultPosition.y}px`;
    }
  }, [defaultPosition]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (disabled) return;
    
    // Check if the click is on the handle element
    const target = e.target as HTMLElement;
    const handleElement = target.closest(handle);
    if (!handleElement) return;
    
    if (onStart) onStart();
    handleMouseDown(e);
  };
  return (
    <div
      ref={nodeRef}
      style={{ position: 'absolute' }}
      onMouseDown={handleDragStart}
      className={isDragging ? desktopStyles.selectNone : ''}
    >
      {children}
    </div>
  );
};

// Helper function to get app runtime info
const getAppRuntimeInfo = (app: ModernApp, window: ModernWindow | undefined, appStates: AppStates) => {
  if (!window) return null;
  
  // For pomodoro timer, show actual current time
  if (app.id === 'pomodoro') {
    if (appStates.pomodoro.isRunning || appStates.pomodoro.minutes > 0 || appStates.pomodoro.seconds > 0) {
      return `${appStates.pomodoro.minutes.toString().padStart(2, '0')}:${appStates.pomodoro.seconds.toString().padStart(2, '0')}`;
    }
    return null;
  }
  
  // For music player, show playing indicator
  if (app.id === 'music') {
    if (appStates.music.isPlaying) {
      return '♪';
    }
    return null;
  }
  
  // For todo app, show pending tasks count
  if (app.id === 'todo') {
    if (appStates.todo.pendingCount > 0) {
      return appStates.todo.pendingCount.toString();
    }
    return null;
  }
  
  return null;
};

interface DesktopProps {
  onShowAuth: () => void;
}

// Main Modern Desktop Component
const ModernDesktop: React.FC<DesktopProps> = ({ onShowAuth }) => {
  // Access app state context
  const { appStates } = useAppState();
  const { user, isConfigured } = useAuth();
  const { 
    isAuthenticated, 
    saveSelectedBackground, 
    loadSelectedBackground 
  } = useDataPersistence();  // State management
  const [openWindows, setOpenWindows] = useState<ModernWindow[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(100);
  const [currentBackground, setCurrentBackground] = useState<Background>(DEFAULT_BACKGROUND);
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [notifications, setNotifications] = useState<ModernNotification[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [backgroundSaveLoading, setBackgroundSaveLoading] = useState(false);
  const [isMusicSidebarOpen, setIsMusicSidebarOpen] = useState(false);  const [backgroundsToShow, setBackgroundsToShow] = useState(8);
  const [selectedCategory, setSelectedCategory] = useState('all');  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [customBackground, setCustomBackground] = useState<Background | null>(null);
  
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
    
    // Set initial values
    updateDateTime();
    
    // Update every second
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
    // Fallback to default background if current one fails
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
    };    loadSavedBackground();
  }, [isAuthenticated, loadSelectedBackground]);  // Handle background change with database persistence
  const handleBackgroundChange = async (background: Background, showNotificationParam = true) => {
    // Optimistic update - change background immediately
    setCurrentBackground(background);
    
    if (showNotificationParam) {
      showNotification({
        id: Date.now().toString(),
        message: `Background changed to ${background.alt}`,
        type: 'success'
      });
    }

    // Save to database if authenticated
    if (isAuthenticated) {
      setBackgroundSaveLoading(true);
      try {
        const success = await saveSelectedBackground(background.id.toString());
        if (!success) {
          // If save failed, show error but don't revert the background
          showNotification({
            id: Date.now().toString(),
            message: 'Failed to save background preference',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Failed to save background:', error);
        showNotification({
          id: Date.now().toString(),
          message: 'Failed to save background preference',
          type: 'error'
        });      } finally {
        setBackgroundSaveLoading(false);
      }
    }
  };  // Get responsive size for each app type based on viewport
  const getResponsiveSize = (appId: string) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };    // Base sizes (optimized for better usability while staying compact)
    const baseSizes: Record<string, { width: number; height: number; minWidth: number; minHeight: number }> = {
      'pomodoro': { width: 260, height: 350, minWidth: 220, minHeight: 280 },
      'todo': { width: 350, height: 420, minWidth: 300, minHeight: 360 },
      'music': { width: 280, height: 220, minWidth: 240, minHeight: 180 },
      'notes': { width: 400, height: 320, minWidth: 350, minHeight: 280 },
      'calculator': { width: 240, height: 320, minWidth: 200, minHeight: 280 },
      'account-settings': { width: 360, height: 400, minWidth: 320, minHeight: 360 }
    };

    const baseSize = baseSizes[appId] || { width: 350, height: 300, minWidth: 300, minHeight: 250 };

    // Responsive scaling based on viewport
    let scaleFactor = 1;
    
    if (viewport.width < 768) {
      // Mobile - smaller apps
      scaleFactor = 0.75;
    } else if (viewport.width < 1024) {
      // Tablet - slightly smaller
      scaleFactor = 0.85;
    } else if (viewport.width > 1920) {
      // Large screens - slightly bigger
      scaleFactor = 1.15;
    }

    // Ensure apps don't exceed viewport bounds
    const maxWidth = Math.min(baseSize.width * scaleFactor, viewport.width * 0.45);
    const maxHeight = Math.min(baseSize.height * scaleFactor, viewport.height * 0.7);

    return {
      width: Math.max(maxWidth, baseSize.minWidth),
      height: Math.max(maxHeight, baseSize.minHeight),
      minWidth: baseSize.minWidth,
      minHeight: baseSize.minHeight
    };
  };

  // Add resize handler for responsive windows
  const handleWindowResize = useCallback(() => {
    setOpenWindows(prevWindows => 
      prevWindows.map(window => {
        const newSize = getResponsiveSize(window.app.id);
        return {
          ...window,
          size: {
            width: Math.min(window.size.width, newSize.width),
            height: Math.min(window.size.height, newSize.height)
          }
        };
      })
    );
  }, []);

  // Listen for window resize events
  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [handleWindowResize]);

  const openApp = (app: ModernApp) => {
    const existingWindow = openWindows.find(w => w.app.id === app.id);
    if (existingWindow) {
      bringToFront(existingWindow.id);
      if (existingWindow.isMinimized) {
        minimizeWindow(existingWindow.id);
      }
      return;
    }    const optimalSize = getResponsiveSize(app.id);
    
    // Generate deterministic but varied positioning for each window
    const windowCount = openWindows.length;
    const baseX = 100 + (windowCount * 30) % 200;
    const baseY = 50 + (windowCount * 25) % 100;
      const newWindow: ModernWindow = {
      id: `${app.id}-${Date.now()}`,
      app,
      position: { 
        x: baseX, 
        y: baseY 
      },
      size: optimalSize,
      isMinimized: false,
      zIndex: highestZIndex + 1
    };
    
    setOpenWindows([...openWindows, newWindow]);
    setHighestZIndex(prev => prev + 1);
    
    // Removed the showNotification call - no more top-right notifications when opening apps
  };

  const closeWindow = (windowId: string) => {
    setOpenWindows(openWindows.filter(w => w.id !== windowId));
  };  const minimizeWindow = (windowId: string) => {
    setOpenWindows(openWindows.map(w => 
      w.id === windowId ? { ...w, isMinimized: !w.isMinimized } : w
    ));
  };

  const resizeWindow = (windowId: string, newSize: { width: number; height: number }) => {
    setOpenWindows(openWindows.map(w => {
      if (w.id === windowId) {
        const responsiveSize = getResponsiveSize(w.app.id);
        return {
          ...w,
          size: {
            width: Math.max(newSize.width, responsiveSize.minWidth || 160),
            height: Math.max(newSize.height, responsiveSize.minHeight || 140)
          }
        };
      }
      return w;
    }));
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
      // Not logged in - show auth modal
      onShowAuth();
    } else {
      // Logged in - open Account Settings app
      const accountSettingsApp = modernApps.find(app => app.id === 'account-settings');
      if (accountSettingsApp) {
        openApp(accountSettingsApp);
      }
    }  };

  // Utility functions
  const convertYouTubeUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId[1]}?autoplay=1&mute=1&loop=1&playlist=${videoId[1]}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`;
    }
    return null;
  };

  const getFilteredBackgrounds = () => {
    let filtered = backgrounds;
    if (selectedCategory !== 'all') {
      filtered = backgrounds.filter(bg => bg.category === selectedCategory);
    }
    return filtered.slice(0, backgroundsToShow);
  };  const handleYouTubeSubmit = () => {
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
  };return (
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
      )}{/* Top Right Icons */}
      <div className={desktopStyles.topRightIcons}>
        {!user && (
          <button
            className={desktopStyles.topIcon}
            title="Sessions won't be saved"
            style={{ color: '#f59e0b' }}
          >
            <AlertTriangle size={20} />
          </button>
        )}        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen();
            }
          }}
          className={desktopStyles.topIcon}
          title="Toggle Fullscreen"
        >
          <Expand size={20} />
        </button>
        <button
          onClick={() => {
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
          }}
          className={desktopStyles.topIcon}
          title="Share"
        >
          <Share size={20} />
        </button>
      </div>      {/* Background Overlay */}
      <div className={desktopStyles.backgroundOverlay} />

      {/* Music Player Sidebar */}
      <MusicPlayerSidebar 
        isOpen={isMusicSidebarOpen}
        onToggle={() => setIsMusicSidebarOpen(!isMusicSidebarOpen)}
      />

      {/* Background Selection Panel */}
      {showBackgrounds && (
        <div className={desktopStyles.modalOverlay}>
          <div className={`${desktopStyles.modalContainer} ${desktopStyles.backgroundModal}`}>
            <div className={desktopStyles.modalHeader}>
              <div className={desktopStyles.modalTitleSection}>
            
                <div>
                  <h3 className={desktopStyles.modalTitle}>Background Gallery</h3>
                  <p className={desktopStyles.modalSubtitle}>Choose your perfect study ambiance</p>
                </div>
              </div>
              <button
                onClick={() => setShowBackgrounds(false)}
                className={desktopStyles.modalCloseButton}
              >
                <X size={20} />
              </button>
            </div>
              {/* YouTube URL Input */}
            <div className={desktopStyles.youtubeSection}>
              <h4 className={desktopStyles.youtubeSectionTitle}>Add Custom YouTube Background</h4>
              <div className={desktopStyles.youtubeInputContainer}>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)"
                  className={desktopStyles.youtubeInput}
                />
                <button
                  onClick={handleYouTubeSubmit}
                  className={desktopStyles.youtubeSubmitButton}
                  disabled={!youtubeUrl.trim()}
                >
                  Add
                </button>
              </div>
            </div>
            
            {/* Categories Filter */}
            <div className={desktopStyles.categoriesContainer}>
              {['all', 'nature', 'urban', 'cozy', 'gaming'].map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`${desktopStyles.categoryButton} ${
                    selectedCategory === category ? desktopStyles.activeCategoryButton : ''
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>            <div className={desktopStyles.backgroundGrid}>
              {/* Custom YouTube background */}
              {customBackground && (
                <div
                  key="custom-youtube"
                  className={`${desktopStyles.backgroundItem} ${
                    currentBackground.id === customBackground.id ? desktopStyles.active : ''
                  }`}
                  onClick={() => {
                    handleBackgroundChange(customBackground);
                    setShowBackgrounds(false);
                  }}
                >
                  <div className={desktopStyles.backgroundPreview}>                    <iframe
                      src={customBackground.src}
                      className={desktopStyles.backgroundVideo}
                      frameBorder="0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                    {/* No overlay for YouTube backgrounds for cleaner look */}
                  </div>
                  <div className={desktopStyles.backgroundActions}>
                    <button
                      className={desktopStyles.previewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentBackground(customBackground);
                      }}
                    >
                      Preview
                    </button>
                    <button
                      className={desktopStyles.selectButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBackgroundChange(customBackground);
                        setShowBackgrounds(false);
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              )}
              
              {/* Regular backgrounds */}
              {getFilteredBackgrounds().map(bg => (
                <div
                  key={bg.id}
                  className={`${desktopStyles.backgroundItem} ${
                    currentBackground.id === bg.id ? desktopStyles.active : ''
                  }`}
                  onClick={() => {
                    handleBackgroundChange(bg);
                    setShowBackgrounds(false);
                  }}
                >
                  <div className={desktopStyles.backgroundPreview}>
                    <video
                      src={bg.src}
                      className={desktopStyles.backgroundVideo}
                      muted
                      loop
                      preload="none"
                      onMouseEnter={(e) => {
                        e.currentTarget.preload = "metadata";
                        e.currentTarget.play().catch(() => {});
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                    <div className={desktopStyles.backgroundOverlay}>
                      <div className={desktopStyles.backgroundInfo}>
                        <div className={desktopStyles.backgroundName}>{bg.alt}</div>
                        <div className={desktopStyles.backgroundCategory}>
                          <span className={desktopStyles.categoryTag}>{bg.category}</span>
                        </div>
                      </div>
                      {currentBackground.id === bg.id && (
                        <div className={desktopStyles.selectedIndicator}>
                          <CheckSquare size={16} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={desktopStyles.backgroundActions}>                    <button
                      className={desktopStyles.previewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Preview doesn't save to database
                        setCurrentBackground(bg);
                      }}
                    >
                      Preview
                    </button>
                    <button
                      className={desktopStyles.selectButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBackgroundChange(bg);
                        setShowBackgrounds(false);
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}            </div>
            
            {backgroundsToShow < backgrounds.length && (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <button
                  onClick={() => setBackgroundsToShow(prev => Math.min(prev + 8, backgrounds.length))}
                  className={desktopStyles.footerButton}
                  style={{ margin: '0 auto' }}
                >
                  Show More ({backgrounds.length - backgroundsToShow} remaining)
                </button>
              </div>
            )}
            
            <div className={desktopStyles.modalFooter}>
              <div className={desktopStyles.footerInfo}>
                <span>Showing {Math.min(backgroundsToShow, backgrounds.length)} of {backgrounds.length} backgrounds</span>
              </div>
              <button
                onClick={() => {
                  setShowBackgrounds(false);
                  setBackgroundsToShow(8); // Reset to initial count when closing
                }}
                className={desktopStyles.footerButton}
              >
                Close Gallery
              </button>
            </div>
          </div>
        </div>
      )}{/* Help Dialog */}
      {showHelp && (
        <div className={`${desktopStyles.modalOverlay} ${desktopStyles.helpModal}`}>
          <div className={`${desktopStyles.modalContainer} ${desktopStyles.helpModal}`}>
            <div className={desktopStyles.modalHeader}>
              <h3 className={desktopStyles.helpModalTitle}>Help & Shortcuts</h3>
              <button
                onClick={() => setShowHelp(false)}
                className={styles.iconButton}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className={desktopStyles.helpContent}>
              <div className={desktopStyles.shortcutItem}>
                <span className={desktopStyles.shortcutLabel}>Switch Windows</span>
                <kbd className={desktopStyles.shortcutKey}>Alt + Tab</kbd>
              </div>
              <div className={desktopStyles.shortcutItem}>
                <span className={desktopStyles.shortcutLabel}>Close Dialogs</span>
                <kbd className={desktopStyles.shortcutKey}>ESC</kbd>
              </div>              <div className={desktopStyles.shortcutItem}>
                <span className={desktopStyles.shortcutLabel}>Background Panel</span>
                <kbd className={desktopStyles.shortcutKey}>B Key</kbd>
              </div>
              <div className={desktopStyles.shortcutItem}>
                <span className={desktopStyles.shortcutLabel}>Music Sidebar</span>
                <kbd className={desktopStyles.shortcutKey}>M Key</kbd>
              </div>
              <div className={desktopStyles.shortcutItem}>
                <span className={desktopStyles.shortcutLabel}>Show Help</span>
                <kbd className={desktopStyles.shortcutKey}>? Key</kbd>
              </div>
            </div>
            
            <div className={desktopStyles.helpSection}>
              <h4 className={desktopStyles.helpSectionTitle}>Features</h4>
              <ul className={desktopStyles.featuresList}>
                <li className={desktopStyles.featureItem}>
                  <Star size={14} className={desktopStyles.iconYellow} />
                  <span>Drag windows to move them around</span>
                </li>
                <li className={desktopStyles.featureItem}>
                  <Sparkles size={14} className={desktopStyles.iconPurple} />
                  <span>Modern glass morphism design</span>
                </li>
                <li className={desktopStyles.featureItem}>
                  <Heart size={14} className={desktopStyles.iconPink} />
                  <span>Enhanced productivity tools</span>
                </li>
                <li className={desktopStyles.featureItem}>
                  <Music size={14} className={desktopStyles.iconBlue} />
                  <span>Beautiful ambient backgrounds</span>
                </li>
              </ul>            </div>
          </div>
        </div>
      )}

      {/* Open Windows */}
      {openWindows.map(window => (
        <CustomDraggable
          key={window.id}
          defaultPosition={window.position}
          handle=".window-handle"
          bounds="parent"
          onStart={() => bringToFront(window.id)}
        >          <div 
            className={`${desktopStyles.window} ${window.isMinimized ? desktopStyles.minimized : ''}`}
            style={{ 
              zIndex: 30 + window.zIndex,
              width: window.size.width,
              height: window.size.height
            }}
          >
            {/* Window Header */}
            <div className={`window-handle ${desktopStyles.windowHeader}`}>            <div className={desktopStyles.windowTitleSection}>
              <window.app.icon size={20} className={desktopStyles.whiteIcon} />
              <span className={desktopStyles.windowTitle}>{window.app.name}</span>
              <span className={desktopStyles.windowCategory}>
                {window.app.category}
              </span>
            </div>              <div className={desktopStyles.windowControls}>
                <button
                  onClick={() => minimizeWindow(window.id)}
                  className={desktopStyles.windowButton}
                  title="Minimize"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => closeWindow(window.id)}
                  className={`${desktopStyles.windowButton} ${desktopStyles.closeButton}`}
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>            {/* Window Content */}
            <div className={desktopStyles.windowContent}>
              <window.app.component />
            </div></div>
        </CustomDraggable>
      ))}      {/* Modern Bottom App Bar */}
      <div className={styles.selectionBar}>        {/* Time and Date with Calendar */}
        <div className={desktopStyles.appBarSection}>
          <button
            onClick={() => setShowCalendar(true)}
            className={styles.timeButton}
            title="Open Calendar"
          >            <Clock size={20} />
            <div className={styles.timeDisplay}>
              <div className={styles.timeText}>{currentTime || '--:--'}</div>
              <div className={styles.dateText}>
                {currentDate || 'Loading...'}
              </div>
            </div>
            <div className={styles.tooltip}>
              <div className="font-semibold">Calendar</div>
              <div className={desktopStyles.tooltipDescription}>View calendar and current time</div>
            </div>
          </button>
        </div>        {/* Apps */}
        <div className={desktopStyles.appBarSection}>
          {modernApps
            .filter(app => {
              // Hide Account Settings if user is not authenticated
              if (app.id === 'account-settings') {
                return !!user;
              }
              // Show all other apps regardless of authentication status
              return true;
            })
            .map(app => {
            const openWindow = openWindows.find(w => w.app.id === app.id);
            const isOpen = !!openWindow;
            const isMinimized = openWindow?.isMinimized || false;
            const runtimeInfo = getAppRuntimeInfo(app, openWindow, appStates);
            
            return (
              <div key={app.id} className={desktopStyles.appContainer}>
                <button
                  onClick={() => openApp(app)}
                  className={`${styles.iconButton} ${isOpen ? styles.active : ''} ${isMinimized ? styles.minimized : ''}`}
                >
                  <app.icon size={22} />
                  {isOpen && !isMinimized && <div className={styles.notificationDot} />}
                  {isMinimized && <div className={styles.minimizedIndicator} />}
                  {runtimeInfo && (
                    <div className={styles.runtimeInfo}>
                      {runtimeInfo}
                    </div>
                  )}
                </button>
                <div className={styles.tooltip}>
                  <div className="font-semibold">{app.name}</div>
                  <div className={desktopStyles.tooltipDescription}>
                    {isMinimized ? 'Click to restore' : app.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>        {/* System Actions */}
        <div className={desktopStyles.appBarSection}>          
        

          <button
            onClick={() => setShowBackgrounds(true)}
            className={styles.iconButton}
          >
            <ImageIcon size={20} />
            <div className={styles.tooltip}>
              <div className="font-semibold">Backgrounds</div>
              <div className={desktopStyles.tooltipDescription}>Change ambient background</div>
            </div>
          </button>          <button
            onClick={() => setShowHelp(true)}
            className={styles.iconButton}
          >
            <HelpCircle size={20} />
            <div className={styles.tooltip}>
              <div className="font-semibold">Help</div>
              <div className={desktopStyles.tooltipDescription}>Keyboard shortcuts</div>
            </div>
          </button>          <button
            onClick={handleAccountAction}
            className={`${styles.iconButton} ${user ? styles.authenticatedUser : ''}`}
            disabled={!isConfigured}
          >
            {user ? (
              <div className={styles.userAvatar}>
                <User size={18} />
              </div>
            ) : (
              <LogIn size={20} />
            )}
            {user && <div className={styles.authenticatedIndicator}></div>}
            <div className={styles.tooltip}>
              <div className="font-semibold">
                {!isConfigured ? 'Auth Disabled' : user ? 'Account' : 'Sign In'}
              </div>              <div className={desktopStyles.tooltipDescription}>
                {!isConfigured 
                  ? 'Authentication not configured' 
                  : user 
                    ? `Signed in as ${user.email} • Click for account settings` 
                    : 'Save your progress & sync data'
                }
              </div>            </div>
          </button>

          {/* Data Sync Status - Only show when there's something meaningful to display */}
          {(backgroundSaveLoading || (!user && isConfigured)) && (
            <div className={`${styles.statusIndicator} ${backgroundSaveLoading ? styles.syncing : styles.localMode}`}>
              {backgroundSaveLoading ? (
                <div className={styles.syncSpinner}></div>
              ) : (
                <div className={styles.localModeIcon}>⚡</div>
              )}
              <div className={styles.tooltip}>
                <div className="font-semibold">
                  {backgroundSaveLoading ? 'Syncing...' : 'Local Mode'}
                </div>
                <div className={desktopStyles.tooltipDescription}>
                  {backgroundSaveLoading 
                    ? 'Saving your preferences' 
                    : 'Sign in to sync across devices'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Notifications */}
      <div className={desktopStyles.notificationsContainer}>
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={desktopStyles.notification}
          >
            {notification.icon && (
              <div className={desktopStyles.notificationIcon}>
                <notification.icon size={18} />
              </div>
            )}
            <div className={desktopStyles.notificationContent}>
              <p className={desktopStyles.notificationMessage}>{notification.message}</p>
              <p className={desktopStyles.notificationType}>{notification.type}</p>
            </div>
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className={desktopStyles.notificationClose}
            >
              <X size={12} />
            </button>
          </div>        ))}
      </div>

      {/* Keyboard Shortcuts */}
      <div className={desktopStyles.hiddenInput}>        <input
          onKeyDown={(e) => {
            if (e.key === 'b' || e.key === 'B') {
              setShowBackgrounds(true);
            } else if (e.key === 'm' || e.key === 'M') {
              setIsMusicSidebarOpen(!isMusicSidebarOpen);
            } else if (e.key === '?' || e.key === '/') {
              setShowHelp(true);            } else if (e.key === 'Escape') {
              setShowBackgrounds(false);
              setShowHelp(false);
              setShowCalendar(false);
              setIsMusicSidebarOpen(false);
            }
          }}
          autoFocus        />
      </div>

      {/* Calendar Modal */}
      <Calendar 
        isVisible={showCalendar} 
        onClose={() => setShowCalendar(false)} 
      />
    </div>
  );
};

export default ModernDesktop;
