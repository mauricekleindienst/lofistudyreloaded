"use client";

import React from 'react';
import { 
  Clock, 
  User, 
  Image as ImageIcon,
  LogIn
} from 'lucide-react';
import styles from '../../../styles/SelectionBar.module.css';
import desktopStyles from '../../../styles/Desktop.module.css';
import { type AppStates } from '../../contexts/AppStateContext';

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
  user: any; // eslint-disable-line @typescript-eslint/no-explicit-any
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
  return (
    <div className={styles.selectionBar}>
      {/* Time and Date */}
      <div className={desktopStyles.appBarSection}>
        <button
          onClick={onOpenCalendar}
          className={styles.timeButton}
          title="Open Calendar"
        >
          <Clock size={20} />
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
            </div>
            <div className={desktopStyles.tooltipDescription}>
              {!isConfigured 
                ? 'Authentication not configured' 
                : user 
                  ? `Signed in as ${user.email} • Click for account settings` 
                  : 'Save your progress & sync data'
              }
            </div>
          </div>
        </button>

        {/* Data Sync Status */}
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
  );
}
