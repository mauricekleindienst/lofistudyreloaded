"use client";

import React, { useState, useEffect } from 'react';
import { LogIn, BarChart3, Expand, Shrink, Share2, Info, Music, UserRound } from 'lucide-react';
import { FaDiscord } from "react-icons/fa";
import InfoModal from '../InfoModal';
import DiscordModal from '../DiscordModal';
import Clock from './Clock';
import { toast } from '../../lib/api';
import type { AppUser } from '../../contexts/AuthContext';
import desktopStyles from '../../../styles/Desktop.module.css';

const motivationalQuotes = [
  "You're doing great! Keep up the focused work!",
  "Every minute of study brings you closer to your goals!",
  "Focus is your superpower - you've got this!",
  "Small steps lead to big achievements! Keep going!",
  "Your dedication today shapes your success tomorrow!",
  "Learning never stops - you're investing in yourself!",
  "Stay consistent, stay focused, stay amazing!",
  "Your future self will thank you for this effort!",
  "Progress over perfection - you're doing wonderfully!",
];

const QUOTE_INTERVAL = 20 * 60 * 1000;

interface TopBarProps {
  user: AppUser | null;
  onToggleStats: () => void;
  onAccountAction: () => void;
  onToggleMusic: () => void;
  onOpenTimer: () => void;
}

export default function TopBar({ user, onToggleStats, onAccountAction, onToggleMusic, onOpenTimer }: TopBarProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  // A gentle nudge every 20 minutes while the tab is visible.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      toast(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)], 'info');
    }, QUOTE_INTERVAL);
    return () => window.clearInterval(id);
  }, []);

  // iPhone Safari has no Fullscreen API for pages; hide the button there.
  useEffect(() => {
    setCanFullscreen(Boolean(document.documentElement.requestFullscreen) && document.fullscreenEnabled);
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      document.documentElement.requestFullscreen().catch(() => toast('Fullscreen is not available here', 'warning'));
    }
  };

  const handleShare = async () => {
    const url = window.location.origin;
    const shareData = { title: 'Lo-Fi.Study', text: 'Focus with lo-fi music, a Pomodoro timer and ambient sounds.', url };
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled — fall through to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied — share Lo-Fi.Study with your friends! 🎵', 'success');
    } catch {
      toast(url, 'info');
    }
  };

  return (
    <>
      <header className={desktopStyles.topRightIcons}>
        <div className={desktopStyles.topBarGroup}>
          <button onClick={onToggleMusic} className={`${desktopStyles.topIcon} ${desktopStyles.showOnPhone}`} aria-label="Music player">
            <Music size={20} />
          </button>
          <Clock onClick={onOpenTimer} />
        </div>

        <div className={desktopStyles.topBarDivider} />

        <div className={desktopStyles.topBarGroup}>
          {!user ? (
            <button className={`${desktopStyles.topIcon} ${desktopStyles.signInPill}`} onClick={onAccountAction}>
              <LogIn size={18} />
              <span>Sign in</span>
            </button>
          ) : (
            <button
              className={`${desktopStyles.topIcon} ${desktopStyles.showOnPhone}`}
              onClick={onAccountAction}
              aria-label="Account"
            >
              <UserRound size={20} />
            </button>
          )}

          <button onClick={onToggleStats} className={desktopStyles.topIcon} title="Statistics" aria-label="Statistics">
            <BarChart3 size={20} />
          </button>

          <button onClick={() => setShowInfoModal(true)} className={desktopStyles.topIcon} title="About" aria-label="About Lo-Fi.Study">
            <Info size={20} />
          </button>

          <button
            onClick={() => setShowDiscordModal(true)}
            className={`${desktopStyles.topIcon} ${desktopStyles.hideOnPhone}`}
            title="Join Discord"
            aria-label="Join our Discord"
          >
            <FaDiscord size={20} />
          </button>
        </div>

        <div className={`${desktopStyles.topBarDivider} ${desktopStyles.hideOnPhone}`} />

        <div className={desktopStyles.topBarGroup}>
          <button onClick={handleShare} className={desktopStyles.topIcon} title="Share" aria-label="Share">
            <Share2 size={20} />
          </button>

          {canFullscreen && (
            <button
              onClick={handleFullscreen}
              className={`${desktopStyles.topIcon} ${desktopStyles.hideOnPhone}`}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Shrink size={20} /> : <Expand size={20} />}
            </button>
          )}
        </div>
      </header>

      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      <DiscordModal isOpen={showDiscordModal} onClose={() => setShowDiscordModal(false)} />
    </>
  );
}
