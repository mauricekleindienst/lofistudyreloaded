"use client";

import React from 'react';
import {
  Clock,
  User,
  Image as ImageIcon,
  LogIn,
  MessageSquareDot
} from 'lucide-react';
import styles from '../../../styles/SelectionBar.module.css';
import desktopStyles from '../../../styles/Desktop.module.css';
import { type AppStates } from '../../contexts/AppStateContext';
import type { AppUser } from '../../contexts/AuthContext';
import type { ModernApp, ModernWindow } from './types';

interface BottomBarProps {
  currentTime: string;
  currentDate: string;
  modernApps: ModernApp[];
  openWindows: ModernWindow[];
  appStates: AppStates;
  user: AppUser | null;
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
    // The timer keeps running when its window is closed, so show it whenever it runs.
    if (appStates.pomodoro.isRunning) {
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

const getUserAvatarUrl = (user: AppUser | null): string | null => user?.avatar_url || null;

export default function BottomBar({
  currentTime,
  currentDate,
  modernApps,
  openWindows,
  appStates,
  user,
  onOpenCalendar,
  onOpenApp,
  onMinimize,
  onRestoreWindow,
  onOpenBackgrounds,
  onAccountAction
}: BottomBarProps) {
  const displayTime = currentTime || '--:--';
  const displayDate = currentDate || '\u00a0';

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
    <nav className={styles.selectionBar} aria-label="Dock">
      {/* Time and Date */}
      <div className={desktopStyles.appBarSection}>        <button
        onClick={onOpenCalendar}
        className={styles.timeButton}
        title="Open Calendar"
        aria-label={`Calendar — ${displayTime}, ${displayDate}`}
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

            // Chat shows a dotted icon while there are unread messages
            if (app.id === 'chat' && appStates.chat.unreadCount > 0) {
              CurrentIcon = MessageSquareDot;
            }

            const runtimeInfo = getAppRuntimeInfo(app, openWindow, appStates);

            return (
              <div key={app.id} className={desktopStyles.appContainer}>
                <button
                  onClick={() => handleAppButtonClick(app)}
                  className={`${styles.iconButton} ${isOpen ? styles.active : ''} ${isMinimized ? styles.minimized : ''}`}
                  aria-label={app.name}
                  aria-pressed={isOpen && !isMinimized}
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
          aria-label="Change background"
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
          aria-label={user ? 'Account' : 'Sign in'}
        >
          {user ? (
            <div className={styles.userAvatar}>
              {getUserAvatarUrl(user) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getUserAvatarUrl(user)!}
                  alt=""
                  width={32}
                  height={32}
                  referrerPolicy="no-referrer"
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
            <div className={styles.unauthenticatedIndicator}></div>
          )}
          <div className={styles.tooltip}>
            <div className="font-semibold">
              {user ? 'Account' : 'Sign In'}
            </div>
            <div className={desktopStyles.tooltipDescription}>
              {user ? `Signed in as ${user.full_name || user.email}` : 'Sync your progress across devices'}
            </div>
          </div>
        </button>

      </div>
    </nav>
  );
}
