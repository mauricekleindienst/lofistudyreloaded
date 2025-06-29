"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import deepFocusStyles from '../../../styles/DeepFocusMode.module.css';

interface DeepFocusModeProps {
  isActive: boolean;
}

export default function DeepFocusMode({ isActive }: DeepFocusModeProps) {
  const { appStates, updatePomodoroState, updateFocusState } = useAppState();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [cycles, setCycles] = useState(0);

  // Initialize timer from app state
  useEffect(() => {
    if (appStates.pomodoro) {
      setTimeLeft(appStates.pomodoro.minutes * 60 + appStates.pomodoro.seconds);
      setIsRunning(appStates.pomodoro.isRunning);
      setMode(appStates.pomodoro.mode);
      setCycles(appStates.pomodoro.cycles);
    }
  }, [appStates.pomodoro]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    updatePomodoroState({ isRunning: false });
    
    if (mode === 'work') {
      const newCycles = cycles + 1;
      setCycles(newCycles);
      updatePomodoroState({ cycles: newCycles });
      
      // Determine next break type
      if (newCycles % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(15 * 60); // 15 minutes long break
        updatePomodoroState({ mode: 'longBreak', minutes: 15, seconds: 0 });
      } else {
        setMode('shortBreak');
        setTimeLeft(5 * 60); // 5 minutes short break
        updatePomodoroState({ mode: 'shortBreak', minutes: 5, seconds: 0 });
      }
    } else {
      // Break completed, return to work
      setMode('work');
      setTimeLeft(25 * 60); // 25 minutes work
      updatePomodoroState({ mode: 'work', minutes: 25, seconds: 0 });
    }
  }, [mode, cycles, updatePomodoroState]);

  // Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          
          // Update app state
          const minutes = Math.floor(newTime / 60);
          const seconds = newTime % 60;
          updatePomodoroState({ minutes, seconds });
          
          if (newTime === 0) {
            // Timer completed
            handleTimerComplete();
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, updatePomodoroState, handleTimerComplete]);

  const toggleTimer = () => {
    const newRunning = !isRunning;
    setIsRunning(newRunning);
    updatePomodoroState({ isRunning: newRunning });
  };

  const resetTimer = () => {
    setIsRunning(false);
    updatePomodoroState({ isRunning: false });
    
    if (mode === 'work') {
      setTimeLeft(25 * 60);
      updatePomodoroState({ minutes: 25, seconds: 0 });
    } else if (mode === 'shortBreak') {
      setTimeLeft(5 * 60);
      updatePomodoroState({ minutes: 5, seconds: 0 });
    } else {
      setTimeLeft(15 * 60);
      updatePomodoroState({ minutes: 15, seconds: 0 });
    }
  };

  const exitDeepFocus = () => {
    updateFocusState({ isDeepFocusMode: false });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeText = () => {
    switch (mode) {
      case 'work':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Focus Time';
    }
  };

  if (!isActive) return null;

  return (
    <div className={deepFocusStyles.deepFocusModal}>
      <div className={deepFocusStyles.modalOverlay} onClick={exitDeepFocus} />
      <div className={deepFocusStyles.modalContent}>
        {/* Close button */}
        <button 
          onClick={exitDeepFocus}
          className={deepFocusStyles.closeButton}
          aria-label="Exit Deep Focus Mode"
        >
          <X size={20} />
        </button>
        
        {/* Mode indicator */}
        <div className={deepFocusStyles.modeIndicator}>
          {getModeText()}
        </div>
        
        {/* Main timer display */}
        <div className={`${deepFocusStyles.timerDisplay} ${isRunning ? deepFocusStyles.running : ''}`}>
          {formatTime(timeLeft)}
        </div>
        
        {/* Cycle counter */}
        <div className={deepFocusStyles.cycleCounter}>
          Session {cycles + 1}
        </div>
        
        {/* Control buttons */}
        <div className={deepFocusStyles.controls}>
          <button
            onClick={toggleTimer}
            className={`${deepFocusStyles.controlButton} ${deepFocusStyles.playPause}`}
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <button
            onClick={resetTimer}
            className={`${deepFocusStyles.controlButton} ${deepFocusStyles.reset}`}
          >
            <RotateCcw size={20} />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className={deepFocusStyles.progressContainer}>
          <div 
            className={deepFocusStyles.progressBar}
            style={{
              width: `${((mode === 'work' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60) - timeLeft) / (mode === 'work' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60) * 100}%`
            }}
          />
        </div>
        
        {/* Motivational text */}
        <div className={deepFocusStyles.motivationalText}>
          {mode === 'work' ? 'Deep focus time - stay concentrated' : 'Relax and recharge your mind'}
        </div>
        
        {/* Exit instruction */}
        <div className={deepFocusStyles.exitInstruction}>
          Click outside or press the × to exit Deep Focus
        </div>
      </div>
    </div>
  );
}
