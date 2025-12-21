"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clock as ClockIcon, Play, Pause, Square, Volume2 } from 'lucide-react';
import styles from '../../../styles/Clock.module.css';
import desktopStyles from '../../../styles/Desktop.module.css';

interface ClockProps {
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
}

interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  totalTime: number;
}

export default function Clock({ isExpanded, onToggle, onClose }: ClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timer, setTimer] = useState<TimerState>({
    minutes: 0,
    seconds: 0,
    isRunning: false,
    totalTime: 0
  });
  const [timerInput, setTimerInput] = useState({ minutes: 25, seconds: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for timer alerts
  useEffect(() => {
    audioRef.current = new Audio('/sounds/alert-work.mp3');
    audioRef.current.volume = 0.5;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleTimerComplete = useCallback(() => {
    // Play notification sound
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: 'Your timer has finished.',
        icon: '/favicon.ico'
      });
    }

    // Show visual alert
    alert('Timer Complete! 🎉');
  }, [soundEnabled]);

  // Timer countdown logic
  useEffect(() => {
    if (timer.isRunning && (timer.minutes > 0 || timer.seconds > 0)) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => {
          let newMinutes = prev.minutes;
          let newSeconds = prev.seconds - 1;

          if (newSeconds < 0) {
            newSeconds = 59;
            newMinutes -= 1;
          }

          // Timer finished
          if (newMinutes === 0 && newSeconds === 0) {
            handleTimerComplete();
            return {
              ...prev,
              minutes: 0,
              seconds: 0,
              isRunning: false
            };
          }

          return {
            ...prev,
            minutes: newMinutes,
            seconds: newSeconds
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timer.isRunning, timer.minutes, timer.seconds, handleTimerComplete]);

  const startTimer = () => {
    if (timerInput.minutes === 0 && timerInput.seconds === 0) return;
    
    setTimer({
      minutes: timerInput.minutes,
      seconds: timerInput.seconds,
      isRunning: true,
      totalTime: timerInput.minutes * 60 + timerInput.seconds
    });
  };

  const pauseTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: false }));
  };

  const resumeTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: true }));
  };

  const stopTimer = () => {
    setTimer({
      minutes: 0,
      seconds: 0,
      isRunning: false,
      totalTime: 0
    });
    setTimerInput({ minutes: 25, seconds: 0 });
  };

  const getTimerProgress = () => {
    if (timer.totalTime === 0) return 0;
    const elapsed = timer.totalTime - (timer.minutes * 60 + timer.seconds);
    return (elapsed / timer.totalTime) * 100;
  };

  if (!isExpanded) {
    return (
      <button onClick={onToggle} className={`${desktopStyles.topIcon} ${styles.clockButton}`}>
        <div className={styles.clockContent}>
          <ClockIcon size={16} />
          <span className={styles.clockTime}>
            {timer.isRunning ? (
              `${String(timer.minutes).padStart(2, '0')}:${String(timer.seconds).padStart(2, '0')}`
            ) : (
              currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
              })
            )}
          </span>
        </div>
        {timer.isRunning && <div className={styles.timerIndicator} />}
      </button>
    );
  }

  // Use createPortal to render the modal outside the TopBar DOM hierarchy
  return createPortal(
    <div className={styles.clockModal} onClick={onClose}>
      <div className={styles.clockContainer} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <ClockIcon size={20} />
            <h3 className={styles.title}>Timer</h3>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        {/* Timer Section */}
        <div className={styles.timerSection}>
          {/* Timer Display */}
          {(timer.minutes > 0 || timer.seconds > 0 || timer.isRunning) && (
            <div className={styles.timerDisplay}>
              <div className={styles.timerTime}>
                {String(timer.minutes).padStart(2, '0')}:
                {String(timer.seconds).padStart(2, '0')}
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${getTimerProgress()}%` }}
                />
              </div>
            </div>
          )}

          {/* Timer Input */}
          <div className={styles.timerInput}>
            <div className={styles.inputGroup}>
              <input
                type="number"
                min="0"
                max="59"
                value={timerInput.minutes}
                onChange={(e) => setTimerInput(prev => ({ 
                  ...prev, 
                  minutes: Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                }))}
                disabled={timer.isRunning}
                className={styles.numberInput}
                placeholder="Min"
              />
            </div>
            <div className={styles.inputGroup}>
              <input
                type="number"
                min="0"
                max="59"
                value={timerInput.seconds}
                onChange={(e) => setTimerInput(prev => ({ 
                  ...prev, 
                  seconds: Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
                }))}
                disabled={timer.isRunning}
                className={styles.numberInput}
                placeholder="Sec"
              />
            </div>
          </div>

          {/* Quick Timer Presets */}
          <div className={styles.presets}>
            <button 
              onClick={() => setTimerInput({ minutes: 5, seconds: 0 })}
              disabled={timer.isRunning}
              className={styles.presetButton}
            >
              5m
            </button>
            <button 
              onClick={() => setTimerInput({ minutes: 25, seconds: 0 })}
              disabled={timer.isRunning}
              className={styles.presetButton}
            >
              25m
            </button>
            <button 
              onClick={() => setTimerInput({ minutes: 45, seconds: 0 })}
              disabled={timer.isRunning}
              className={styles.presetButton}
            >
              45m
            </button>
          </div>

          {/* Timer Controls */}
          <div className={styles.timerControls}>
            {!timer.isRunning && (timer.minutes === 0 && timer.seconds === 0) && (
              <button onClick={startTimer} className={styles.startButton}>
                <Play size={14} />
                Start
              </button>
            )}
            
            {timer.isRunning && (
              <button onClick={pauseTimer} className={styles.pauseButton}>
                <Pause size={14} />
                Pause
              </button>
            )}
            
            {!timer.isRunning && (timer.minutes > 0 || timer.seconds > 0) && (
              <button onClick={resumeTimer} className={styles.resumeButton}>
                <Play size={14} />
                Resume
              </button>
            )}
            
            {(timer.minutes > 0 || timer.seconds > 0) && (
              <button onClick={stopTimer} className={styles.stopButton}>
                <Square size={14} />
                Stop
              </button>
            )}
          </div>

          {/* Settings */}
          <div className={styles.settings}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`${styles.settingButton} ${soundEnabled ? styles.active : ''}`}
            >
              <Volume2 size={14} />
              {soundEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
