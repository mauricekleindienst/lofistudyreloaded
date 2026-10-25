"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import styles from '../../../styles/Tools.module.css';

interface Pattern {
  id: string;
  name: string;
  hint: string;
  /** seconds: inhale, hold, exhale, hold */
  steps: [number, number, number, number];
}

const PATTERNS: Pattern[] = [
  { id: 'box', name: 'Box', hint: 'Calm focus · 4-4-4-4', steps: [4, 4, 4, 4] },
  { id: 'relax', name: '4-7-8', hint: 'Wind down · 4-7-8', steps: [4, 7, 8, 0] },
  { id: 'coherent', name: 'Coherent', hint: 'Balance · 5.5-5.5', steps: [5.5, 0, 5.5, 0] },
  { id: 'energy', name: 'Energise', hint: 'Wake up · 2-0-2', steps: [2, 0, 2, 0] },
];

const LABELS = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];
const SESSION_OPTIONS = [1, 3, 5, 10];

export default function Breathing() {
  const [pattern, setPattern] = useState(PATTERNS[0]);
  const [minutes, setMinutes] = useState(3);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(0);
  const phaseEnds = useRef(0);

  // Drive phases from timestamps so a background tab doesn't drift.
  useEffect(() => {
    if (!running) return;
    let current = 0;
    const enter = (i: number, at: number) => {
      // Skip zero-length holds.
      while (pattern.steps[i] === 0) i = (i + 1) % 4;
      current = i;
      phaseEnds.current = at + pattern.steps[i] * 1000;
      setPhase(i);
      if (i === 0) setCycles((c) => c + 1);
      if (navigator.vibrate && window.matchMedia('(pointer: coarse)').matches) navigator.vibrate(30);
    };
    enter(0, Date.now());
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= phaseEnds.current) {
        // The session ends after an exhale, never mid-breath.
        if (t >= endsAt && (current === 2 || current === 3)) {
          setRunning(false);
          return;
        }
        enter((current + 1) % 4, phaseEnds.current);
      }
      setLeft(Math.max(0, Math.ceil((phaseEnds.current - t) / 1000)));
    }, 100);
    return () => window.clearInterval(id);
  }, [running, pattern, endsAt]);

  const start = () => {
    setCycles(0);
    setEndsAt(Date.now() + minutes * 60_000);
    setNow(Date.now());
    setRunning(true);
  };

  const stop = () => {
    setRunning(false);
    setPhase(0);
  };

  // Scale of the orb: grows while inhaling, stays while holding, shrinks while exhaling.
  const scale = !running ? 0.55 : phase === 0 || phase === 1 ? 1 : 0.55;
  const duration = running ? pattern.steps[phase] : 0.6;
  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));

  return (
    <div className={styles.app}>
      <div className={styles.chips} role="radiogroup" aria-label="Breathing pattern">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={pattern.id === p.id}
            className={`${styles.chip} ${pattern.id === p.id ? styles.chipOn : ''}`}
            onClick={() => {
              setPattern(p);
              if (running) stop();
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
      <p className={styles.muted}>{pattern.hint}</p>

      <div className={styles.breath}>
        <div className={styles.ring} aria-hidden />
        <div
          className={styles.orb}
          style={{ '--s': scale, transitionDuration: `${duration}s` } as React.CSSProperties}
          aria-hidden
        />
        <div className={styles.phase} aria-live="polite">
          {running ? (
            <>
              <strong>{LABELS[phase]}</strong>
              <span className={styles.mono}>{left}</span>
            </>
          ) : (
            <strong>{cycles > 0 ? 'Nicely done' : 'Ready'}</strong>
          )}
        </div>
      </div>

      <div className={styles.spread}>
        {running ? (
          <span className={`${styles.muted} ${styles.mono}`}>
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')} left · {cycles} breaths
          </span>
        ) : (
          <div className={styles.chips} role="radiogroup" aria-label="Session length">
            {SESSION_OPTIONS.map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={minutes === m}
                className={`${styles.chip} ${minutes === m ? styles.chipOn : ''}`}
                onClick={() => setMinutes(m)}
              >
                {m} min
              </button>
            ))}
          </div>
        )}
        <button className={`${styles.btn} ${running ? '' : styles.primary}`} onClick={running ? stop : start}>
          {running ? <Square size={14} /> : <Play size={14} />}
          {running ? 'Stop' : 'Start'}
        </button>
      </div>
    </div>
  );
}
