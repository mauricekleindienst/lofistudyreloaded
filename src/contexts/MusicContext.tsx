"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAppState } from './AppStateContext';
import { STATIONS, MUSIC_ARTIST, coverSrc, findTrack, stationOf, trackSrc, type MusicStation, type MusicTrack } from '@/data/music';

export type RepeatMode = 'off' | 'all' | 'one';
export const FAVORITES_ID = 'favorites';

/** Pomodoro events the player can follow (dispatched by PomodoroContext). */
export interface PomodoroPhaseDetail {
  phase: 'focus' | 'break';
  running: boolean;
}

interface Persisted {
  v: 2;
  stationId: string;
  trackId: string | null;
  position: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  favorites: string[];
  focusSync: boolean;
}

interface MusicContextValue {
  stations: MusicStation[];
  stationId: string;
  queue: MusicTrack[];
  track: MusicTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  volume: number;
  muted: boolean;
  /** iOS ignores element volume; the slider is hidden there. */
  volumeSupported: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  favorites: string[];
  focusSync: boolean;
  sleepEndsAt: number | null;
  stopAfterTrack: boolean;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  playStation: (stationId: string) => void;
  playTrack: (trackId: string, stationId?: string) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleFavorite: (trackId: string) => void;
  setFocusSync: (value: boolean) => void;
  /** minutes, 'track' = stop when the current track ends, null = off */
  setSleepTimer: (value: number | 'track' | null) => void;
}

interface ProgressValue {
  position: number;
  duration: number;
}

const STORAGE_KEY = 'lofi:music';
const MusicContext = createContext<MusicContextValue | undefined>(undefined);
// Position changes every second; a separate context keeps that from re-rendering every consumer.
const ProgressContext = createContext<ProgressValue>({ position: 0, duration: 0 });

const shuffled = (n: number, first: number) => {
  const rest = Array.from({ length: n }, (_, i) => i).filter((i) => i !== first);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return first >= 0 ? [first, ...rest] : rest;
};

const FADE_MS = 400;

/**
 * One <audio> element for the whole app, so music keeps playing while the
 * player panel is closed. All tracks are self-hosted CC0 files (see data/music.ts).
 */
export function MusicProvider({ children }: { children: React.ReactNode }) {
  const { updateMusicState } = useAppState();

  const [stationId, setStationId] = useState(STATIONS[0].id);
  const [trackId, setTrackId] = useState<string | null>(STATIONS[0].tracks[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(70);
  const [muted, setMuted] = useState(false);
  const [volumeSupported, setVolumeSupported] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [focusSync, setFocusSyncState] = useState(false);
  const [sleepEndsAt, setSleepEndsAt] = useState<number | null>(null);
  const [stopAfterTrack, setStopAfterTrack] = useState(false);
  const [progress, setProgress] = useState<ProgressValue>({ position: 0, duration: 0 });
  const [order, setOrder] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const resumeAt = useRef(0);
  /** the track the saved position belongs to */
  const resumeFor = useRef<string | null>(null);
  const skipTimer = useRef<number | null>(null);
  const errorStreak = useRef(0);
  // Saving starts only after the stored state was read, so defaults never overwrite it.
  const [ready, setReady] = useState(false);
  /** set when the user (not the pomodoro sync) paused, so sync won't fight them */
  const userPaused = useRef(false);

  // --- queue ---------------------------------------------------------------
  const queue = useMemo<MusicTrack[]>(() => {
    if (stationId === FAVORITES_ID) return favorites.map((id) => findTrack(id)).filter((t): t is MusicTrack => Boolean(t));
    return STATIONS.find((s) => s.id === stationId)?.tracks ?? STATIONS[0].tracks;
  }, [stationId, favorites]);

  const track = findTrack(trackId) ?? queue[0] ?? null;
  const index = track ? queue.findIndex((t) => t.id === track.id) : -1;

  // Shuffle order is rebuilt when the queue changes or shuffle is switched on.
  useEffect(() => {
    setOrder(shuffle ? shuffled(queue.length, index) : queue.map((_, i) => i));
    // index is deliberately left out: re-shuffling on every track change would repeat songs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, shuffle]);

  // Live values for event handlers attached once.
  const live = useRef({ queue, index, order, repeat, stopAfterTrack, track });
  useEffect(() => {
    live.current = { queue, index, order, repeat, stopAfterTrack, track };
  });

  // --- audio element -----------------------------------------------------------
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = 'metadata';
      audioRef.current = a;
      // iOS: element volume is read-only (always 1).
      a.volume = 0.5;
      setVolumeSupported(a.volume === 0.5);
    }
    return audioRef.current;
  }, []);

  const targetVolume = useCallback(() => (muted ? 0 : volume / 100), [muted, volume]);

  const cancelFade = useCallback(() => {
    if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
    fadeRef.current = null;
  }, []);

  const fadeTo = useCallback((to: number, done?: () => void, ms = FADE_MS) => {
    const a = audioRef.current;
    if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
    if (!a) return done?.();
    const from = a.volume;
    const start = performance.now();
    const stepFade = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      try {
        a.volume = from + (to - from) * k;
      } catch {
        // volume is read-only on some platforms
      }
      if (k < 1) fadeRef.current = requestAnimationFrame(stepFade);
      else {
        fadeRef.current = null;
        done?.();
      }
    };
    fadeRef.current = requestAnimationFrame(stepFade);
  }, []);

  // --- persistence ---------------------------------------------------------------
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Persisted | null;
      if (saved?.v === 2) {
        const favs = Array.isArray(saved.favorites) ? saved.favorites.filter((id) => findTrack(id)) : [];
        setFavorites(favs);
        const validStation = saved.stationId === FAVORITES_ID ? favs.length > 0 : STATIONS.some((s) => s.id === saved.stationId);
        if (validStation) setStationId(saved.stationId);
        if (findTrack(saved.trackId)) {
          setTrackId(saved.trackId);
          resumeAt.current = Math.max(0, Number(saved.position) || 0);
          resumeFor.current = saved.trackId;
        }
        if (typeof saved.volume === 'number') setVolumeState(Math.min(100, Math.max(0, saved.volume)));
        setShuffle(Boolean(saved.shuffle));
        if (['off', 'all', 'one'].includes(saved.repeat)) setRepeat(saved.repeat);
        setFocusSyncState(Boolean(saved.focusSync));
      } else if (saved) {
        // v1 stored YouTube stations; keep only the volume.
        const old = saved as unknown as { volume?: number };
        if (typeof old.volume === 'number') setVolumeState(old.volume);
      }
    } catch {
      // ignore corrupt state
    }
    setReady(true);
  }, []);

  const persist = useCallback(
    (position?: number) => {
      if (!ready) return;
      const data: Persisted = {
        v: 2,
        stationId,
        trackId: track?.id ?? null,
        // Until the saved track actually plays, keep its saved position.
        position: position ?? (resumeAt.current || audioRef.current?.currentTime || 0),
        volume,
        shuffle,
        repeat,
        favorites,
        focusSync,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
    },
    [ready, stationId, track?.id, volume, shuffle, repeat, favorites, focusSync]
  );
  useEffect(() => persist(), [persist]);

  // --- loading a track -------------------------------------------------------------
  const load = useCallback(
    (next: MusicTrack, autoplay: boolean) => {
      const a = getAudio();
      const src = trackSrc(next);
      // A pause fade or a pending error skip must not act on the new track.
      cancelFade();
      if (skipTimer.current) window.clearTimeout(skipTimer.current);
      skipTimer.current = null;
      if (resumeFor.current !== next.id) {
        resumeAt.current = 0;
        resumeFor.current = null;
      }
      setError(null);
      setTrackId(next.id);
      setProgress({ position: 0, duration: next.duration });
      // A failed element is reloaded even for the same file, so "play" can retry.
      if (!a.src.endsWith(src) || a.error) {
        a.src = src;
        a.load();
      }
      if (autoplay) {
        setIsLoading(true);
        try {
          a.volume = 0;
        } catch {
          // read-only
        }
        a.play()
          .then(() => fadeTo(targetVolume()))
          .catch((err: DOMException) => {
            setIsLoading(false);
            if (err.name === 'NotAllowedError') setIsPlaying(false);
          });
      }
    },
    [getAudio, fadeTo, targetVolume, cancelFade]
  );

  const step = useCallback(
    (dir: 1 | -1, auto = false) => {
      const { queue: q, index: i, order: o, repeat: r } = live.current;
      if (!q.length) return;
      const pos = Math.max(0, o.indexOf(i));
      let nextPos = pos + dir;
      if (nextPos >= o.length || nextPos < 0) {
        if (auto && r === 'off') {
          setIsPlaying(false);
          return;
        }
        nextPos = (nextPos + o.length) % o.length;
      }
      load(q[o[nextPos] ?? 0], true);
    },
    [load]
  );

  // --- element events (attached once) ------------------------------------------------
  useEffect(() => {
    const a = getAudio();
    let lastSave = 0;
    const onPlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      errorStreak.current = 0;
    };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onMeta = () => {
      if (resumeAt.current > 0 && resumeFor.current === live.current.track?.id && resumeAt.current < a.duration - 5) {
        a.currentTime = resumeAt.current;
      }
      resumeAt.current = 0;
      resumeFor.current = null;
      setProgress({ position: a.currentTime, duration: a.duration || 0 });
    };
    const onTime = () => {
      setProgress((p) => (Math.floor(p.position) === Math.floor(a.currentTime) ? p : { position: a.currentTime, duration: a.duration || p.duration }));
      const now = Date.now();
      if (now - lastSave > 5000) {
        lastSave = now;
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
          if (saved?.v === 2) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, position: a.currentTime }));
        } catch {
          // ignore
        }
      }
      // Warm the cache for the next track shortly before this one ends.
      if (a.duration && a.duration - a.currentTime < 20 && !preloadRef.current?.dataset.armed) {
        const { queue: q, index: i, order: o } = live.current;
        const nextTrack = q[o[(o.indexOf(i) + 1) % Math.max(1, o.length)]];
        if (nextTrack && nextTrack.id !== live.current.track?.id) {
          preloadRef.current = new Audio();
          preloadRef.current.preload = 'auto';
          preloadRef.current.src = trackSrc(nextTrack);
          preloadRef.current.dataset.armed = '1';
        }
      }
    };
    const onEnded = () => {
      preloadRef.current = null;
      const { repeat: r, stopAfterTrack: stop } = live.current;
      if (stop) {
        setStopAfterTrack(false);
        setIsPlaying(false);
        return;
      }
      if (r === 'one') {
        a.currentTime = 0;
        a.play().catch(() => undefined);
        return;
      }
      step(1, true);
    };
    const onError = () => {
      if (!a.src) return;
      setIsLoading(false);
      setIsPlaying(false);
      errorStreak.current += 1;
      if (errorStreak.current >= 3 || !navigator.onLine) {
        setError(navigator.onLine ? 'The music server isn’t responding. Try again in a moment.' : 'You’re offline.');
        return;
      }
      setError('This track couldn’t be loaded — skipping.');
      skipTimer.current = window.setTimeout(() => step(1, true), 1200);
    };
    a.addEventListener('playing', onPlaying);
    a.addEventListener('pause', onPause);
    a.addEventListener('waiting', onWaiting);
    a.addEventListener('canplay', onCanPlay);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnded);
    a.addEventListener('error', onError);
    return () => {
      a.removeEventListener('playing', onPlaying);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('waiting', onWaiting);
      a.removeEventListener('canplay', onCanPlay);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('error', onError);
    };
  }, [getAudio, step]);

  useEffect(() => () => audioRef.current?.pause(), []);

  // Volume changes apply immediately (no fade while dragging the slider).
  useEffect(() => {
    const a = audioRef.current;
    if (!a || fadeRef.current) return;
    try {
      a.volume = targetVolume();
    } catch {
      // read-only
    }
  }, [targetVolume]);

  // --- actions -------------------------------------------------------------------------
  const play = useCallback(() => {
    if (!track) return;
    userPaused.current = false;
    const a = getAudio();
    if (!a.src || a.error) return load(track, true);
    cancelFade();
    setIsLoading(a.readyState < 3);
    try {
      a.volume = 0;
    } catch {
      // read-only
    }
    a.play()
      .then(() => fadeTo(targetVolume()))
      .catch(() => setIsLoading(false));
  }, [track, getAudio, load, fadeTo, targetVolume, cancelFade]);

  const pause = useCallback(() => {
    const a = audioRef.current;
    if (!a || a.paused) return;
    fadeTo(0, () => a.pause());
    persist(a.currentTime);
  }, [fadeTo, persist]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      userPaused.current = true;
      pause();
    } else play();
  }, [isPlaying, play, pause]);

  const next = useCallback(() => step(1), [step]);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 4) {
      a.currentTime = 0;
      return;
    }
    step(-1);
  }, [step]);

  const seek = useCallback((seconds: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(seconds)) return;
    if (!a.src) {
      resumeAt.current = seconds;
      return;
    }
    a.currentTime = Math.max(0, Math.min(seconds, (a.duration || seconds) - 0.25));
    setProgress((p) => ({ ...p, position: a.currentTime }));
  }, []);

  const playTrack = useCallback(
    (id: string, inStation?: string) => {
      const t = findTrack(id);
      if (!t) return;
      if (inStation) setStationId(inStation);
      userPaused.current = false;
      load(t, true);
    },
    [load]
  );

  const playStation = useCallback(
    (id: string) => {
      const list = id === FAVORITES_ID ? favorites.map((f) => findTrack(f)).filter((t): t is MusicTrack => Boolean(t)) : STATIONS.find((s) => s.id === id)?.tracks;
      if (!list?.length) return;
      setStationId(id);
      userPaused.current = false;
      load(shuffle ? list[Math.floor(Math.random() * list.length)] : list[0], true);
    },
    [favorites, shuffle, load]
  );

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    setMuted(v === 0);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(() => setRepeat((r) => (r === 'all' ? 'one' : r === 'one' ? 'off' : 'all')), []);
  const toggleFavorite = useCallback(
    (id: string) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
    []
  );

  // Leaving the favorites station once it's empty.
  useEffect(() => {
    if (stationId === FAVORITES_ID && favorites.length === 0 && ready) {
      setStationId(track ? stationOf(track).id : STATIONS[0].id);
    }
  }, [stationId, favorites.length, track, ready]);

  // --- sleep timer ---------------------------------------------------------------------
  const setSleepTimer = useCallback((value: number | 'track' | null) => {
    setStopAfterTrack(value === 'track');
    setSleepEndsAt(typeof value === 'number' ? Date.now() + value * 60_000 : null);
  }, []);

  useEffect(() => {
    if (!sleepEndsAt) return;
    const id = window.setInterval(() => {
      if (Date.now() < sleepEndsAt) return;
      setSleepEndsAt(null);
      const a = audioRef.current;
      if (a && !a.paused) {
        // A long, gentle fade for falling asleep (cancelled if the user picks a track meanwhile).
        userPaused.current = true;
        fadeTo(0, () => a.pause(), 8000);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [sleepEndsAt, fadeTo]);

  // --- follow the pomodoro timer -------------------------------------------------------------
  const setFocusSync = useCallback((value: boolean) => setFocusSyncState(value), []);
  const syncRef = useRef({ focusSync, play, pause });
  useEffect(() => {
    syncRef.current = { focusSync, play, pause };
  });
  useEffect(() => {
    const onPhase = (e: Event) => {
      const { phase, running } = (e as CustomEvent<PomodoroPhaseDetail>).detail;
      const s = syncRef.current;
      if (!s.focusSync) return;
      if (phase === 'focus' && running) {
        // Don't override a pause the user made themselves.
        if (!userPaused.current) s.play();
      } else s.pause();
    };
    window.addEventListener('lofi:pomodoro-phase', onPhase);
    return () => window.removeEventListener('lofi:pomodoro-phase', onPhase);
  }, []);

  // --- mirrors: app state badge, media session ----------------------------------------------------
  useEffect(() => {
    updateMusicState({ isPlaying, currentTrack: track?.title ?? null });
  }, [isPlaying, track?.title, updateMusicState]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return;
    const station = stationOf(track);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: MUSIC_ARTIST.name,
      album: `${station.name} · Lo-Fi.Study`,
      artwork: [{ src: new URL(coverSrc(station), window.location.origin).href, sizes: '1280x720', type: 'image/webp' }],
    });
  }, [track]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => play()],
      ['pause', () => {
        userPaused.current = true;
        pause();
      }],
      ['nexttrack', () => next()],
      ['previoustrack', () => prev()],
      ['seekto', (d) => d.seekTime !== undefined && seek(d.seekTime)],
      ['seekbackward', (d) => seek((audioRef.current?.currentTime ?? 0) - (d.seekOffset ?? 10))],
      ['seekforward', (d) => seek((audioRef.current?.currentTime ?? 0) + (d.seekOffset ?? 10))],
    ];
    for (const [action, handler] of handlers) {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        // unsupported action
      }
    }
    ms.playbackState = isPlaying ? 'playing' : 'paused';
  }, [play, pause, next, prev, seek, isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !progress.duration || !navigator.mediaSession.setPositionState) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: progress.duration,
        position: Math.min(progress.position, progress.duration),
        playbackRate: 1,
      });
    } catch {
      // ignore invalid states during track changes
    }
  }, [progress]);

  const value = useMemo<MusicContextValue>(
    () => ({
      stations: STATIONS,
      stationId,
      queue,
      track,
      isPlaying,
      isLoading,
      error,
      volume,
      muted,
      volumeSupported,
      shuffle,
      repeat,
      favorites,
      focusSync,
      sleepEndsAt,
      stopAfterTrack,
      toggle,
      play,
      pause,
      next,
      prev,
      seek,
      playStation,
      playTrack,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      toggleFavorite,
      setFocusSync,
      setSleepTimer,
    }),
    [stationId, queue, track, isPlaying, isLoading, error, volume, muted, volumeSupported, shuffle, repeat, favorites, focusSync, sleepEndsAt, stopAfterTrack, toggle, play, pause, next, prev, seek, playStation, playTrack, setVolume, toggleMute, toggleShuffle, cycleRepeat, toggleFavorite, setFocusSync, setSleepTimer]
  );

  return (
    <MusicContext value={value}>
      <ProgressContext value={progress}>{children}</ProgressContext>
    </MusicContext>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within a MusicProvider');
  return ctx;
}

export const useMusicProgress = () => useContext(ProgressContext);

export const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};
