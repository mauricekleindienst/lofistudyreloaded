"use client";

import React, { useEffect, useState } from 'react';
import { Clock as ClockIcon, Timer } from 'lucide-react';
import { usePomodoro } from '../../contexts/PomodoroContext';
import desktopStyles from '../../../styles/Desktop.module.css';
import styles from '../../../styles/Clock.module.css';

interface ClockProps {
  onClick: () => void;
}

/** Wall clock that turns into the live Pomodoro countdown while a session runs. */
export default function Clock({ onClick }: ClockProps) {
  const pomo = usePomodoro();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 10_000);
    return () => window.clearInterval(id);
  }, []);

  const running = pomo.isRunning;
  const mm = String(Math.floor(pomo.timeLeft / 60)).padStart(2, '0');
  const ss = String(pomo.timeLeft % 60).padStart(2, '0');
  const label = running
    ? `${mm}:${ss}`
    : now?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '--:--';

  return (
    <button
      onClick={onClick}
      className={`${desktopStyles.topIcon} ${styles.clockButton} ${running ? styles.clockRunning : ''}`}
      aria-label={running ? `Focus timer: ${mm}:${ss} left` : 'Open focus timer'}
      title={running ? (pomo.mode === 'pomodoro' ? 'Focus session' : 'Break') : 'Focus timer'}
    >
      <span className={styles.clockContent}>
        {running ? <Timer size={16} /> : <ClockIcon size={16} />}
        <span className={styles.clockTime}>{label}</span>
      </span>
    </button>
  );
}
