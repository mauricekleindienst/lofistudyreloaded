"use client";
import React, { useEffect, useState } from 'react';
import {
  Music,
  X,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Moon,
  Timer,
  Loader2,
  ListMusic,
} from 'lucide-react';
import { useMusic, useMusicProgress, formatTime, FAVORITES_ID } from '../contexts/MusicContext';
import { MUSIC_ARTIST, MUSIC_LICENSE, coverSrc, findTrack, stationOf, type MusicTrack } from '@/data/music';
import styles from '../../styles/MusicPlayer.module.css';

interface MusicPlayerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SLEEP_OPTIONS: { label: string; value: number | 'track' }[] = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: 'End of track', value: 'track' },
];

function Progress() {
  const music = useMusic();
  const { position, duration } = useMusicProgress();
  const total = duration || music.track?.duration || 0;
  const [drag, setDrag] = useState<number | null>(null);
  const value = drag ?? position;
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className={styles.progress}>
      <input
        type="range"
        min={0}
        max={Math.max(1, Math.floor(total))}
        step={1}
        value={Math.floor(value)}
        className={styles.slider}
        style={{ '--fill': `${pct}%` } as React.CSSProperties}
        onChange={(e) => setDrag(Number(e.target.value))}
        onPointerUp={() => {
          if (drag !== null) music.seek(drag);
          setDrag(null);
        }}
        onKeyUp={() => {
          if (drag !== null) music.seek(drag);
          setDrag(null);
        }}
        aria-label="Seek"
        aria-valuetext={`${formatTime(value)} of ${formatTime(total)}`}
      />
      <div className={styles.times}>
        <span>{formatTime(value)}</span>
        <span>-{formatTime(Math.max(0, total - value))}</span>
      </div>
    </div>
  );
}

function SleepCountdown({ endsAt }: { endsAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <>{formatTime(Math.max(0, (endsAt - now) / 1000))}</>;
}

const MusicPlayerSidebar: React.FC<MusicPlayerSidebarProps> = ({ isOpen, onToggle }) => {
  const music = useMusic();
  const { track, stations, stationId, favorites } = music;
  const [viewId, setViewId] = useState(stationId);
  const [showSleep, setShowSleep] = useState(false);

  // Jump to the playing station whenever it changes (the user may browse others meanwhile).
  const [shownStation, setShownStation] = useState(stationId);
  if (shownStation !== stationId) {
    setShownStation(stationId);
    setViewId(stationId);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onToggle();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onToggle]);

  const playingStation = track ? stationOf(track) : stations[0];
  const viewTracks: MusicTrack[] =
    viewId === FAVORITES_ID
      ? favorites.map((id) => findTrack(id)).filter((t): t is MusicTrack => Boolean(t))
      : (stations.find((s) => s.id === viewId)?.tracks ?? []);
  const viewStation = stations.find((s) => s.id === viewId);
  const viewMinutes = Math.round(viewTracks.reduce((n, t) => n + t.duration, 0) / 60);
  const isFav = track ? favorites.includes(track.id) : false;
  const sleepActive = music.sleepEndsAt !== null || music.stopAfterTrack;

  return (
    <>
      <div className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`} onClick={onToggle} aria-hidden />

      <button
        className={`${styles.floatingToggle} ${isOpen ? styles.hidden : ''}`}
        onClick={onToggle}
        aria-label="Open music player"
        aria-expanded={isOpen}
      >
        <Music size={20} />
        {music.isPlaying && (
          <span className={styles.eq} aria-hidden>
            <span />
            <span />
            <span />
          </span>
        )}
      </button>

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`} aria-label="Music player" aria-hidden={!isOpen} inert={!isOpen}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <Music size={18} />
            <span>Music</span>
          </div>
          <button className={styles.iconButton} onClick={onToggle} aria-label="Close music player">
            <X size={18} />
          </button>
        </header>

        <div className={styles.scroll}>
          {/* Now playing */}
          <section className={styles.now} aria-live="polite">
            <div className={styles.cover}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverSrc(playingStation)} alt="" />
              <div className={styles.coverShade} />
              <span className={styles.coverStation}>{playingStation.name}</span>
              {music.isPlaying && (
                <span className={`${styles.eq} ${styles.coverEq}`} aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </div>
            <div className={styles.meta}>
              <div className={styles.metaText}>
                <h2 className={styles.title}>{track?.title ?? 'Nothing playing'}</h2>
                <a className={styles.artist} href={MUSIC_ARTIST.url} target="_blank" rel="noopener noreferrer">
                  {MUSIC_ARTIST.name}
                </a>
              </div>
              {track && (
                <button
                  className={`${styles.iconButton} ${isFav ? styles.fav : ''}`}
                  onClick={() => music.toggleFavorite(track.id)}
                  aria-pressed={isFav}
                  aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>

            <Progress />

            {music.error && (
              <p className={styles.error} role="alert">
                {music.error}
              </p>
            )}

            <div className={styles.controls}>
              <button
                className={`${styles.iconButton} ${music.shuffle ? styles.on : ''}`}
                onClick={music.toggleShuffle}
                aria-pressed={music.shuffle}
                aria-label="Shuffle"
                title="Shuffle"
              >
                <Shuffle size={18} />
              </button>
              <button className={styles.iconButton} onClick={music.prev} aria-label="Previous track" title="Previous">
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button className={styles.play} onClick={music.toggle} aria-label={music.isPlaying ? 'Pause' : 'Play'}>
                {music.isLoading && music.isPlaying ? (
                  <Loader2 size={26} className={styles.spin} />
                ) : music.isPlaying ? (
                  <Pause size={26} fill="currentColor" />
                ) : (
                  <Play size={26} fill="currentColor" className={styles.playIcon} />
                )}
              </button>
              <button className={styles.iconButton} onClick={music.next} aria-label="Next track" title="Next">
                <SkipForward size={20} fill="currentColor" />
              </button>
              <button
                className={`${styles.iconButton} ${music.repeat !== 'off' ? styles.on : ''}`}
                onClick={music.cycleRepeat}
                aria-label={`Repeat: ${music.repeat === 'all' ? 'station' : music.repeat === 'one' ? 'this track' : 'off'}`}
                title={music.repeat === 'all' ? 'Repeat station' : music.repeat === 'one' ? 'Repeat track' : 'Repeat off'}
              >
                {music.repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
              </button>
            </div>

            <div className={styles.toolbar}>
              {music.volumeSupported ? (
                <div className={styles.volume}>
                  <button className={styles.iconButton} onClick={music.toggleMute} aria-label={music.muted ? 'Unmute' : 'Mute'}>
                    {music.muted || music.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={music.muted ? 0 : music.volume}
                    onChange={(e) => music.setVolume(Number(e.target.value))}
                    className={styles.slider}
                    style={{ '--fill': `${music.muted ? 0 : music.volume}%` } as React.CSSProperties}
                    aria-label="Music volume"
                  />
                </div>
              ) : (
                <span className={styles.hint}>Use your device’s volume buttons</span>
              )}
              <button
                className={`${styles.pill} ${sleepActive ? styles.pillOn : ''}`}
                onClick={() => setShowSleep((v) => !v)}
                aria-expanded={showSleep}
                title="Sleep timer"
              >
                <Moon size={14} />
                {music.sleepEndsAt ? <SleepCountdown endsAt={music.sleepEndsAt} /> : music.stopAfterTrack ? 'After track' : 'Sleep'}
              </button>
            </div>

            {showSleep && (
              <div className={styles.sleepMenu} role="group" aria-label="Sleep timer">
                {SLEEP_OPTIONS.map((o) => (
                  <button
                    key={o.label}
                    className={styles.chip}
                    onClick={() => {
                      music.setSleepTimer(o.value);
                      setShowSleep(false);
                    }}
                  >
                    {o.label}
                  </button>
                ))}
                {sleepActive && (
                  <button
                    className={`${styles.chip} ${styles.chipOff}`}
                    onClick={() => {
                      music.setSleepTimer(null);
                      setShowSleep(false);
                    }}
                  >
                    Off
                  </button>
                )}
              </div>
            )}

            <label className={styles.sync}>
              <Timer size={14} aria-hidden />
              <span>Play during focus, pause on breaks</span>
              <input type="checkbox" role="switch" checked={music.focusSync} onChange={(e) => music.setFocusSync(e.target.checked)} />
            </label>
          </section>

          {/* Stations */}
          <section className={styles.library} aria-label="Stations">
            <div className={styles.stations} role="tablist" aria-label="Stations">
              {stations.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={viewId === s.id}
                  className={`${styles.station} ${viewId === s.id ? styles.stationActive : ''}`}
                  onClick={() => setViewId(s.id)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverSrc(s)} alt="" loading="lazy" />
                  <span className={styles.stationName}>
                    {s.name}
                    {stationId === s.id && music.isPlaying && <span className={styles.liveDot} aria-label="playing" />}
                  </span>
                </button>
              ))}
              <button
                role="tab"
                aria-selected={viewId === FAVORITES_ID}
                className={`${styles.station} ${styles.stationFav} ${viewId === FAVORITES_ID ? styles.stationActive : ''}`}
                onClick={() => setViewId(FAVORITES_ID)}
              >
                <Heart size={22} fill="currentColor" aria-hidden />
                <span className={styles.stationName}>
                  Favourites
                  {stationId === FAVORITES_ID && music.isPlaying && <span className={styles.liveDot} aria-label="playing" />}
                </span>
              </button>
            </div>

            <div className={styles.listHeader}>
              <div>
                <h3>{viewId === FAVORITES_ID ? 'Favourites' : viewStation?.name}</h3>
                <p>
                  {viewId === FAVORITES_ID ? 'Tracks you’ve hearted' : viewStation?.tagline}
                  {viewTracks.length > 0 && ` · ${viewTracks.length} tracks · ${viewMinutes} min`}
                </p>
              </div>
              {viewTracks.length > 0 && (
                <button
                  className={styles.playStation}
                  onClick={() => (stationId === viewId ? music.toggle() : music.playStation(viewId))}
                  aria-label={stationId === viewId && music.isPlaying ? 'Pause station' : 'Play station'}
                >
                  {stationId === viewId && music.isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                </button>
              )}
            </div>

            {viewTracks.length === 0 ? (
              <div className={styles.empty}>
                <ListMusic size={28} aria-hidden />
                <p>Tap the heart on a song you like and it shows up here.</p>
              </div>
            ) : (
              <ol className={styles.tracks}>
                {viewTracks.map((t, i) => {
                  const current = track?.id === t.id;
                  const fav = favorites.includes(t.id);
                  return (
                    <li key={t.id} className={`${styles.trackRow} ${current ? styles.trackCurrent : ''}`}>
                      <button
                        type="button"
                        className={styles.trackSelect}
                        onClick={() => (current ? music.toggle() : music.playTrack(t.id, viewId))}
                        aria-current={current}
                      >
                        <span className={styles.trackIndex}>
                          {current && music.isPlaying ? (
                            <span className={styles.eq} aria-hidden>
                              <span />
                              <span />
                              <span />
                            </span>
                          ) : (
                            i + 1
                          )}
                        </span>
                        <span className={styles.trackMeta}>
                          <span className={styles.trackTitle}>{t.title}</span>
                          <span className={styles.trackSub}>
                            {viewId === FAVORITES_ID ? stationOf(t).name : t.album}
                          </span>
                        </span>
                        <span className={styles.trackTime}>{formatTime(t.duration)}</span>
                      </button>
                      <button
                        type="button"
                        className={`${styles.trackFav} ${fav ? styles.fav : ''}`}
                        onClick={() => music.toggleFavorite(t.id)}
                        aria-pressed={fav}
                        aria-label={fav ? `Remove ${t.title} from favourites` : `Add ${t.title} to favourites`}
                      >
                        <Heart size={14} fill={fav ? 'currentColor' : 'none'} />
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <footer className={styles.credits}>
            Music by{' '}
            <a href={MUSIC_ARTIST.url} target="_blank" rel="noopener noreferrer">
              {MUSIC_ARTIST.name}
            </a>
            , released into the public domain (
            <a href={MUSIC_LICENSE.url} target="_blank" rel="noopener noreferrer">
              {MUSIC_LICENSE.name}
            </a>
            ). Streams from our own server — no ads, no tracking.
          </footer>
        </div>
      </aside>
    </>
  );
};

export default MusicPlayerSidebar;
