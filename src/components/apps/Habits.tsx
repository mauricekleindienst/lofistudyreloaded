"use client";

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Check, Flame, Loader2, X } from 'lucide-react';
import styles from '../../../styles/Tools.module.css';
import { useDataPersistence } from '../../hooks/useDataPersistence';
import { localDate } from '../../lib/api';
import type { Habit } from '../../lib/database';

const EMOJIS = ['📚', '💧', '🏃', '🧘', '😴', '🥗', '✍️', '🎸', '🧠', '🌿', '🚭', '💊'];
const COLORS = ['#ff7b00', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#eab308', '#06b6d4'];

const dayKey = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return localDate(d);
};

/** Consecutive days up to today (or yesterday, so an unticked today doesn't break it). */
function streak(days: string[]): number {
  const set = new Set(days);
  let start = set.has(dayKey(0)) ? 0 : 1;
  let n = 0;
  while (set.has(dayKey(start++))) n++;
  return n;
}

/** Monday-based current week */
function thisWeek(): { key: string; label: string; future: boolean; today: boolean }[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const todayKey = localDate(now);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = localDate(d);
    return { key, label: d.toLocaleDateString([], { weekday: 'narrow' }), future: key > todayKey, today: key === todayKey };
  });
}

export default function Habits() {
  const { db, isAuthenticated, authLoading } = useDataPersistence();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [target, setTarget] = useState(7);
  // Re-render once a minute so "today" moves on at midnight.
  const [, setMinute] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setMinute((m) => m + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const week = thisWeek();
  const today = localDate();

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    db.getHabits().then((items) => {
      if (cancelled) return;
      setHabits(items);
      setLoading(false);
      if (items.length === 0) setAdding(true);
    });
    return () => {
      cancelled = true;
    };
  }, [db, isAuthenticated, authLoading]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const habit = await db.saveHabit({ name: name.trim(), emoji, target, color: COLORS[habits.length % COLORS.length], days: [] });
    if (habit) {
      setHabits((prev) => [...prev, habit]);
      setName('');
      setAdding(false);
    }
  };

  const toggleDay = async (habit: Habit, key: string) => {
    const on = !habit.days.includes(key);
    const flip = (days: string[], value: boolean) => (value ? [...new Set([...days, key])].sort() : days.filter((d) => d !== key));
    const days = flip(habit.days, on);
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, days: flip(h.days, on) } : h)));
    // On failure undo just this day, not other days ticked meanwhile.
    if (!(await db.updateHabit(habit.id, { days }))) {
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, days: flip(h.days, !on) } : h)));
    }
  };

  const remove = async (habit: Habit) => {
    if (!confirm(`Delete the habit “${habit.name}” and its history?`)) return;
    if (await db.deleteHabit(habit.id)) setHabits((prev) => prev.filter((h) => h.id !== habit.id));
  };

  const doneToday = habits.filter((h) => h.days.includes(today)).length;

  return (
    <div className={styles.app}>
      <div className={styles.spread}>
        <div>
          <h2 className={styles.h2}>Habits</h2>
          <p className={styles.muted}>
            {habits.length ? `${doneToday} of ${habits.length} done today` : 'Small daily wins add up'}
          </p>
        </div>
        {!adding && (
          <button className={`${styles.btn} ${styles.primary}`} onClick={() => setAdding(true)}>
            <Plus size={15} /> New
          </button>
        )}
      </div>

      {habits.length > 0 && (
        <div className={styles.bar} aria-label={`${doneToday} of ${habits.length} habits done today`}>
          <div className={styles.barFill} style={{ width: `${(doneToday / habits.length) * 100}%`, background: '#10b981' }} />
        </div>
      )}

      {adding && (
        <form className={styles.card} onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className={styles.spread}>
            <strong style={{ fontSize: 14 }}>New habit</strong>
            {habits.length > 0 && (
              <button type="button" className={styles.icon} onClick={() => setAdding(false)} aria-label="Cancel">
                <X size={16} />
              </button>
            )}
          </div>
          <input
            className={styles.input}
            placeholder="e.g. Read 20 pages"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            aria-label="Habit name"
            autoFocus
          />
          <div className={styles.emojiPick} role="group" aria-label="Icon">
            {EMOJIS.map((e) => (
              <button type="button" key={e} aria-pressed={emoji === e} onClick={() => setEmoji(e)} aria-label={`Icon ${e}`}>
                {e}
              </button>
            ))}
          </div>
          <div className={styles.row}>
            <span className={styles.muted}>Goal</span>
            <div className={styles.chips}>
              {[3, 5, 7].map((n) => (
                <button type="button" key={n} className={`${styles.chip} ${target === n ? styles.chipOn : ''}`} onClick={() => setTarget(n)}>
                  {n === 7 ? 'Every day' : `${n}× a week`}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={!name.trim()}>
            Add habit
          </button>
        </form>
      )}

      {loading ? (
        <div className={styles.empty}>
          <Loader2 size={22} className={styles.spin} />
        </div>
      ) : (
        <ul className={styles.list}>
          {habits.map((h) => {
            const s = streak(h.days);
            const weekDone = week.filter((d) => h.days.includes(d.key)).length;
            return (
              <li key={h.id} className={styles.habit} style={{ '--tone': h.color || COLORS[0] } as React.CSSProperties}>
                <div className={styles.row}>
                  <span className={styles.habitEmoji} aria-hidden>
                    {h.emoji}
                  </span>
                  <div className={styles.grow}>
                    <strong style={{ fontSize: 14, display: 'block', overflowWrap: 'anywhere' }}>{h.name}</strong>
                    <span className={styles.muted}>
                      {weekDone}/{h.target} this week{weekDone >= h.target ? ' ✓' : ''}
                    </span>
                  </div>
                  {s > 0 && (
                    <span className={styles.streak} title={`${s}-day streak`}>
                      <Flame size={13} style={{ verticalAlign: -2 }} /> {s}
                    </span>
                  )}
                  <button className={styles.icon} onClick={() => remove(h)} aria-label={`Delete ${h.name}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className={styles.week}>
                  {week.map((d) => {
                    const on = h.days.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        className={`${styles.day} ${on ? styles.dayOn : ''} ${d.today ? styles.dayToday : ''}`}
                        disabled={d.future}
                        onClick={() => toggleDay(h, d.key)}
                        aria-pressed={on}
                        aria-label={`${h.name}, ${new Date(`${d.key}T12:00`).toLocaleDateString([], { weekday: 'long' })}${on ? ', done' : ''}`}
                      >
                        <span>{d.label}</span>
                        <span className={styles.dayDot}>
                          <Check size={14} strokeWidth={3} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
