"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export interface AmbientSound {
  id: string;
  name: string;
  url: string;
  color: string;
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: 'rain', name: 'Rain', url: '/sounds/rain.mp3', color: '#3b82f6' },
  { id: 'ocean', name: 'Ocean', url: '/sounds/ocean.mp3', color: '#06b6d4' },
  { id: 'waterstream', name: 'Stream', url: '/sounds/waterstream.mp3', color: '#14b8a6' },
  { id: 'blizzard', name: 'Blizzard', url: '/sounds/blizzard.mp3', color: '#818cf8' },
  { id: 'fire', name: 'Fireplace', url: '/sounds/fire.mp3', color: '#f97316' },
  { id: 'coffee', name: 'Café', url: '/sounds/coffee.mp3', color: '#d97706' },
  { id: 'keyboard', name: 'Typing', url: '/sounds/keyboard.mp3', color: '#94a3b8' },
];

export const AMBIENT_PRESETS: { id: string; name: string; mix: Record<string, number> }[] = [
  { id: 'rainy-cafe', name: 'Rainy café', mix: { rain: 55, coffee: 40 } },
  { id: 'cozy-cabin', name: 'Cozy cabin', mix: { fire: 60, blizzard: 30 } },
  { id: 'deep-focus', name: 'Deep focus', mix: { waterstream: 45, keyboard: 20 } },
  { id: 'seaside', name: 'Seaside', mix: { ocean: 60, rain: 15 } },
];

const STORAGE_KEY = 'lofi:ambient';
const DEFAULT_LEVEL = 50;

interface Persisted {
  levels: Record<string, number>;
  master: number;
}

interface AmbientContextValue {
  levels: Record<string, number>;
  master: number;
  paused: boolean;
  activeCount: number;
  failed: Record<string, true>;
  setLevel: (id: string, level: number) => void;
  toggle: (id: string) => void;
  setMaster: (level: number) => void;
  applyPreset: (mix: Record<string, number>) => void;
  stopAll: () => void;
  togglePaused: () => void;
}

const AmbientContext = createContext<AmbientContextValue | undefined>(undefined);

/**
 * Ambient sounds live at app level: they keep playing when the mixer window is
 * closed, the mix is remembered, and audio files load only once a sound is on.
 */
export function AmbientProvider({ children }: { children: React.ReactNode }) {
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [master, setMasterState] = useState(70);
  // Restored mixes start paused: browsers refuse audio before a user gesture.
  const [paused, setPaused] = useState(true);
  const [failed, setFailed] = useState<Record<string, true>>({});
  const audio = useRef<Record<string, HTMLAudioElement>>({});
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Persisted | null;
      if (saved) {
        setLevels(saved.levels ?? {});
        if (typeof saved.master === 'number') setMasterState(saved.master);
      }
    } catch {
      // ignore
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ levels, master } satisfies Persisted));
    } catch {
      // ignore
    }
  }, [levels, master]);

  // Sync <audio> elements with the desired mix.
  useEffect(() => {
    for (const sound of AMBIENT_SOUNDS) {
      const level = levels[sound.id] ?? 0;
      let el = audio.current[sound.id];
      if (level > 0 && !el && !failed[sound.id]) {
        el = new Audio(sound.url);
        el.loop = true;
        el.preload = 'auto';
        el.addEventListener('error', () => setFailed((f) => ({ ...f, [sound.id]: true })));
        audio.current[sound.id] = el;
      }
      if (!el) continue;
      el.volume = Math.min(1, (level / 100) * (master / 100));
      if (level > 0 && !paused) {
        if (el.paused) el.play().catch(() => setPaused(true));
      } else if (!el.paused) {
        el.pause();
      }
    }
  }, [levels, master, paused, failed]);

  useEffect(() => {
    const els = audio.current;
    return () => Object.values(els).forEach((el) => el.pause());
  }, []);

  const setLevel = useCallback((id: string, level: number) => {
    setLevels((prev) => ({ ...prev, [id]: Math.max(0, Math.min(100, Math.round(level))) }));
    if (level > 0) setPaused(false);
  }, []);

  const toggle = useCallback((id: string) => {
    setLevels((prev) => {
      const on = (prev[id] ?? 0) > 0;
      return { ...prev, [id]: on ? 0 : DEFAULT_LEVEL };
    });
    setPaused(false);
  }, []);

  const applyPreset = useCallback((mix: Record<string, number>) => {
    setLevels(Object.fromEntries(AMBIENT_SOUNDS.map((s) => [s.id, mix[s.id] ?? 0])));
    setPaused(false);
  }, []);

  const stopAll = useCallback(() => setLevels({}), []);
  const togglePaused = useCallback(() => setPaused((p) => !p), []);
  const setMaster = useCallback((level: number) => setMasterState(Math.max(0, Math.min(100, Math.round(level)))), []);

  const activeCount = AMBIENT_SOUNDS.filter((s) => (levels[s.id] ?? 0) > 0).length;

  const value = useMemo(
    () => ({ levels, master, paused, activeCount, failed, setLevel, toggle, setMaster, applyPreset, stopAll, togglePaused }),
    [levels, master, paused, activeCount, failed, setLevel, toggle, setMaster, applyPreset, stopAll, togglePaused]
  );

  return <AmbientContext value={value}>{children}</AmbientContext>;
}

export function useAmbient() {
  const ctx = useContext(AmbientContext);
  if (!ctx) throw new Error('useAmbient must be used within an AmbientProvider');
  return ctx;
}
