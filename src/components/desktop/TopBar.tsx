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
import desktopStyles from '../../../styles/Desktop.module.css';

interface TopBarProps {
  user: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onToggleStats: () => void;
  onShare: () => void;
}

export default function TopBar({ user, onToggleStats, onShare }: TopBarProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };
  
  return (
    <>
      <div className={desktopStyles.topRightIcons}>        {!user && (
          <button
            className={`${desktopStyles.topIcon} ${desktopStyles.topIconWarning}`}
            title="Sessions won't be saved"
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
          onClick={() => setShowInfoModal(true)}
          className={desktopStyles.topIcon}
          title="About Lo-Fi.Study"
        >
          <Info size={20} />
        </button>
        
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

      <InfoModal 
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </>
  );
}
