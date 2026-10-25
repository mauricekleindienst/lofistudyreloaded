"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../lib/database';
import { useAuth } from './AuthContext';
import { useAppState } from './AppStateContext';
import { trackPomodoroSession } from '../components/Analytics';

export type PomodoroMode = 'pomodoro' | 'shortBreak' | 'longBreak';
export const POMODORO_CATEGORIES = ['Studying', 'Coding', 'Writing', 'Working', 'Other'] as const;

export interface Durations {
  pomodoro: number; // seconds
  shortBreak: number;
  longBreak: number;
}

const DEFAULT_DURATIONS: Durations = { pomodoro: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
const RUN_KEY = 'lofi:pomodoro:run';

interface PersistedRun {
  mode: PomodoroMode;
  /** epoch ms when the running phase ends; null when paused */
  endsAt: number | null;
  /** seconds left while paused */
  remaining: number;
  cycles: number;
  cyclesDate: string;
  category: string;
}

interface PomodoroContextValue {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  cycles: number;
  category: string;
  durations: Durations;
  volume: number;
  muted: boolean;
  todaySessions: number;
  todayMinutes: number;
  toggle: () => void;
  reset: () => void;
  setMode: (mode: PomodoroMode) => void;
  skip: () => void;
  setCategory: (category: string) => void;
  setDurations: (durations: Durations) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

const PomodoroContext = createContext<PomodoroContextValue | undefined>(undefined);

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const SOUNDS = {
  workStart: '/sounds/alert-work.mp3',
  shortBreak: '/sounds/alert-short-break.mp3',
  longBreak: '/sounds/alert-long-break.mp3',
};

/**
 * The timer lives here — not in the Pomodoro window — so it keeps running when
 * the window is closed, survives reloads, and stays accurate in background tabs
 * (it counts down to a timestamp instead of trusting setInterval ticks).
 */
export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { updatePomodoroState } = useAppState();

  const [durations, setDurationsState] = useState<Durations>(DEFAULT_DURATIONS);
  const [mode, setModeState] = useState<PomodoroMode>('pomodoro');
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(DEFAULT_DURATIONS.pomodoro);
  const [now, setNow] = useState(() => Date.now());
  const [cycles, setCycles] = useState(0);
  const [category, setCategoryState] = useState('Studying');
  const [volume, setVolumeState] = useState(60);
  const [muted, setMuted] = useState(false);
  const [todaySessions, setTodaySessions] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const hydrated = useRef(false);

  const isRunning = endsAt !== null;
  const timeLeft = isRunning ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : remaining;

  // --- hydrate settings + an in-progress run from storage ---
  useEffect(() => {
    const s = db.getLocalSettings();
    const d = s.pomodoroDurations ?? DEFAULT_DURATIONS;
    setDurationsState(d);
    if (typeof s.pomodoroVolume === 'number') setVolumeState(s.pomodoroVolume);
    if (typeof s.pomodoroMuted === 'boolean') setMuted(s.pomodoroMuted);
    setRemaining(d.pomodoro);

    try {
      const run = JSON.parse(localStorage.getItem(RUN_KEY) || 'null') as PersistedRun | null;
      if (run) {
        setModeState(run.mode);
        setCategoryState(run.category);
        setCycles(run.cyclesDate === today() ? run.cycles : 0);
        if (run.endsAt && run.endsAt > Date.now()) {
          setEndsAt(run.endsAt);
        } else if (!run.endsAt) {
          setRemaining(run.remaining);
        } else {
          // The phase finished while the page was closed; start fresh in the same mode.
          setRemaining(d[run.mode]);
        }
      }
    } catch {
      // ignore corrupt state
    }
    hydrated.current = true;
  }, []);

  // Signed-in users get their account's durations once their profile is loaded.
  useEffect(() => {
    const d = user?.settings?.pomodoroDurations as Durations | undefined;
    if (d && d.pomodoro && d.shortBreak && d.longBreak) {
      setDurationsState(d);
      setRemaining((r) => (endsAt === null && r === durations[mode] ? d[mode] : r));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Today's totals for the small stats row
  const loadToday = useCallback(async () => {
    const stats = await db.getPomodoroStats(today());
    setTodaySessions(stats.reduce((n, s) => n + s.pomodoro_count, 0));
    setTodayMinutes(stats.reduce((n, s) => n + s.total_focus_time_minutes, 0));
  }, []);
  useEffect(() => {
    loadToday();
  }, [loadToday, user?.id]);

  useEffect(() => {
    if (!hydrated.current) return;
    const run: PersistedRun = { mode, endsAt, remaining, cycles, cyclesDate: today(), category };
    try {
      localStorage.setItem(RUN_KEY, JSON.stringify(run));
    } catch {
      // ignore
    }
  }, [mode, endsAt, remaining, cycles, category]);

  // --- ticking ---
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [isRunning]);

  // --- sounds / notifications ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const play = useCallback(
    (src: string) => {
      if (muted || volume === 0) return;
      try {
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = src;
        audioRef.current.volume = volume / 100;
        audioRef.current.play().catch(() => undefined);
      } catch {
        // audio unavailable
      }
    },
    [muted, volume]
  );

  const notify = useCallback((title: string, body: string) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return; // the in-app chime is enough
    try {
      new Notification(title, { body, icon: '/icon-192.png', tag: 'lofi-pomodoro' });
    } catch {
      // Some mobile browsers only allow notifications from a service worker.
    }
  }, []);

  // --- phase completion ---
  const completingRef = useRef(false);
  useEffect(() => {
    if (!isRunning || timeLeft > 0 || completingRef.current) return;
    completingRef.current = true;

    if (mode === 'pomodoro') {
      const minutes = Math.round(durations.pomodoro / 60);
      const nextCycles = cycles + 1;
      setCycles(nextCycles);
      trackPomodoroSession(minutes, true);
      db.recordPomodoro(category, minutes).then((ok) => {
        if (ok) loadToday();
      });
      const longBreak = nextCycles % 4 === 0;
      const next: PomodoroMode = longBreak ? 'longBreak' : 'shortBreak';
      setModeState(next);
      setEndsAt(Date.now() + durations[next] * 1000);
      play(longBreak ? SOUNDS.longBreak : SOUNDS.shortBreak);
      notify(longBreak ? 'Great work! 🎉' : 'Nice work!', longBreak ? 'Time for a long break.' : 'Time for a short break.');
    } else {
      setModeState('pomodoro');
      setEndsAt(Date.now() + durations.pomodoro * 1000);
      play(SOUNDS.workStart);
      notify("Break's over", 'Time to focus again.');
    }
    setNow(Date.now());
    completingRef.current = false;
  }, [isRunning, timeLeft, mode, cycles, category, durations, play, notify, loadToday]);

  // --- mirror into app state (bottom bar badge) and the tab title ---
  useEffect(() => {
    updatePomodoroState({
      minutes: Math.floor(timeLeft / 60),
      seconds: timeLeft % 60,
      isRunning,
      mode: mode === 'pomodoro' ? 'work' : mode,
      cycles,
      category: category as 'Studying',
    });
  }, [timeLeft, isRunning, mode, cycles, category, updatePomodoroState]);

  useEffect(() => {
    const base = 'Lo-Fi.Study';
    if (isRunning) {
      const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
      const ss = String(timeLeft % 60).padStart(2, '0');
      document.title = `${mm}:${ss} · ${mode === 'pomodoro' ? 'Focus' : 'Break'} — ${base}`;
    } else {
      document.title = `${base} — Pomodoro Timer, Lo-Fi Music & Focus Space`;
    }
  }, [isRunning, timeLeft, mode]);

  // --- actions ---
  const toggle = useCallback(() => {
    if (isRunning) {
      setRemaining(timeLeft);
      setEndsAt(null);
      return;
    }
    // Ask once, at a moment the user clearly expects timer alerts.
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
    if (mode === 'pomodoro' && timeLeft === durations.pomodoro) play(SOUNDS.workStart);
    setNow(Date.now());
    setEndsAt(Date.now() + timeLeft * 1000);
  }, [isRunning, timeLeft, mode, durations, play]);

  const reset = useCallback(() => {
    setEndsAt(null);
    setRemaining(durations[mode]);
  }, [durations, mode]);

  const setMode = useCallback(
    (next: PomodoroMode) => {
      setEndsAt(null);
      setModeState(next);
      setRemaining(durations[next]);
    },
    [durations]
  );

  const skip = useCallback(() => {
    const next: PomodoroMode = mode === 'pomodoro' ? ((cycles + 1) % 4 === 0 ? 'longBreak' : 'shortBreak') : 'pomodoro';
    setEndsAt(null);
    setModeState(next);
    setRemaining(durations[next]);
  }, [mode, cycles, durations]);

  const setDurations = useCallback(
    (d: Durations) => {
      setDurationsState(d);
      if (!isRunning) setRemaining(d[mode]);
      db.saveSettings({ pomodoroDurations: d });
    },
    [isRunning, mode]
  );

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    setMuted(v === 0);
    db.saveSettings({ pomodoroVolume: v, pomodoroMuted: v === 0 });
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      db.saveSettings({ pomodoroMuted: !m });
      return !m;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      timeLeft,
      isRunning,
      cycles,
      category,
      durations,
      volume,
      muted,
      todaySessions,
      todayMinutes,
      toggle,
      reset,
      setMode,
      skip,
      setCategory: setCategoryState,
      setDurations,
      setVolume,
      toggleMute,
    }),
    [mode, timeLeft, isRunning, cycles, category, durations, volume, muted, todaySessions, todayMinutes, toggle, reset, setMode, skip, setDurations, setVolume, toggleMute]
  );

  return <PomodoroContext value={value}>{children}</PomodoroContext>;
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error('usePomodoro must be used within a PomodoroProvider');
  return ctx;
}
