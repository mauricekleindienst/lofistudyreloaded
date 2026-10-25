"use client";

import React, { useState } from "react";
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, SkipForward, X, Brain, Coffee, Armchair, Target, Music } from "lucide-react";
import { useMusic } from "../../contexts/MusicContext";
import styles from "../../../styles/PomodoroTimer.module.css";
import { usePomodoro, POMODORO_CATEGORIES, type PomodoroMode } from "../../contexts/PomodoroContext";

const MODES: { id: PomodoroMode; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'pomodoro', label: 'Focus', icon: Brain, color: '#ff7b00' },
  { id: 'shortBreak', label: 'Short break', icon: Coffee, color: '#10b981' },
  { id: 'longBreak', label: 'Long break', icon: Armchair, color: '#3b82f6' },
];

const RING_R = 88;
const RING_C = 2 * Math.PI * RING_R;

const clampMinutes = (value: string, fallback: number, max: number) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), max) : fallback;
};

export default function PomodoroTimer() {
  const pomo = usePomodoro();
  const [showSettings, setShowSettings] = useState(false);
  const music = useMusic();
  const [draft, setDraft] = useState({ pomodoro: '25', shortBreak: '5', longBreak: '15', longEvery: '4', goal: '8', autoBreaks: true, autoFocus: false });

  const mode = MODES.find((m) => m.id === pomo.mode)!;
  const total = pomo.durations[pomo.mode];
  const progress = total > 0 ? (total - pomo.timeLeft) / total : 0;
  const mm = String(Math.floor(pomo.timeLeft / 60)).padStart(2, '0');
  const ss = String(pomo.timeLeft % 60).padStart(2, '0');
  const every = pomo.options.longEvery;
  const untilLong = every - (pomo.cycles % every);
  const goalPct = Math.min(1, pomo.todaySessions / pomo.options.goal);

  const openSettings = () => {
    setDraft({
      pomodoro: String(pomo.durations.pomodoro / 60),
      shortBreak: String(pomo.durations.shortBreak / 60),
      longBreak: String(pomo.durations.longBreak / 60),
      longEvery: String(pomo.options.longEvery),
      goal: String(pomo.options.goal),
      autoBreaks: pomo.options.autoBreaks,
      autoFocus: pomo.options.autoFocus,
    });
    setShowSettings(true);
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    pomo.setDurations({
      pomodoro: clampMinutes(draft.pomodoro, 25, 180) * 60,
      shortBreak: clampMinutes(draft.shortBreak, 5, 60) * 60,
      longBreak: clampMinutes(draft.longBreak, 15, 120) * 60,
    });
    pomo.setOptions({
      longEvery: Math.max(2, clampMinutes(draft.longEvery, 4, 8)),
      goal: clampMinutes(draft.goal, 8, 24),
      autoBreaks: draft.autoBreaks,
      autoFocus: draft.autoFocus,
    });
    setShowSettings(false);
  };

  return (
    <div className={styles.timer} style={{ '--mode': mode.color } as React.CSSProperties}>
      <div className={styles.modes} role="tablist" aria-label="Timer mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={pomo.mode === m.id}
            className={`${styles.mode} ${pomo.mode === m.id ? styles.modeActive : ''}`}
            style={{ '--mode': m.color } as React.CSSProperties}
            onClick={() => pomo.setMode(m.id)}
          >
            <m.icon size={14} />
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.dial}>
        <svg viewBox="0 0 200 200" className={styles.ring} aria-hidden>
          <circle cx="100" cy="100" r={RING_R} className={styles.ringTrack} />
          <circle
            cx="100"
            cy="100"
            r={RING_R}
            className={styles.ringFill}
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - progress)}
          />
        </svg>
        <div className={styles.readout}>
          <div className={styles.time} role="timer" aria-label={`${mm} minutes ${ss} seconds left`}>
            {mm}:{ss}
          </div>
          <div className={styles.modeLabel}>{pomo.isRunning ? mode.label : 'Paused'}</div>
          <div className={styles.dots} aria-label={`${untilLong} until long break`}>
            {Array.from({ length: every }, (_, i) => (
              <span key={i} className={i < pomo.cycles % every ? styles.dotDone : styles.dot} />
            ))}
          </div>
        </div>
      </div>

      {pomo.task && (
        <div className={styles.task}>
          <Target size={14} aria-hidden />
          <span className={styles.taskText} title={pomo.task.text}>
            {pomo.task.text}
          </span>
          <button type="button" onClick={() => pomo.setTask(null)} aria-label="Stop focusing on this task">
            <X size={14} />
          </button>
        </div>
      )}

      <div className={styles.controls}>
        <button
          className={styles.secondary}
          onClick={pomo.reset}
          disabled={!pomo.isRunning && pomo.timeLeft === total}
          aria-label="Reset timer"
          title="Reset"
        >
          <RotateCcw size={18} />
        </button>
        <button className={styles.primary} onClick={pomo.toggle} aria-label={pomo.isRunning ? 'Pause timer' : 'Start timer'}>
          {pomo.isRunning ? <Pause size={26} /> : <Play size={26} className={styles.playIcon} />}
        </button>
        <button
          className={styles.secondary}
          onClick={pomo.skip}
          aria-label={pomo.mode === 'pomodoro' ? 'Skip to break' : 'Skip to focus'}
          title="Skip"
        >
          <SkipForward size={18} />
        </button>
      </div>

      <div className={styles.footer}>
        <label className={styles.category}>
          <span className={styles.srOnly}>Session category</span>
          <select value={pomo.category} onChange={(e) => pomo.setCategory(e.target.value)}>
            {POMODORO_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div
          className={styles.today}
          title={`${pomo.todaySessions} of ${pomo.options.goal} focus sessions today · ${Math.round(pomo.todayMinutes / 6) / 10}h`}
        >
          <span className={styles.goal} style={{ '--goal': `${goalPct * 360}deg` } as React.CSSProperties} aria-hidden />
          <strong>{pomo.todaySessions}</strong>/{pomo.options.goal} today
        </div>
        <button className={styles.secondary} onClick={openSettings} aria-label="Timer settings" title="Settings">
          <Settings size={16} />
        </button>
      </div>

      {showSettings && (
        <div className={styles.settingsOverlay} onClick={() => setShowSettings(false)}>
          <form className={styles.settings} onSubmit={saveSettings} onClick={(e) => e.stopPropagation()}>
            <div className={styles.settingsHeader}>
              <h3>Timer settings</h3>
              <button type="button" className={styles.secondary} onClick={() => setShowSettings(false)} aria-label="Close settings">
                <X size={16} />
              </button>
            </div>
            <div className={styles.fields}>
              {([
                ['pomodoro', 'Focus', 180],
                ['shortBreak', 'Short break', 60],
                ['longBreak', 'Long break', 120],
              ] as const).map(([key, label, max]) => (
                <label key={key} className={styles.field}>
                  <span>{label}</span>
                  <span className={styles.inputWrap}>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={max}
                      value={draft[key]}
                      onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    />
                    <em>min</em>
                  </span>
                </label>
              ))}
            </div>
            <div className={styles.fields}>
              <label className={styles.field}>
                <span>Long break every</span>
                <span className={styles.inputWrap}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={2}
                    max={8}
                    value={draft.longEvery}
                    onChange={(e) => setDraft((d) => ({ ...d, longEvery: e.target.value }))}
                  />
                  <em>×</em>
                </span>
              </label>
              <label className={styles.field}>
                <span>Daily goal</span>
                <span className={styles.inputWrap}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={24}
                    value={draft.goal}
                    onChange={(e) => setDraft((d) => ({ ...d, goal: e.target.value }))}
                  />
                  <em>🍅</em>
                </span>
              </label>
            </div>
            <div className={styles.switches}>
              <label className={styles.switchRow}>
                <span>Start breaks automatically</span>
                <input type="checkbox" role="switch" checked={draft.autoBreaks} onChange={(e) => setDraft((d) => ({ ...d, autoBreaks: e.target.checked }))} />
              </label>
              <label className={styles.switchRow}>
                <span>Start focus automatically after a break</span>
                <input type="checkbox" role="switch" checked={draft.autoFocus} onChange={(e) => setDraft((d) => ({ ...d, autoFocus: e.target.checked }))} />
              </label>
              <label className={styles.switchRow}>
                <span>
                  <Music size={13} aria-hidden /> Play music during focus, pause on breaks
                </span>
                <input type="checkbox" role="switch" checked={music.focusSync} onChange={(e) => music.setFocusSync(e.target.checked)} />
              </label>
            </div>
            <div className={styles.volume}>
              <button type="button" className={styles.secondary} onClick={pomo.toggleMute} aria-label={pomo.muted ? 'Unmute alerts' : 'Mute alerts'}>
                {pomo.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={pomo.muted ? 0 : pomo.volume}
                onChange={(e) => pomo.setVolume(parseInt(e.target.value, 10))}
                aria-label="Alert volume"
              />
              <span>{pomo.muted ? 0 : pomo.volume}%</span>
            </div>
            <button type="submit" className={styles.save}>
              Save
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
