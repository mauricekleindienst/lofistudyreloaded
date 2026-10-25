"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Flag, Plus, Minus } from 'lucide-react';
import styles from '../../../styles/Tools.module.css';

// Both clocks count from timestamps and are saved, so closing the window or
// reloading the page doesn't lose them.
const KEY = 'lofi:stopwatch';

interface Saved {
  tab: 'stopwatch' | 'timer';
  sw: { startedAt: number | null; elapsed: number; laps: number[] };
  timer: { endsAt: number | null; remaining: number; total: number };
}

const DEFAULT: Saved = {
  tab: 'stopwatch',
  sw: { startedAt: null, elapsed: 0, laps: [] },
  timer: { endsAt: null, remaining: 5 * 60_000, total: 5 * 60_000 },
};

const PRESETS = [1, 3, 5, 10, 15, 30, 45, 60];

function fmt(ms: number, centis = true) {
  const total = Math.max(0, ms);
  const h = Math.floor(total / 3_600_000);
  const m = Math.floor((total % 3_600_000) / 60_000);
  const s = Math.floor((total % 60_000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  const main = `${h ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return centis ? { main, cs: String(cs).padStart(2, '0') } : { main, cs: '' };
}

export default function Stopwatch() {
  const [state, setState] = useState<Saved>(DEFAULT);
  const [now, setNow] = useState(() => Date.now());
  const [ringing, setRinging] = useState(false);
  const hydrated = useRef(false);
  const alarm = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null') as Saved | null;
      if (saved?.sw && saved.timer) setState(saved);
    } catch {
      // ignore
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const swRunning = state.sw.startedAt !== null;
  const timerRunning = state.timer.endsAt !== null;

  useEffect(() => {
    if (!swRunning && !timerRunning) return;
    const id = window.setInterval(() => setNow(Date.now()), swRunning && state.tab === 'stopwatch' ? 31 : 250);
    return () => window.clearInterval(id);
  }, [swRunning, timerRunning, state.tab]);

  const swElapsed = state.sw.elapsed + (swRunning ? now - state.sw.startedAt! : 0);
  const timerLeft = timerRunning ? state.timer.endsAt! - now : state.timer.remaining;

  // Timer finished
  useEffect(() => {
    if (!timerRunning || timerLeft > 0) return;
    setState((s) => ({ ...s, timer: { ...s.timer, endsAt: null, remaining: 0 } }));
    setRinging(true);
    try {
      alarm.current ??= new Audio('/sounds/alert-long-break.mp3');
      alarm.current.currentTime = 0;
      alarm.current.play().catch(() => undefined);
    } catch {
      // audio unavailable
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
      try {
        new Notification('Timer done ⏰', { body: 'Your countdown has finished.', icon: '/icon-192.png', tag: 'lofi-timer' });
      } catch {
        // ignore
      }
    }
  }, [timerRunning, timerLeft]);

  useEffect(() => {
    if (!ringing) return;
    const id = window.setTimeout(() => setRinging(false), 8000);
    return () => window.clearTimeout(id);
  }, [ringing]);

  const setTab = (tab: Saved['tab']) => setState((s) => ({ ...s, tab }));

  // --- stopwatch ---
  const swToggle = () => {
    const t = Date.now();
    setNow(t);
    setState((s) =>
      s.sw.startedAt === null
        ? { ...s, sw: { ...s.sw, startedAt: t } }
        : { ...s, sw: { ...s.sw, startedAt: null, elapsed: s.sw.elapsed + t - s.sw.startedAt } }
    );
  };
  const swLap = () => setState((s) => ({ ...s, sw: { ...s.sw, laps: [...s.sw.laps, swElapsed].slice(-99) } }));
  const swReset = () => setState((s) => ({ ...s, sw: { startedAt: null, elapsed: 0, laps: [] } }));

  const lapDurations = state.sw.laps.map((t, i) => t - (state.sw.laps[i - 1] ?? 0));
  const best = lapDurations.length > 1 ? Math.min(...lapDurations) : -1;
  const worst = lapDurations.length > 1 ? Math.max(...lapDurations) : -1;

  // --- timer ---
  const setTimer = (ms: number) => {
    setRinging(false);
    setState((s) => ({ ...s, timer: { endsAt: null, remaining: ms, total: ms } }));
  };
  const timerToggle = () => {
    setRinging(false);
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(() => undefined);
    const t = Date.now();
    setNow(t);
    setState((s) => {
      if (s.timer.endsAt !== null) return { ...s, timer: { ...s.timer, endsAt: null, remaining: s.timer.endsAt - t } };
      const remaining = s.timer.remaining > 0 ? s.timer.remaining : s.timer.total;
      return { ...s, timer: { ...s.timer, endsAt: t + remaining, remaining } };
    });
  };
  const nudge = (deltaMin: number) =>
    setState((s) => {
      const delta = deltaMin * 60_000;
      if (s.timer.endsAt !== null) {
        const endsAt = Math.max(Date.now() + 1000, s.timer.endsAt + delta);
        return { ...s, timer: { ...s.timer, endsAt, total: Math.max(s.timer.total, endsAt - Date.now()) } };
      }
      const remaining = Math.min(24 * 3_600_000, Math.max(60_000, s.timer.remaining + delta));
      return { ...s, timer: { endsAt: null, remaining, total: remaining } };
    });

  const R = 92;
  const C = 2 * Math.PI * R;
  const pct = state.timer.total ? Math.max(0, timerLeft) / state.timer.total : 0;
  const sw = fmt(swElapsed);
  const tm = fmt(Math.ceil(Math.max(0, timerLeft) / 1000) * 1000, false);

  return (
    <div className={styles.app}>
      <div className={styles.tabs} role="tablist">
        <button role="tab" aria-selected={state.tab === 'stopwatch'} className={`${styles.tab} ${state.tab === 'stopwatch' ? styles.tabOn : ''}`} onClick={() => setTab('stopwatch')}>
          Stopwatch{swRunning && state.tab !== 'stopwatch' ? ' •' : ''}
        </button>
        <button role="tab" aria-selected={state.tab === 'timer'} className={`${styles.tab} ${state.tab === 'timer' ? styles.tabOn : ''}`} onClick={() => setTab('timer')}>
          Timer{timerRunning && state.tab !== 'timer' ? ` · ${fmt(timerLeft, false).main}` : ''}
        </button>
      </div>

      {state.tab === 'stopwatch' ? (
        <>
          <div className={styles.bigTime} role="timer">
            {sw.main}
            <small>.{sw.cs}</small>
          </div>
          <div className={styles.row} style={{ justifyContent: 'center' }}>
            <button className={styles.btn} onClick={swRunning ? swLap : swReset} disabled={!swRunning && swElapsed === 0}>
              {swRunning ? <Flag size={15} /> : <RotateCcw size={15} />}
              {swRunning ? 'Lap' : 'Reset'}
            </button>
            <button className={`${styles.btn} ${styles.primary}`} style={{ minWidth: 110 }} onClick={swToggle}>
              {swRunning ? <Pause size={15} /> : <Play size={15} />}
              {swRunning ? 'Pause' : swElapsed ? 'Resume' : 'Start'}
            </button>
          </div>
          {state.sw.laps.length > 0 && (
            <ol className={styles.laps}>
              {lapDurations
                .map((d, i) => ({ d, i, at: state.sw.laps[i] }))
                .reverse()
                .map(({ d, i, at }) => (
                  <li key={i} className={d === best ? styles.lapBest : d === worst ? styles.lapWorst : ''}>
                    <span>Lap {i + 1}</span>
                    <span className={styles.mono}>{fmt(d).main}.{fmt(d).cs}</span>
                    <span className={`${styles.mono} ${styles.muted}`}>{fmt(at).main}</span>
                  </li>
                ))}
            </ol>
          )}
        </>
      ) : (
        <>
          <div className={`${styles.timerRing} ${ringing ? styles.ringing : ''}`}>
            <svg viewBox="0 0 200 200" aria-hidden>
              <circle cx="100" cy="100" r={R} className={styles.track} />
              <circle cx="100" cy="100" r={R} className={styles.fill} strokeDasharray={C} strokeDashoffset={C * (1 - pct)} />
            </svg>
            <div className={styles.readout} role="timer" aria-live={ringing ? 'assertive' : 'off'}>
              {ringing ? "Time's up" : tm.main}
            </div>
          </div>
          <div className={styles.row} style={{ justifyContent: 'center' }}>
            <button className={styles.icon} onClick={() => nudge(-1)} aria-label="One minute less">
              <Minus size={16} />
            </button>
            <button className={styles.btn} onClick={() => setTimer(state.timer.total)} disabled={!timerRunning && timerLeft === state.timer.total}>
              <RotateCcw size={15} /> Reset
            </button>
            <button className={`${styles.btn} ${styles.primary}`} style={{ minWidth: 100 }} onClick={timerToggle}>
              {timerRunning ? <Pause size={15} /> : <Play size={15} />}
              {timerRunning ? 'Pause' : 'Start'}
            </button>
            <button className={styles.icon} onClick={() => nudge(1)} aria-label="One minute more">
              <Plus size={16} />
            </button>
          </div>
          <div className={styles.chips} style={{ justifyContent: 'center' }}>
            {PRESETS.map((m) => (
              <button
                key={m}
                className={`${styles.chip} ${!timerRunning && state.timer.total === m * 60_000 ? styles.chipOn : ''}`}
                onClick={() => setTimer(m * 60_000)}
              >
                {m < 60 ? `${m} min` : '1 h'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
