"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Timer,
  CheckSquare,
  Calculator as CalculatorIcon,
  Settings,
  Volume2,
  StickyNote,
  MessageSquare,
  Layers,
  Flame,
  Wind,
  Hourglass,
} from 'lucide-react';
import { chatStore } from '../lib/chat';
import { DEFAULT_BACKGROUND, findBackground } from '@/data/backgrounds';
import desktopStyles from '../../styles/Desktop.module.css';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/database';
import type { ToastDetail } from '../lib/api';
import { useResponsive } from '../hooks/useResponsive';

import PomodoroTimer from './apps/PomodoroTimer';
import TodoList from './apps/TodoList';
import Calculator from './apps/Calculator';
import NotesApp from './apps/NotesApp';
import Calendar from './Calendar';
import AccountSettings from './apps/AccountSettings';
import MusicPlayerSidebar from './MusicPlayerSidebar';
import StatsModal from './StatsModal';
import SoundPlayer from './apps/SoundPlayer';
import ChatApp from './apps/ChatApp';
import Flashcards from './apps/Flashcards';
import Habits from './apps/Habits';
import Breathing from './apps/Breathing';
import Stopwatch from './apps/Stopwatch';
import AppLauncher from './desktop/AppLauncher';

import TopBar from './desktop/TopBar';
import BottomBar from './desktop/BottomBar';
import WindowManager from './desktop/WindowManager';
import BackgroundSelector from './desktop/BackgroundSelector';
import NotificationManager from './desktop/NotificationManager';
import type { DesktopProps, ModernApp, ModernWindow, ModernNotification, Background } from './desktop/types';

const modernApps: ModernApp[] = [
  { id: 'pomodoro', name: 'Focus Timer', icon: Timer, component: PomodoroTimer, color: 'orange', description: 'Pomodoro sessions with breaks and a daily goal', category: 'study', dock: true },
  { id: 'todo', name: 'Tasks', icon: CheckSquare, component: TodoList, color: 'blue', description: 'Plan tasks and track focus sessions per task', category: 'productivity', dock: true },
  { id: 'notes', name: 'Notes', icon: StickyNote, component: NotesApp, color: 'yellow', description: 'Markdown notes with checklists', category: 'productivity', dock: true },
  { id: 'flashcards', name: 'Flashcards', icon: Layers, component: Flashcards, color: 'green', description: 'Learn with spaced repetition', category: 'study', dock: true },
  { id: 'sound-player', name: 'Sound Mixer', icon: Volume2, component: SoundPlayer, color: 'purple', description: 'Mix rain, fire, café and more', category: 'study', dock: true },
  { id: 'habits', name: 'Habits', icon: Flame, component: Habits, color: 'pink', description: 'Build daily habits and keep streaks', category: 'productivity' },
  { id: 'stopwatch', name: 'Stopwatch', icon: Hourglass, component: Stopwatch, color: 'purple', description: 'Stopwatch with laps and a countdown timer', category: 'tools' },
  { id: 'breathing', name: 'Breathe', icon: Wind, component: Breathing, color: 'cyan', description: 'Guided breathing to reset between sessions', category: 'study' },
  { id: 'calculator', name: 'Calculator', icon: CalculatorIcon, component: Calculator, color: 'orange', description: 'Quick calculations', category: 'tools' },
  { id: 'chat', name: 'Chat', icon: MessageSquare, component: ChatApp, color: 'purple', description: 'Chat with other students', category: 'entertainment', dock: true },
  { id: 'account-settings', name: 'Account', icon: Settings, component: AccountSettings, color: 'blue', description: 'Manage your account', category: 'tools' },
];

// Preferred floating-window sizes (desktop/tablet); phones use full-screen sheets.
const WINDOW_SIZES: Record<string, { width: number; height: number }> = {
  pomodoro: { width: 360, height: 540 },
  todo: { width: 380, height: 600 },
  notes: { width: 820, height: 600 },
  calculator: { width: 320, height: 500 },
  'sound-player': { width: 360, height: 640 },
  'account-settings': { width: 440, height: 560 },
  chat: { width: 400, height: 580 },
  flashcards: { width: 420, height: 620 },
  habits: { width: 400, height: 600 },
  stopwatch: { width: 360, height: 520 },
  breathing: { width: 360, height: 520 },
};

const COMPACT_BREAKPOINT = 640;

const ModernDesktop: React.FC<DesktopProps> = ({ onShowAuth }) => {
  const { appStates, updateChatState } = useAppState();
  const { user, loading: authLoading } = useAuth();
  const { viewport, isClient } = useResponsive();
  const compact = isClient && viewport.width > 0 && viewport.width < COMPACT_BREAKPOINT;

  const [openWindows, setOpenWindows] = useState<ModernWindow[]>([]);
  const zCounter = useRef(100);
  const [currentBackground, setCurrentBackground] = useState<Background>(DEFAULT_BACKGROUND);
  // Readiness is tracked per source, so switching backgrounds can't race a stale event.
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [useMobileVideo, setUseMobileVideo] = useState(false);
  // The <video> is only created once we know which file (1080p/720p) and whether the user
  // chose still images — otherwise phones start downloading the big file first.
  const [videoDecided, setVideoDecided] = useState(false);
  // Animated unless the user switches to "Still" in the gallery. The OS reduce-motion
  // setting is not used here: many people have it on unknowingly, and a slow ambient
  // loop is the point of the app (the gallery toggle is the explicit opt-out).
  const [motionPref, setMotionPref] = useState<boolean | null>(null);
  const stillOnly = motionPref === false;
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<ModernNotification[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isMusicSidebarOpen, setIsMusicSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showStats, setShowStats] = useState(false);
  const [showLauncher, setShowLauncher] = useState(false);
  const [dim, setDim] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const openWindowsRef = useRef<ModernWindow[]>([]);
  useEffect(() => {
    openWindowsRef.current = openWindows;
  }, [openWindows]);

  // --- environment: clock, data-saver, reduced motion ---
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 15_000);

    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = Boolean(conn?.saveData) || ['slow-2g', '2g', '3g'].includes(conn?.effectiveType ?? '');
    setUseMobileVideo(slow || window.innerWidth < 1100 || window.matchMedia('(pointer: coarse)').matches);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // --- toasts from anywhere in the app ---
  const pushNotification = useCallback((message: string, type: ModernNotification['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNotifications((prev) => [...prev.slice(-3), { id, message, type }]);
    window.setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), type === 'error' ? 7000 : 4500);
  }, []);

  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, type } = (e as CustomEvent<ToastDetail>).detail;
      pushNotification(message, type);
    };
    const onOpenAuth = () => onShowAuth();
    window.addEventListener('lofi:toast', onToast);
    window.addEventListener('lofi:open-auth', onOpenAuth);
    return () => {
      window.removeEventListener('lofi:toast', onToast);
      window.removeEventListener('lofi:open-auth', onOpenAuth);
    };
  }, [pushNotification, onShowAuth]);

  // --- background: restore the saved choice (device first, then account) ---
  useEffect(() => {
    const settings = db.getLocalSettings();
    const local = findBackground(settings.selectedBackground);
    if (local) setCurrentBackground(local);
    if (typeof settings.backgroundMotion === 'boolean') setMotionPref(settings.backgroundMotion);
    if (typeof settings.backgroundDim === 'number') setDim(Math.min(80, Math.max(0, settings.backgroundDim)));
    setVideoDecided(true);
  }, []);

  useEffect(() => {
    const fromAccount = findBackground(user?.settings?.selectedBackground);
    if (fromAccount) setCurrentBackground(fromAccount);
  }, [user?.id, user?.settings?.selectedBackground]);

  const videoSrc = useMobileVideo ? currentBackground.srcMobile : currentBackground.src;

  // Autoplay can be refused (iOS low-power mode); the poster stays visible then.
  // The element is server-rendered, so it may already be playable before React
  // attached onCanPlay — check readyState instead of relying on the event alone.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || stillOnly) return;
    if (video.readyState >= 3) setReadySrc(videoSrc);
    // Autoplay can be refused (iOS Low Power Mode, battery saver). Retry on the first
    // tap/click/key instead of leaving a still image forever.
    const retry = () => {
      video.play().catch(() => undefined);
      removeRetry();
    };
    const removeRetry = () => {
      window.removeEventListener('pointerdown', retry);
      window.removeEventListener('keydown', retry);
    };
    video.play().catch(() => {
      window.addEventListener('pointerdown', retry, { once: true });
      window.addEventListener('keydown', retry, { once: true });
    });
    const onVisibility = () => {
      if (document.visibilityState === 'visible') video.play().catch(() => undefined);
      else video.pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      removeRetry();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [videoSrc, stillOnly, videoDecided]);

  const handleMotionChange = useCallback((value: boolean) => {
    setMotionPref(value);
    db.saveSettings({ backgroundMotion: value });
  }, []);

  const handleDimChange = useCallback((value: number) => {
    setDim(value);
    db.saveSettings({ backgroundDim: value });
  }, []);

  const handleBackgroundChange = useCallback((background: Background) => {
    setCurrentBackground(background);
    db.saveSettings({ selectedBackground: String(background.id) });
  }, []);

  // --- chat unread badge (only signed-in users poll in the background) ---
  useEffect(() => {
    const isChatVisible = openWindows.some((w) => w.app.id === 'chat' && !w.isMinimized);
    if (isChatVisible && appStates.chat.unreadCount > 0) updateChatState({ unreadCount: 0 });
  }, [openWindows, appStates.chat.unreadCount, updateChatState]);

  useEffect(() => {
    if (!user) return;
    return chatStore.subscribe((state) => {
      const incoming = state.lastBatch.filter((m) => m.user_id !== user.id);
      if (incoming.length === 0) return;
      updateChatState({ lastMessageTimestamp: Date.now() });
      const isChatVisible = openWindowsRef.current.some((w) => w.app.id === 'chat' && !w.isMinimized);
      if (!isChatVisible) updateChatState((prev) => ({ unreadCount: prev.unreadCount + incoming.length }));
    });
  }, [user, updateChatState]);

  // --- window management ---
  const nextZ = () => ++zCounter.current;

  const openApp = useCallback(
    (app: ModernApp) => {
      setOpenWindows((prev) => {
        const existing = prev.find((w) => w.app.id === app.id);
        if (existing) {
          return prev.map((w) => (w.id === existing.id ? { ...w, zIndex: nextZ(), isMinimized: false } : w));
        }
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const preferred = WINDOW_SIZES[app.id] ?? { width: 380, height: 480 };
        // Windows start below the top bar (~84px) and must end above the dock (~110px).
        const size = {
          width: Math.min(preferred.width, vw - 24),
          height: Math.max(260, Math.min(preferred.height, vh - 84 - 112)),
        };
        // Tile new windows left-to-right next to the visible ones; cascade once the row is full.
        const visible = prev.filter((w) => !w.isMinimized);
        const rightEdge = visible.reduce((max, w) => Math.max(max, w.position.x + w.size.width), 0);
        const top = Math.max(76, Math.min(84, vh - size.height - 112));
        let position = { x: visible.length ? rightEdge + 16 : 24, y: top };
        if (position.x + size.width > vw - 12) {
          const cascade = (visible.length % 6) * 32;
          position = {
            x: Math.max(12, Math.min(24 + cascade, vw - size.width - 12)),
            y: Math.max(76, Math.min(top + cascade, vh - size.height - 96)),
          };
        }
        return [...prev, { id: `${app.id}-${Date.now()}`, app, isMinimized: false, position, size, zIndex: nextZ() }];
      });
    },
    []
  );

  // Other components can ask for an app by id (e.g. Tasks → "focus on this").
  useEffect(() => {
    const onOpenApp = (e: Event) => {
      const app = modernApps.find((a) => a.id === (e as CustomEvent<string>).detail);
      if (app) openApp(app);
    };
    window.addEventListener('lofi:open-app', onOpenApp);
    return () => window.removeEventListener('lofi:open-app', onOpenApp);
  }, [openApp]);

  const closeWindow = useCallback((windowId: string) => {
    setOpenWindows((prev) => prev.filter((w) => w.id !== windowId));
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    setOpenWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, isMinimized: true } : w)));
  }, []);

  const restoreWindow = useCallback((windowId: string) => {
    setOpenWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, isMinimized: false, zIndex: nextZ() } : w)));
  }, []);

  const bringToFront = useCallback((windowId: string) => {
    setOpenWindows((prev) => {
      const top = Math.max(0, ...prev.map((w) => w.zIndex));
      const target = prev.find((w) => w.id === windowId);
      if (!target || target.zIndex === top) return prev;
      return prev.map((w) => (w.id === windowId ? { ...w, zIndex: nextZ() } : w));
    });
  }, []);

  const moveWindow = useCallback((windowId: string, position: { x: number; y: number }) => {
    setOpenWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, position } : w)));
  }, []);

  const openAccount = useCallback(() => {
    if (!user) {
      onShowAuth();
      return;
    }
    const app = modernApps.find((a) => a.id === 'account-settings');
    if (app) openApp(app);
  }, [user, onShowAuth, openApp]);

  // Keyboard: Escape minimizes the top-most window when no modal is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || showBackgrounds || showCalendar || showStats || showLauncher || isMusicSidebarOpen) return;
      // Escape in a text field belongs to that field; an open dialog (sign-in, about, …) closes first.
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      const visible = openWindowsRef.current.filter((w) => !w.isMinimized);
      if (!visible.length) return;
      const top = visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
      minimizeWindow(top.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showBackgrounds, showCalendar, showStats, showLauncher, isMusicSidebarOpen, minimizeWindow]);

  const currentTime = now ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const currentDate = now ? now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : '';

  const videoReady = readySrc === videoSrc;

  return (
    <div className={desktopStyles.desktop}>
      {/* Poster first (instant), video fades in over it once it can play */}
      <div
        className={desktopStyles.backgroundPoster}
        style={{ backgroundImage: `url(${currentBackground.poster})` }}
        aria-hidden
      />
      {videoDecided && !stillOnly && failedSrc !== videoSrc && (
        <video
          key={videoSrc}
          ref={videoRef}
          className={desktopStyles.backgroundVideo}
          src={videoSrc}
          poster={currentBackground.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          aria-hidden
          tabIndex={-1}
          onCanPlay={() => setReadySrc(videoSrc)}
          onPlaying={() => setReadySrc(videoSrc)}
          onError={() => setFailedSrc(videoSrc)}
          style={{ opacity: videoReady ? 1 : 0 }}
        />
      )}
      <div className={desktopStyles.backgroundShade} aria-hidden />
      {dim > 0 && <div className={desktopStyles.backgroundDim} style={{ opacity: dim / 100 }} aria-hidden />}

      <main className={desktopStyles.workspace} aria-busy={authLoading}>
        <TopBar
          user={user}
          onToggleStats={() => setShowStats((v) => !v)}
          onAccountAction={openAccount}
          onToggleMusic={() => setIsMusicSidebarOpen((v) => !v)}
          onOpenTimer={() => openApp(modernApps[0])}
        />

        <WindowManager
          openWindows={openWindows}
          compact={compact}
          onMinimize={minimizeWindow}
          onClose={closeWindow}
          onBringToFront={bringToFront}
          onMove={moveWindow}
        />

        <BottomBar
          currentTime={currentTime}
          currentDate={currentDate}
          modernApps={modernApps}
          openWindows={openWindows}
          appStates={appStates}
          user={user}
          onOpenCalendar={() => setShowCalendar(true)}
          onOpenApp={openApp}
          onMinimize={minimizeWindow}
          onRestoreWindow={restoreWindow}
          onOpenBackgrounds={() => setShowBackgrounds(true)}
          onAccountAction={openAccount}
          onOpenLauncher={() => setShowLauncher((v) => !v)}
          launcherOpen={showLauncher}
        />
      </main>

      {showBackgrounds && (
        <BackgroundSelector
          showBackgrounds={showBackgrounds}
          currentBackground={currentBackground}
          selectedCategory={selectedCategory}
          onClose={() => setShowBackgrounds(false)}
          onBackgroundChange={handleBackgroundChange}
          onCategoryChange={setSelectedCategory}
          motion={!stillOnly}
          onMotionChange={handleMotionChange}
          dim={dim}
          onDimChange={handleDimChange}
        />
      )}

      {showLauncher && (
        <AppLauncher apps={modernApps.filter((a) => a.id !== 'account-settings')} onOpen={openApp} onClose={() => setShowLauncher(false)} />
      )}

      {showCalendar && <Calendar isVisible={showCalendar} onClose={() => setShowCalendar(false)} />}

      {showStats && <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} onSignIn={onShowAuth} />}

      <MusicPlayerSidebar isOpen={isMusicSidebarOpen} onToggle={() => setIsMusicSidebarOpen((v) => !v)} />

      <NotificationManager
        notifications={notifications}
        onRemoveNotification={(id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
      />
    </div>
  );
};

export default ModernDesktop;
