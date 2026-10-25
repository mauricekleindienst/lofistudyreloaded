"use client";

import React, { useMemo, useState } from "react";
import { useResponsive } from '../../hooks/useResponsive';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  Timer,
  Coffee,
  Armchair,
  SkipForward,
  X
} from "lucide-react";
import styles from "../../../styles/PomodoroTimer.module.css";
import { usePomodoro, POMODORO_CATEGORIES, type PomodoroMode } from "../../contexts/PomodoroContext";

const clampMinutes = (value: string, fallback: number, max: number) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), max) : fallback;
};

export default function PomodoroTimer() {
  const pomo = usePomodoro();
  const { isMobile, isTablet } = useResponsive();
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState({ pomodoro: '25', shortBreak: '5', longBreak: '15' });

  const openSettings = () => {
    setDraft({
      pomodoro: String(pomo.durations.pomodoro / 60),
      shortBreak: String(pomo.durations.shortBreak / 60),
      longBreak: String(pomo.durations.longBreak / 60),
    });
    setShowSettings(true);
  };

  const saveSettings = () => {
    pomo.setDurations({
      pomodoro: clampMinutes(draft.pomodoro, 25, 180) * 60,
      shortBreak: clampMinutes(draft.shortBreak, 5, 60) * 60,
      longBreak: clampMinutes(draft.longBreak, 15, 120) * 60,
    });
    setShowSettings(false);
  };

  const formatTime = useMemo(() => {
    const minutes = Math.floor(pomo.timeLeft / 60);
    const seconds = pomo.timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [pomo.timeLeft]);

  const progress = useMemo(() => {
    const total = pomo.durations[pomo.mode];
    return total > 0 ? ((total - pomo.timeLeft) / total) * 100 : 0;
  }, [pomo.timeLeft, pomo.mode, pomo.durations]);

  const getModeInfo = (mode: PomodoroMode) => {
    // Slightly larger icon size for better visibility
    const iconSize = isMobile ? 10 : isTablet ? 12 : 14;
    
    switch (mode) {
      case "pomodoro":
        return { 
          label: isMobile ? "Focus" : "Focus Time", 
          icon: <Timer size={iconSize} />, 
          color: "var(--accent-color)" 
        };
      case "shortBreak":
        return { 
          label: isMobile ? "Break" : "Short Break", 
          icon: <Coffee size={iconSize} />, 
          color: "#10b981" 
        };
      case "longBreak":
        return { 
          label: isMobile ? "Long" : "Long Break", 
          icon: <Armchair size={iconSize} />, 
          color: "#3b82f6" 
        };
    }
  };
  return (
    <div className={styles.container}>
      {/* Timer Display */}
      <div className={styles.timerSection}>
        <div className={styles.progressRing}>
          {/* Mode Selector inside progress ring */}
          <div className={styles.modeSelector}>
            {(['pomodoro', 'shortBreak', 'longBreak'] as const).map((mode) => {
              const modeInfo = getModeInfo(mode);
              return (
                <button
                  key={mode}
                  className={`${styles.modeButton} ${
                    pomo.mode === mode ? styles.active : ''
                  }`}
                  onClick={() => pomo.setMode(mode)}
                  aria-pressed={pomo.mode === mode}
                  aria-label={getModeInfo(mode).label}
                  style={{
                    '--mode-color': modeInfo.color
                  } as React.CSSProperties}
                  title={modeInfo.label}
                >
                  {modeInfo.icon}
                </button>
              );
            })}
          </div>
          
          {/* Horizontal progress bar */}
          <div 
            className={styles.progressBar}
            style={{
              width: `${progress}%`,
              backgroundColor: getModeInfo(pomo.mode).color
            }}
          />
          <div className={styles.timerDisplay}>
            <div className={styles.timeText} role="timer" aria-live="off">{formatTime}</div>
            <div className={styles.modeLabel}>
              {getModeInfo(pomo.mode).label}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <button
            className={styles.resetButton}
            onClick={pomo.reset}
            disabled={!pomo.isRunning && pomo.timeLeft === pomo.durations[pomo.mode]}
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw size={isMobile ? 16 : 20} />
          </button>

          <button
            className={`${styles.playButton} ${pomo.isRunning ? styles.running : ''}`}
            onClick={pomo.toggle}
            title={pomo.isRunning ? 'Pause' : 'Start'}
            aria-label={pomo.isRunning ? 'Pause timer' : 'Start timer'}
          >
            {pomo.isRunning ? 
              <Pause size={isMobile ? 20 : 24} /> : 
              <Play size={isMobile ? 20 : 24} />
            }
          </button>

          <button
            className={styles.resetButton}
            onClick={pomo.skip}
            title={pomo.mode === 'pomodoro' ? 'Skip to break' : 'Skip to focus'}
            aria-label={pomo.mode === 'pomodoro' ? 'Skip to break' : 'Skip to focus'}
          >
            <SkipForward size={isMobile ? 16 : 20} />
          </button>

          <button
            className={styles.settingsButton}
            onClick={openSettings}
            title="Timer settings"
            aria-label="Timer settings"
          >
            <Settings size={isMobile ? 16 : 20} />
          </button>
        </div>
      </div>

      {/* Category Selection */}
      <div className={styles.categorySection}>
        <label className={styles.categoryLabel}>
          {isMobile ? "Type" : "Category"}
        </label>
        <div className={styles.categorySelector}>
          <select
            value={pomo.category}
            onChange={(e) => pomo.setCategory(e.target.value)}
            className={styles.categorySelect}
            aria-label="Session category"
          >
            {POMODORO_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Responsive Stats Display */}
      {!isMobile && (
        <div className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{pomo.todaySessions}</div>
              <div className={styles.statLabel}>Today</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>
                {Math.round(pomo.todayMinutes / 6) / 10}h
              </div>
              <div className={styles.statLabel}>Focused</div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-only compact stats */}
      {isMobile && (
        <div className={styles.mobileStats}>
          <span>{pomo.todaySessions} today</span>
          <span>•</span>
          <span>{Math.round(pomo.todayMinutes / 6) / 10}h focused</span>
        </div>
      )}


      {/* Settings Modal */}
      {showSettings && (
        <div className={styles.settingsOverlay}>
          <div className={styles.settingsModal}>            <div className={styles.settingsHeader}>
              <h3>Settings</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowSettings(false)}
                aria-label="Close settings"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.settingsContent}>              {/* Duration Settings */}
              <div className={styles.settingGroup}>
                <h4>Durations</h4>
                  <div className={styles.settingRow}>
                  <label htmlFor="pomo-pomodoro">Focus (min)</label>
                  <input
                    id="pomo-pomodoro"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="180"
                    value={draft.pomodoro}
                    onChange={(e) => setDraft(d => ({ ...d, pomodoro: e.target.value }))}
                    className={styles.settingInput}
                  />
                </div>

                <div className={styles.settingRow}>
                  <label htmlFor="pomo-shortBreak">Short (min)</label>
                  <input
                    id="pomo-shortBreak"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="60"
                    value={draft.shortBreak}
                    onChange={(e) => setDraft(d => ({ ...d, shortBreak: e.target.value }))}
                    className={styles.settingInput}
                  />
                </div>

                <div className={styles.settingRow}>
                  <label htmlFor="pomo-longBreak">Long (min)</label>
                  <input
                    id="pomo-longBreak"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="120"
                    value={draft.longBreak}
                    onChange={(e) => setDraft(d => ({ ...d, longBreak: e.target.value }))}
                    className={styles.settingInput}
                  />
                </div>
              </div>

              {/* Audio Settings */}
              <div className={styles.settingGroup}>
                <h4>Volume</h4>
                
                <div className={styles.settingRow}>
                  <div className={styles.volumeControl}>
                    <button
                      className={styles.volumeButton}
                      onClick={pomo.toggleMute}
                      aria-label={pomo.muted ? 'Unmute alerts' : 'Mute alerts'}
                    >
                      {pomo.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={pomo.muted ? 0 : pomo.volume}
                      onChange={(e) => pomo.setVolume(parseInt(e.target.value, 10))}
                      aria-label="Alert volume"
                      className={styles.volumeSlider}
                    />
                    <span className={styles.volumeValue}>
                      {pomo.muted ? 0 : pomo.volume}%
                    </span>
                  </div>
                </div>
              </div>
            </div>            <div className={styles.settingsFooter}>
              <button
                className={styles.saveSettingsButton}
                onClick={saveSettings}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
