"use client";

import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  User, 
  Image as ImageIcon,
  LogIn
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
  onOpenBackgrounds: () => void;
  onAccountAction: () => void;
}

// Helper function to get app runtime info
const getAppRuntimeInfo = (app: ModernApp, window: ModernWindow | undefined, appStates: AppStates) => {
  if (!window) return null;
  
  if (app.id === 'pomodoro') {
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
              return !!user;
            }
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
                  onClick={() => onOpenApp(app)}
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
      </div>

      {/* Right Section */}
      <div className={desktopStyles.appBarSection}>
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
                <img 
                  src={getUserAvatarUrl(user)!} 
                  alt="User Avatar"
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
                  ? `Signed in as ${user.full_name || user.user_metadata?.full_name || user.email} • Click for account settings` 
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
