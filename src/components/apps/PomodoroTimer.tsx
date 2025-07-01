"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  useReducer,
  useMemo,
} from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useDataPersistence } from '../../hooks/useDataPersistence';
import { useAppState } from '../../contexts/AppStateContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Volume2, 
  VolumeX,
  Timer,
  Coffee,
  CheckCircle,
  X
} from "lucide-react";
import styles from "../../../styles/PomodoroTimer.module.css";

const categories = ["Studying", "Coding", "Writing", "Working", "Other"];

interface PomodoroState {
  currentMode: "pomodoro" | "shortBreak" | "longBreak";
  isTimerRunning: boolean;
  pomodoroCount: number;
  showSettings: boolean;
  category: string;
  pomodoroDurations: {
    pomodoro: number;
    shortBreak: number;
    longBreak: number;
  };
  timeLeft: number;
  volume: number;
  isMuted: boolean;
}

type PomodoroAction =
  | { type: "SET_MODE"; payload: PomodoroState["currentMode"]; autoStart?: boolean }
  | { type: "TOGGLE_TIMER" }
  | { type: "RESET_TIMER" }
  | { type: "TICK" }
  | { type: "INCREMENT_POMODORO" }
  | { type: "SET_POMODORO_COUNT"; payload: number }
  | { type: "TOGGLE_SETTINGS" }
  | { type: "SET_CATEGORY"; payload: string }
  | { type: "UPDATE_DURATIONS"; payload: Partial<PomodoroState["pomodoroDurations"]> }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "TOGGLE_MUTE" };

const initialState: PomodoroState = {
  currentMode: "pomodoro",
  isTimerRunning: false,
  pomodoroCount: 0,
  showSettings: false,
  category: "Other",
  pomodoroDurations: {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  },
  timeLeft: 25 * 60,
  volume: 50,
  isMuted: false,
};

function reducer(state: PomodoroState, action: PomodoroAction): PomodoroState {
  switch (action.type) {
    case "SET_MODE":
      return {
        ...state,
        currentMode: action.payload,
        timeLeft: state.pomodoroDurations[action.payload],
        // Set timer running state based on autoStart flag
        isTimerRunning: action.autoStart === true,
      };
    case "TOGGLE_TIMER":
      return { ...state, isTimerRunning: !state.isTimerRunning };
    case "RESET_TIMER":
      return {
        ...state,
        timeLeft: state.pomodoroDurations[state.currentMode],
        isTimerRunning: false,
      };
    case "TICK":
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };
    case "INCREMENT_POMODORO":
      return { ...state, pomodoroCount: state.pomodoroCount + 1 };
    case "SET_POMODORO_COUNT":
      return { ...state, pomodoroCount: action.payload };
    case "TOGGLE_SETTINGS":
      return { ...state, showSettings: !state.showSettings };
    case "SET_CATEGORY":
      return { ...state, category: action.payload };
    case "UPDATE_DURATIONS":
      return {
        ...state,
        pomodoroDurations: { ...state.pomodoroDurations, ...action.payload },
      };
    case "SET_VOLUME":
      return { ...state, volume: action.payload, isMuted: action.payload === 0 };
    case "TOGGLE_MUTE":
      return { ...state, isMuted: !state.isMuted };
    default:
      return state;
  }
}

export default function PomodoroTimer() {  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();
  const { 
    isAuthenticated, 
    savePomodoroSession, 
    loadPomodoroSessions,
    updatePomodoroStats 
  } = useDataPersistence();
  const { updatePomodoroState } = useAppState();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const completionHandledRef = useRef<boolean>(false);
  
  // Sound refs at the top level
  const pomodoroStartRef = useRef<HTMLAudioElement | null>(null);
  const pomodoroEndRef = useRef<HTMLAudioElement | null>(null);
  const longPauseRef = useRef<HTMLAudioElement | null>(null);
    const soundRefs = useMemo(() => ({
    pomodoroStart: pomodoroStartRef,
    pomodoroEnd: pomodoroEndRef,
    longPause: longPauseRef,
  }), []);

  // Load sounds on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      soundRefs.pomodoroStart.current = new Audio("/sounds/alert-work.mp3");
      soundRefs.pomodoroEnd.current = new Audio("/sounds/alert-short-break.mp3");
      soundRefs.longPause.current = new Audio("/sounds/alert-long-break.mp3");
      
      // Set volume for all sounds
      Object.values(soundRefs).forEach(ref => {
        if (ref.current) {
          ref.current.volume = state.isMuted ? 0 : state.volume / 100;
        }
      });
    }
  }, [soundRefs, state.isMuted, state.volume]);

  // Update sound volumes when volume or mute state changes
  useEffect(() => {
    Object.values(soundRefs).forEach(ref => {
      if (ref.current) {
        ref.current.volume = state.isMuted ? 0 : state.volume / 100;
      }
    });
  }, [soundRefs, state.volume, state.isMuted]);

  const playSound = useCallback((soundRef: React.RefObject<HTMLAudioElement | null>) => {
    if (soundRef.current && !state.isMuted) {
      soundRef.current.currentTime = 0;
      soundRef.current
        .play()
        .catch((error) => console.error("Error playing sound:", error));
    }
  }, [state.isMuted]);

  const requestNotificationPermission = useCallback(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = useCallback((title: string, message: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { 
        body: message,
        icon: "/favicon.ico"
      });
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Load user's pomodoro history to get current count
  useEffect(() => {
    const loadPomodoroCount = async () => {
      if (isAuthenticated && user?.email) {
        try {
          const sessions = await loadPomodoroSessions();
          // Count completed pomodoro sessions for today
          const today = new Date().toISOString().split('T')[0];
          const todaySessions = sessions.filter(session => 
            session.completed && 
            session.type === 'work' &&
            session.completed_at?.startsWith(today)
          );
          
          // Update local count to match database
          if (todaySessions.length > 0) {
            // Set the count to match database without dispatching INCREMENT for each
            // This is a direct state update to sync with database
            dispatch({ type: "SET_POMODORO_COUNT", payload: todaySessions.length });
          }
        } catch (error) {
          console.error("Failed to load pomodoro count:", error);
        }
      }
    };

    loadPomodoroCount();
  }, [isAuthenticated, user?.email, loadPomodoroSessions]);

  // Timer effect - handle completion within the tick
  useEffect(() => {
    if (state.isTimerRunning && state.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        dispatch({ type: "TICK" });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isTimerRunning, state.timeLeft]);

  const handleCompletion = useCallback(async () => {
    let sessionType: 'work' | 'short_break' | 'long_break' = 'work';
    switch (state.currentMode) {
      case "pomodoro":
        sessionType = "work";
        break;
      case "shortBreak":
        sessionType = "short_break";
        break;
      case "longBreak":
        sessionType = "long_break";
        break;
    }

    // Save completed pomodoro session to database
    if (state.currentMode === 'pomodoro' && isAuthenticated && user?.email) {
      const sessionData = {
        user_id: user.id,
        email: user.email,
        duration: state.pomodoroDurations.pomodoro,
        type: sessionType,
        completed: true,
        category: state.category,
        completed_at: new Date().toISOString(),
      };
  
      await savePomodoroSession(sessionData);
  
      const statsUpdate = {
        date: new Date().toISOString().split('T')[0],
        sessions_completed: 1, // Will be incremented
        total_focus_time: Math.round(state.pomodoroDurations.pomodoro / 60), // in minutes
        category: state.category,
        email: user.email,
        user_id: user.id,
      };
      
      await updatePomodoroStats(statsUpdate);
      dispatch({ type: 'INCREMENT_POMODORO' });
    }

    // Determine next mode based on current mode and pomodoro count
    let nextMode: PomodoroState["currentMode"];
    let shouldAutoStart = false;
    
    if (state.currentMode === "pomodoro") {
      // After completing a pomodoro, decide on break type
      const newPomodoroCount = state.pomodoroCount + (isAuthenticated ? 0 : 1); // Count was already incremented above for authenticated users
      nextMode = (newPomodoroCount % 4 === 0) ? "longBreak" : "shortBreak";
      shouldAutoStart = true; // Auto-start breaks
    } else {
      // After completing a break, go back to pomodoro
      nextMode = "pomodoro";
      shouldAutoStart = false; // Don't auto-start work sessions
    }

    // Switch to next mode
    dispatch({ type: "SET_MODE", payload: nextMode, autoStart: shouldAutoStart });

    // Play appropriate sound and show notification
    let soundToPlay = null;
    let notificationTitle = "Time's up!";
    let notificationMessage = "";

    if (nextMode === 'pomodoro') {
      soundToPlay = soundRefs.pomodoroStart;
      notificationTitle = "Break's Over!";
      notificationMessage = "Time to get back to focus.";
    } else if (nextMode === 'shortBreak') {
      soundToPlay = soundRefs.pomodoroEnd;
      notificationTitle = "Nice work!";
      notificationMessage = "Time for a short break.";
    } else if (nextMode === 'longBreak') {
      soundToPlay = soundRefs.longPause;
      notificationTitle = "Great session!";
      notificationMessage = "Time for a long break.";
    }

    if (soundToPlay) playSound(soundToPlay);
    showNotification(notificationTitle, notificationMessage);
  }, [
    state.currentMode,
    state.pomodoroCount,
    state.pomodoroDurations,
    state.category,
    user,
    isAuthenticated,
    savePomodoroSession,
    updatePomodoroStats,
    playSound,
    showNotification,
    soundRefs,
  ]);
  
  // Timer completion handler - when timer hits 0, switch modes and auto-start
  useEffect(() => {
    if (state.timeLeft === 0 && state.isTimerRunning && !completionHandledRef.current) {
      completionHandledRef.current = true;
      handleCompletion();
    }
    
    // Reset the completion flag when timer is reset or mode changes
    if (state.timeLeft > 0) {
      completionHandledRef.current = false;
    }
  }, [state.timeLeft, state.isTimerRunning, handleCompletion]);
  
  // Update document title
  useEffect(() => {
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    };

    if (state.isTimerRunning) {
      document.title = `${formatTime(state.timeLeft)} - ${
        state.currentMode === "pomodoro" ? "Focus" : "Break"
      }`;
    } else {
      document.title = "Pomodoro Timer";
    }    // Dispatch timer update event for other components
    const event = new CustomEvent('pomodoroUpdate', {
      detail: {
        count: state.pomodoroCount,
        isRunning: state.isTimerRunning,
        timeLeft: state.timeLeft,
        mode: state.currentMode
      }
    });
    window.dispatchEvent(event);
  }, [state.timeLeft, state.currentMode, state.isTimerRunning, state.pomodoroCount]);

  // Update app state context for bottom bar display
  useEffect(() => {
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    
    updatePomodoroState({
      minutes,
      seconds,
      isRunning: state.isTimerRunning,
      mode: state.currentMode === 'pomodoro' ? 'work' : 
            state.currentMode === 'shortBreak' ? 'shortBreak' : 'longBreak',
      cycles: state.pomodoroCount,
      category: state.category as 'Studying' | 'Coding' | 'Writing' | 'Working' | 'Other'
    });
  }, [state.timeLeft, state.isTimerRunning, state.currentMode, state.pomodoroCount, state.category, updatePomodoroState]);
  
  const toggleTimer = useCallback(() => {
    dispatch({ type: "TOGGLE_TIMER" });
    if (!state.isTimerRunning && state.currentMode === "pomodoro") {
      playSound(soundRefs.pomodoroStart);
      showNotification(
        "Focus Session Started",
        "Stay focused for the next session! 🚀"
      );
    }
  }, [
    state.isTimerRunning,
    state.currentMode,
    playSound,
    showNotification,
    soundRefs,
  ]);

  const resetTimer = useCallback(() => {
    dispatch({ type: "RESET_TIMER" });
  }, []);

  const changeMode = useCallback((mode: PomodoroState["currentMode"]) => {
    dispatch({ type: "SET_MODE", payload: mode, autoStart: false });
  }, []);

  const formatTime = useMemo(() => {
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }, [state.timeLeft]);

  const progress = useMemo(() => {
    const total = state.pomodoroDurations[state.currentMode];
    return ((total - state.timeLeft) / total) * 100;
  }, [state.timeLeft, state.currentMode, state.pomodoroDurations]);

  const formatFocusTime = useMemo(() => {
    const totalMinutes = Math.floor((state.pomodoroCount * state.pomodoroDurations.pomodoro) / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }, [state.pomodoroCount, state.pomodoroDurations.pomodoro]);

  const handleSettingsChange = useCallback((setting: string, value: number) => {
    dispatch({
      type: "UPDATE_DURATIONS",
      payload: { [setting]: value * 60 },
    });
  }, []);

  const getModeInfo = (mode: PomodoroState["currentMode"]) => {
    switch (mode) {
      case "pomodoro":
        return { 
          label: "Focus", 
          icon: <Timer size={16} />, 
          color: "var(--accent-color)" 
        };
      case "shortBreak":
        return { 
          label: "Break", 
          icon: <Coffee size={16} />, 
          color: "#10b981" 
        };
      case "longBreak":
        return { 
          label: "Long", 
          icon: <Coffee size={16} />, 
          color: "#3b82f6" 
        };
    }
  };
  return (
    <div className={styles.container}>
      {/* Mode Selector */}
      <div className={styles.modeSelector}>
        {(['pomodoro', 'shortBreak', 'longBreak'] as const).map((mode) => {
          const modeInfo = getModeInfo(mode);
          return (
            <button
              key={mode}
              className={`${styles.modeButton} ${
                state.currentMode === mode ? styles.active : ''
              }`}
              onClick={() => changeMode(mode)}
              disabled={state.isTimerRunning}
              style={{
                '--mode-color': modeInfo.color
              } as React.CSSProperties}
            >
              {modeInfo.icon}
              <span>{modeInfo.label}</span>
            </button>
          );
        })}
      </div>

      {/* Timer Display */}
      <div className={styles.timerSection}>
        <div className={styles.progressRing}>
          <svg className={styles.progressSvg} viewBox="0 0 120 120">
            <circle
              className={styles.progressTrack}
              cx="60"
              cy="60"
              r="50"
              fill="none"
              strokeWidth="8"
            />
            <circle
              className={styles.progressFill}
              cx="60"
              cy="60"
              r="50"
              fill="none"
              strokeWidth="8"
              strokeDasharray={339.292}
              strokeDashoffset={339.292 - (progress * 339.292) / 100}
              style={{
                stroke: getModeInfo(state.currentMode).color
              }}
            />
          </svg>
          <div className={styles.timerDisplay}>
            <div className={styles.timeText}>{formatTime}</div>
            <div className={styles.modeLabel}>
              {getModeInfo(state.currentMode).label}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <button
            className={styles.resetButton}
            onClick={resetTimer}
            disabled={state.timeLeft === state.pomodoroDurations[state.currentMode]}
            title="Reset Timer"
          >
            <RotateCcw size={20} />
          </button>

          <button
            className={`${styles.playButton} ${state.isTimerRunning ? styles.running : ''}`}
            onClick={toggleTimer}
            title={state.isTimerRunning ? 'Pause' : 'Start'}
          >
            {state.isTimerRunning ? <Pause size={24} /> : <Play size={24} />}
          </button>

          <button
            className={styles.settingsButton}
            onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Category Selection */}
      <div className={styles.categorySection}>
        <label className={styles.categoryLabel}>
          Category
        </label>
        <div className={styles.categorySelector}>
          <select
            value={state.category}
            onChange={(e) => dispatch({ type: "SET_CATEGORY", payload: e.target.value })}
            className={styles.categorySelect}
            disabled={state.isTimerRunning}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className={styles.statsSection}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <CheckCircle size={20} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{state.pomodoroCount}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Timer size={20} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {formatFocusTime}
            </div>
            <div className={styles.statLabel}>Focus</div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {state.showSettings && (
        <div className={styles.settingsOverlay}>
          <div className={styles.settingsModal}>            <div className={styles.settingsHeader}>
              <h3>Settings</h3>
              <button
                className={styles.closeButton}
                onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.settingsContent}>              {/* Duration Settings */}
              <div className={styles.settingGroup}>
                <h4>Durations</h4>
                  <div className={styles.settingRow}>
                  <label>Focus</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={state.pomodoroDurations.pomodoro / 60}
                    onChange={(e) => handleSettingsChange("pomodoro", parseInt(e.target.value) || 25)}
                    className={styles.settingInput}
                  />
                </div>

                <div className={styles.settingRow}>
                  <label>Short</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={state.pomodoroDurations.shortBreak / 60}
                    onChange={(e) => handleSettingsChange("shortBreak", parseInt(e.target.value) || 5)}
                    className={styles.settingInput}
                  />
                </div>

                <div className={styles.settingRow}>
                  <label>Long</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={state.pomodoroDurations.longBreak / 60}
                    onChange={(e) => handleSettingsChange("longBreak", parseInt(e.target.value) || 15)}
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
                      onClick={() => dispatch({ type: "TOGGLE_MUTE" })}
                    >
                      {state.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={state.isMuted ? 0 : state.volume}
                      onChange={(e) => dispatch({ type: "SET_VOLUME", payload: parseInt(e.target.value) })}
                      className={styles.volumeSlider}
                    />
                    <span className={styles.volumeValue}>
                      {state.isMuted ? 0 : state.volume}%
                    </span>
                  </div>
                </div>
              </div>
            </div>            <div className={styles.settingsFooter}>
              <button
                className={styles.saveSettingsButton}
                onClick={() => {
                  dispatch({ type: "TOGGLE_SETTINGS" });
                  resetTimer();
                }}
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
