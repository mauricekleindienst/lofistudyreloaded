"use client";

import React from 'react';
import { CloudRain, CloudLightning, Waves, Droplets, Snowflake, Flame, Keyboard, Coffee, Volume2, VolumeX, Pause, Play, Square, Bird, Moon, Wind, Building2, AudioLines } from 'lucide-react';
import { useAmbient, AMBIENT_SOUNDS, AMBIENT_PRESETS } from '../../contexts/AmbientContext';
import styles from '../../../styles/SoundPlayer.module.css';

const ICONS: Record<string, React.ElementType> = {
  rain: CloudRain,
  ocean: Waves,
  waterstream: Droplets,
  blizzard: Snowflake,
  fire: Flame,
  coffee: Coffee,
  keyboard: Keyboard,
  thunder: CloudLightning,
  birds: Bird,
  crickets: Moon,
  wind: Wind,
  city: Building2,
  white: AudioLines,
  pink: AudioLines,
  brown: AudioLines,
};

export default function SoundPlayer() {
  const amb = useAmbient();
  const anyOn = amb.activeCount > 0;

  return (
    <div className={styles.mixer}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={amb.togglePaused}
          disabled={!anyOn}
          aria-label={amb.paused ? 'Resume sounds' : 'Pause sounds'}
          title={amb.paused ? 'Resume' : 'Pause'}
        >
          {amb.paused || !anyOn ? <Play size={16} /> : <Pause size={16} />}
        </button>
        <div className={styles.master}>
          {amb.master === 0 ? <VolumeX size={16} aria-hidden /> : <Volume2 size={16} aria-hidden />}
          <input
            type="range"
            min={0}
            max={100}
            value={amb.master}
            onChange={(e) => amb.setMaster(Number(e.target.value))}
            className={styles.slider}
            style={{ '--fill': `${amb.master}%` } as React.CSSProperties}
            aria-label="Master volume"
          />
          <span className={styles.value}>{amb.master}%</span>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={amb.stopAll}
          disabled={!anyOn}
          aria-label="Turn all sounds off"
          title="All off"
        >
          <Square size={14} />
        </button>
      </div>

      <div className={styles.presets} role="group" aria-label="Presets">
        {AMBIENT_PRESETS.map((p) => (
          <button key={p.id} type="button" className={styles.preset} onClick={() => amb.applyPreset(p.mix)}>
            {p.name}
          </button>
        ))}
      </div>

      <ul className={styles.grid}>
        {AMBIENT_SOUNDS.map((sound) => {
          const Icon = ICONS[sound.id] ?? Volume2;
          const level = amb.levels[sound.id] ?? 0;
          const on = level > 0;
          const broken = amb.failed[sound.id];
          return (
            <li
              key={sound.id}
              className={`${styles.card} ${on ? styles.on : ''} ${on && !amb.paused ? styles.live : ''}`}
              style={{ '--tone': sound.color } as React.CSSProperties}
            >
              <button
                type="button"
                className={styles.cardToggle}
                onClick={() => amb.toggle(sound.id)}
                aria-pressed={on}
                title={broken ? 'Couldn’t load — tap to try again' : undefined}
              >
                <span className={styles.cardIcon}>
                  <Icon size={20} />
                </span>
                <span className={styles.cardName}>{sound.name}</span>
                {broken && <span className={styles.cardError}>Unavailable · retry</span>}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={level}
                onChange={(e) => amb.setLevel(sound.id, Number(e.target.value))}
                className={styles.slider}
                style={{ '--fill': `${level}%` } as React.CSSProperties}
                aria-label={`${sound.name} volume`}
                disabled={broken}
              />
            </li>
          );
        })}
      </ul>

      <p className={styles.hint}>Sounds keep playing when you close this window. Brown noise helps many people focus.</p>
    </div>
  );
}
