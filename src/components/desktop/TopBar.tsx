"use client";

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  BarChart3, 
  Expand, 
  Share,
  Info,

} from 'lucide-react';
import { FaDiscord } from "react-icons/fa";
import InfoModal from '../InfoModal';
import DiscordModal from '../DiscordModal';
import AuthModal from '../AuthModal';
import Clock from './Clock';
import desktopStyles from '../../../styles/Desktop.module.css';

// Motivational quotes array (moved outside component to avoid recreating)
const motivationalQuotes = [
  "You're doing great! Keep up the focused work! 🌟",
  "Every minute of study brings you closer to your goals! 📚",
  "Focus is your superpower - you've got this! 💪",
  "Small steps lead to big achievements! Keep going! 🚀",
  "Your dedication today shapes your success tomorrow! ✨",
  "Learning never stops - you're investing in yourself! 🧠",
  "Break through barriers with your determination! 🔥",
  "Knowledge is power, and you're building it right now! ⚡",
  "Stay consistent, stay focused, stay amazing! 🎯",
  "Your future self will thank you for this effort! 🙏",
  "Progress over perfection - you're doing wonderfully! 🌈",
  "Each study session makes you stronger and smarter! 💎"
];

interface TopBarProps {
  user: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onToggleStats: () => void;
  onAccountAction: () => void;
  onShare?: () => void; // Make optional since we're not using the prop
}

export default function TopBar({ user, onToggleStats }: TopBarProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Motivational quotes timer
  useEffect(() => {
    const showMotivationalQuote = () => {
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      setNotificationMessage(randomQuote);
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000); // Show for 5 seconds for quotes
    };

    // Show first quote after 15 minutes
    const initialTimer = setTimeout(showMotivationalQuote, 15 * 60 * 1000);
    
    // Then show every 15 minutes
    const interval = setInterval(showMotivationalQuote, 15 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []); // Empty dependency array since motivationalQuotes is now outside component
  
  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotificationMessage('Share Lofi Study with your friends! 🎵');
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setNotificationMessage('Share Lofi Study with your friends! 🎵');
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
  };
  
  return (
    <>
      {/* Notification */}
      {showNotification && (
        <div className={desktopStyles.notification}>
          {notificationMessage}
        </div>
      )}

      <div className={desktopStyles.topRightIcons}>
        {/* Clock Component */}
        <Clock 
          isExpanded={showClock}
          onToggle={() => setShowClock(!showClock)}
          onClose={() => setShowClock(false)}
        />
        
        {!user && (
          <>
            <button
              className={desktopStyles.topIcon}
              style={{ color: '#f59e0b' }}
              onClick={() => setShowAuthModal(true)}
            >
              <AlertTriangle size={20} />
              <div className={desktopStyles.topIconTooltip}>
                Sign in to sync your data
              </div>
            </button>
            <AuthModal isVisible={showAuthModal} onClose={() => setShowAuthModal(false)} />
          </>
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
          onClick={() => setShowDiscordModal(true)}
          className={desktopStyles.topIcon}
        >
          <FaDiscord size={20} />
        </button> 
         
        <button
          onClick={handleFullscreen}
          className={desktopStyles.topIcon}
        >
          <Expand size={20} />
        </button>
        
        <button
          onClick={handleShare}
          className={desktopStyles.topIcon}
        >
          <Share size={20} />
        </button>
      </div>

      <InfoModal 
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
      <DiscordModal
        isOpen={showDiscordModal}
        onClose={() => setShowDiscordModal(false)}
      />
    </>
  );
}
