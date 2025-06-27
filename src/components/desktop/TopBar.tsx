"use client";

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  BarChart3, 
  Expand, 
  Share,
  Info
} from 'lucide-react';
import InfoModal from '../InfoModal';
import Clock from './Clock';
import desktopStyles from '../../../styles/Desktop.module.css';

interface TopBarProps {
  user: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onToggleStats: () => void;
  onShare: () => void;
}

export default function TopBar({ user, onToggleStats, onShare }: TopBarProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showClock, setShowClock] = useState(false);
  
  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };
  
  return (
    <>
      <div className={desktopStyles.topRightIcons}>
        {/* Clock Component */}
        <Clock 
          isExpanded={showClock}
          onToggle={() => setShowClock(!showClock)}
          onClose={() => setShowClock(false)}
        />
        
        {!user && (
          <button
            className={desktopStyles.topIcon}
            style={{ color: '#f59e0b' }}
            title="Sign in to sync your data"
          >
            <AlertTriangle size={20} />
          </button>
        )}
        
        {user && (
          <button
            onClick={onToggleStats}
            className={desktopStyles.topIcon}
            
          >
            <BarChart3 size={20} />
          </button>
        )}
        
        <button
          onClick={() => setShowInfoModal(true)}
          className={desktopStyles.topIcon}
        >
          <Info size={20} />
        </button>
        
        <button
          onClick={handleFullscreen}
          className={desktopStyles.topIcon}
        >
          <Expand size={20} />
        </button>
        
        <button
          onClick={onShare}
          className={desktopStyles.topIcon}
        >
          <Share size={20} />
        </button>
      </div>

      <InfoModal 
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </>
  );
}
