"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Clock,
  User,
  Image as ImageIcon,
  LogIn,
  MessageSquareDot
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import styles from '../../../styles/SelectionBar.module.css';
import desktopStyles from '../../../styles/Desktop.module.css';
import { type AppStates } from '../../contexts/AppStateContext';

// Extended user type that includes custom users table fields
interface ExtendedUser extends SupabaseUser {
  avatar_url?: string;
  full_name?: string;
  premium?: boolean;
  streak_count?: number;
  total_focus_time?: number;
  settings?: Record<string, unknown>;
}

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
}

interface BottomBarProps {
  currentTime: string;
  currentDate: string;
  modernApps: ModernApp[];
  openWindows: ModernWindow[];
  appStates: AppStates;
  user: ExtendedUser | null;
  isConfigured: boolean;
  backgroundSaveLoading: boolean;
  onOpenCalendar: () => void;
  onOpenApp: (app: ModernApp) => void;
  onMinimize: (windowId: string) => void;
  onRestoreWindow: (windowId: string) => void;
  onOpenBackgrounds: () => void;
  onAccountAction: () => void;
}

// Helper function to get app runtime info
const getAppRuntimeInfo = (app: ModernApp, window: ModernWindow | undefined, appStates: AppStates) => {
  if (app.id === 'pomodoro') {
    if (!window) return null; // Pomodoro timer only makes sense if app is open
    // Show timer when running OR when time is not at default values
    if (appStates.pomodoro.isRunning || appStates.pomodoro.minutes !== 25 || appStates.pomodoro.seconds !== 0) {
      return `${appStates.pomodoro.minutes.toString().padStart(2, '0')}:${appStates.pomodoro.seconds.toString().padStart(2, '0')}`;
    }
    return null;
  }

  if (app.id === 'music') {
    if (appStates.music.isPlaying) {
      return '♪';
    }
    return null;
  }

  if (app.id === 'todo') {
    if (appStates.todo.pendingCount > 0) {
      return appStates.todo.pendingCount.toString();
    }
    return null;
  }

  if (app.id === 'chat') {
    if (appStates.chat.unreadCount > 0) {
      return appStates.chat.unreadCount.toString();
    }
    return null;
  }

  return null;
};

// Helper function to get avatar URL from user object
const getUserAvatarUrl = (user: ExtendedUser | null): string | null => {
  if (!user) return null;

  // Check custom users table avatar_url first
  if (user.avatar_url) return user.avatar_url;

  // Check Supabase auth user metadata
  if (user.user_metadata?.avatar_url) return user.user_metadata.avatar_url;

  // Check other common OAuth avatar fields
  if (user.user_metadata?.picture) return user.user_metadata.picture;
  if (user.user_metadata?.avatar) return user.user_metadata.avatar;

  return null;
};

export default function BottomBar({
  currentTime,
  currentDate,
  modernApps,
  openWindows,
  appStates,
  user,
  isConfigured,
  backgroundSaveLoading,
  onOpenCalendar,
  onOpenApp,
  onMinimize,
  onRestoreWindow,
  onOpenBackgrounds,
  onAccountAction
}: BottomBarProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent hydration mismatch by not rendering time-sensitive content until client-side
  const displayTime = isClient ? currentTime : '--:--';
  const displayDate = isClient ? currentDate : 'Loading...';

  // Handle app button click - minimize if open, restore if minimized, open if closed
  const handleAppButtonClick = (app: ModernApp) => {
    const openWindow = openWindows.find(w => w.app.id === app.id);

    if (!openWindow) {
      // App is not open, so open it
      onOpenApp(app);
    } else if (openWindow.isMinimized) {
      // App is minimized, so restore it
      onRestoreWindow(openWindow.id);
    } else {
      // App is open and not minimized, so minimize it
      onMinimize(openWindow.id);
    }
  };

  return (
    <div className={styles.selectionBar}>
      {/* Time and Date */}
      <div className={desktopStyles.appBarSection}>        <button
        onClick={onOpenCalendar}
        className={styles.timeButton}
        title="Open Calendar"
      >

        <Clock size={20} />
        <div className={styles.timeDisplay}>
          <div className={styles.timeText}>{displayTime}</div>
          <div className={styles.dateText}>
            {displayDate}
          </div>
        </div>
        <div className={styles.tooltip}>
          <div className="font-semibold">Calendar</div>
          <div className={desktopStyles.tooltipDescription}>View calendar and current time</div>
        </div>
      </button>
      </div>

      {/* Apps */}
      <div className={desktopStyles.appBarSection}>
        {modernApps
          .filter(app => {
            if (app.id === 'account-settings') {
              return false; // Hide from main app list, accessible via account button
            }
            return true;
          })
          .map(app => {
            const openWindow = openWindows.find(w => w.app.id === app.id);
            const isOpen = !!openWindow;
            const isMinimized = openWindow?.isMinimized || false;

            // Determine the icon to use
            let CurrentIcon = app.icon;

            // Special case for chat: show dot icon if there was recent activity (last 5 mins)
            if (app.id === 'chat') {
              const isRecentlyActive = appStates.chat.lastMessageTimestamp && (Date.now() - appStates.chat.lastMessageTimestamp < 5 * 60 * 1000);
              if (isRecentlyActive) {
                CurrentIcon = MessageSquareDot;
              }
            }

            const runtimeInfo = getAppRuntimeInfo(app, openWindow, appStates);

            return (
              <div key={app.id} className={desktopStyles.appContainer}>
                <button
                  onClick={() => handleAppButtonClick(app)}
                  className={`${styles.iconButton} ${isOpen ? styles.active : ''} ${isMinimized ? styles.minimized : ''}`}
                >
                  <CurrentIcon size={22} />

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
                    {isOpen
                      ? (isMinimized ? 'Click to restore' : 'Click to minimize')
                      : app.description}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Right Section */}
      <div className={desktopStyles.appBarSection}>
        <div className={desktopStyles.divider} />

        <button
          onClick={onOpenBackgrounds}
          className={styles.iconButton}
        >
          <ImageIcon size={20} />
          <div className={styles.tooltip}>
            <div className="font-semibold">Backgrounds</div>
            <div className={desktopStyles.tooltipDescription}>Change ambient background</div>
          </div>
        </button>

        <button
          onClick={onAccountAction}
          className={`${styles.iconButton} ${styles.accountButton} ${user ? styles.authenticatedUser : ''}`}
          disabled={!isConfigured}
        >
          {user ? (
            <div className={styles.userAvatar}>
              {getUserAvatarUrl(user) ? (
                <Image
                  src={getUserAvatarUrl(user)!}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className={styles.avatarImage}
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallbackIcon = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallbackIcon) {
                      fallbackIcon.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <User
                size={18}
                style={{ display: getUserAvatarUrl(user) ? 'none' : 'flex' }}
                className={styles.fallbackIcon}
              />
            </div>
          ) : (
            <LogIn size={20} />
          )}
          {user ? (
            <div className={styles.authenticatedIndicator}></div>
          ) : (
            isConfigured && <div className={styles.unauthenticatedIndicator}></div>
          )}
          <div className={styles.tooltip}>
            <div className="font-semibold">
              {!isConfigured ? 'Auth Disabled' : user ? 'Account' : 'Sign In'}
            </div>
            <div className={desktopStyles.tooltipDescription}>
              {!isConfigured
                ? 'Authentication not configured'
                : user
                  ? `Signed in as ${user.full_name || user.user_metadata?.full_name || user.email}`
                  : 'Save your progress & sync data'
              }
            </div>
          </div>
        </button>

        {/* Data Sync Status - Only show syncing indicator, not local mode */}
        {backgroundSaveLoading && (
          <div className={`${styles.statusIndicator} ${styles.syncing}`}>
            <div className={styles.syncSpinner}></div>
            <div className={styles.tooltip}>
              <div className="font-semibold">Syncing...</div>
              <div className={desktopStyles.tooltipDescription}>Saving your preferences</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
