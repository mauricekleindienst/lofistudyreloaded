"use client";

import React from 'react';
import { 
  AlertTriangle, 
  BarChart3, 
  Expand, 
  Share 
} from 'lucide-react';
import desktopStyles from '../../../styles/Desktop.module.css';

interface TopBarProps {
  user: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onToggleStats: () => void;
  onShare: () => void;
}

export default function TopBar({ user, onToggleStats, onShare }: TopBarProps) {
  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className={desktopStyles.topRightIcons}>
      {!user && (
        <button
          className={desktopStyles.topIcon}
          title="Sessions won't be saved"
          style={{ color: '#f59e0b' }}
        >
          <AlertTriangle size={20} />
        </button>
      )}
      
      {user && (
        <button
          onClick={onToggleStats}
          className={desktopStyles.topIcon}
          title="View Statistics"
        >
          <BarChart3 size={20} />
        </button>
      )}
      
      <button
        onClick={handleFullscreen}
        className={desktopStyles.topIcon}
        title="Toggle Fullscreen"
      >
        <Expand size={20} />
      </button>
      
      <button
        onClick={onShare}
        className={desktopStyles.topIcon}
        title="Share"
      >
        <Share size={20} />
      </button>
    </div>
  );
}
