"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type NoiseColor = 'white' | 'pink' | 'brown';

export interface AmbientSound {
  id: string;
  name: string;
  /** file URL; empty for generated noise */
  url: string;
  color: string;
  noise?: NoiseColor;
}

// Birds, thunder, wind, crickets and city: Mixkit Sound Effects Free License.
export const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: 'rain', name: 'Rain', url: '/sounds/rain.mp3', color: '#3b82f6' },
  { id: 'thunder', name: 'Thunderstorm', url: '/sounds/thunder.mp3', color: '#6366f1' },
  { id: 'ocean', name: 'Ocean', url: '/sounds/ocean.mp3', color: '#06b6d4' },
  { id: 'waterstream', name: 'Stream', url: '/sounds/waterstream.mp3', color: '#14b8a6' },
  { id: 'birds', name: 'Forest birds', url: '/sounds/birds.mp3', color: '#22c55e' },
  { id: 'crickets', name: 'Summer night', url: '/sounds/crickets.mp3', color: '#84cc16' },
  { id: 'wind', name: 'Wind', url: '/sounds/wind.mp3', color: '#a3a3a3' },
  { id: 'blizzard', name: 'Blizzard', url: '/sounds/blizzard.mp3', color: '#818cf8' },
  { id: 'fire', name: 'Fireplace', url: '/sounds/fire.mp3', color: '#f97316' },
  { id: 'coffee', name: 'Café', url: '/sounds/coffee.mp3', color: '#d97706' },
  { id: 'city', name: 'City at night', url: '/sounds/city.mp3', color: '#eab308' },
  { id: 'keyboard', name: 'Typing', url: '/sounds/keyboard.mp3', color: '#94a3b8' },
  { id: 'white', name: 'White noise', url: '', noise: 'white', color: '#e5e7eb' },
  { id: 'pink', name: 'Pink noise', url: '', noise: 'pink', color: '#f9a8d4' },
  { id: 'brown', name: 'Brown noise', url: '', noise: 'brown', color: '#b45309' },
];

export const AMBIENT_PRESETS: { id: string; name: string; mix: Record<string, number> }[] = [
  { id: 'rainy-cafe', name: 'Rainy café', mix: { rain: 55, coffee: 40 } },
  { id: 'storm', name: 'Thunderstorm', mix: { thunder: 60, rain: 35 } },
  { id: 'cozy-cabin', name: 'Cozy cabin', mix: { fire: 60, blizzard: 30 } },
  { id: 'forest', name: 'Forest morning', mix: { birds: 55, waterstream: 30, wind: 10 } },
  { id: 'summer-night', name: 'Summer night', mix: { crickets: 55, fire: 20 } },
  { id: 'deep-focus', name: 'Deep focus', mix: { brown: 45, rain: 20 } },
  { id: 'city', name: 'City at night', mix: { city: 45, rain: 25 } },
  { id: 'seaside', name: 'Seaside', mix: { ocean: 60, wind: 15 } },
];

const noiseCache: Partial<Record<NoiseColor, string>> = {};

/**
 * A 20-second loop of white, pink or brown noise as a WAV blob URL. The drift is
 * removed so the end meets the start and the loop has no click.
 */
function noiseUrl(color: NoiseColor): string {
  const cached = noiseCache[color];
  if (cached) return cached;
  const rate = 22050;
  const n = rate * 20;
  const data = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (color === 'white') data[i] = w * 0.5;
    else if (color === 'pink') {
      // Paul Kellet's refined pink filter
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    } else {
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  }
  const drift = data[n - 1] - data[0];
  let peak = 0;
  for (let i = 0; i < n; i++) {
    data[i] -= (drift * i) / (n - 1);
    peak = Math.max(peak, Math.abs(data[i]));
  }
  const gain = peak > 0 ? 0.8 / peak : 1;

  const buffer = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i] * gain)) * 0x7fff, true);
  const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  noiseCache[color] = url;
  return url;
}

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
        el = new Audio(sound.noise ? noiseUrl(sound.noise) : sound.url);
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
