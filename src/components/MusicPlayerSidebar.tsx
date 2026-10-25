"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import YouTube, { type YouTubeEvent, type YouTubePlayer } from 'react-youtube';
import { Music, X, SkipBack, SkipForward, Play, Pause, Volume2, VolumeX, Shuffle, Repeat, List, Plus, Trash2, RotateCcw } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { toast } from '../lib/api';
import styles from '../../styles/MusicPlayerSidebar.module.css';

interface Track {
  videoId: string;
  title: string;
  channelName: string;
  channelUrl: string;
  isCustom?: boolean;
}

const BUILT_IN: Track[] = [
  { title: 'Lofi hip hop radio 📚', videoId: 'jfKfPfyJRdk', channelName: 'Lofi Girl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { title: 'Medieval lofi radio 🏰', videoId: '_uMuuHk_KkQ', channelName: 'Lofi Girl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { title: 'Jazz lofi radio 🎷', videoId: 'HuFYqnbVbzY', channelName: 'Lofi Girl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { title: 'Sad lofi radio ☔', videoId: 'P6Segk8cr-c', channelName: 'Lofi Girl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { title: 'Asian lofi radio ⛩️', videoId: 'Na0w3Mz46GA', channelName: 'Lofi Girl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { title: 'Peaceful piano radio 🎹', videoId: '4oStw0r33so', channelName: 'Lofi Girl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { title: 'Synthwave radio 🌌', videoId: '4xDzrJKXOOY', channelName: 'Lofi Girl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { title: 'Dark ambient radio 🌃', videoId: 'S_MOd40zlYU', channelName: 'Lofi Girl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { title: 'Dark academia 🌓', videoId: 'SllpB3W5f6s', channelName: 'Toxic Drunker', channelUrl: 'https://www.youtube.com/@ToxicDrunker_' },
  { title: 'Jazz music ☕', videoId: 'MYPVQccHhAQ', channelName: 'Relaxing Jazz Piano', channelUrl: 'https://www.youtube.com/@relaxingjazzpiano6491' },
  { title: 'Lofi Pokémon mix 🏝️', videoId: '6CjpgFOOtuI', channelName: 'STUDIO MATCHA', channelUrl: 'https://www.youtube.com/@LoFi_Pokemon_Matcha' },
  { title: 'Skyrim soundtrack ❄️', videoId: '_Z1VzsE1GVg', channelName: 'Aaronmn7', channelUrl: 'https://www.youtube.com/@AeronN7' },
  { title: 'Animal Crossing 🌳', videoId: 'V6GUhCxMDLg', channelName: 'RemDaBom', channelUrl: 'https://www.youtube.com/@RemDaBom' },
  { title: 'Minecraft soundtrack 🏰', videoId: 'ZUIT_rQIR5M', channelName: 'Minecraft', channelUrl: 'https://www.youtube.com/@Minecraft' },
  { title: 'Harry Potter study music 📚', videoId: 'pQdTu0IeVho', channelName: 'AmbientWorlds', channelUrl: 'https://www.youtube.com/@AmbientWorlds' },
  { title: 'Morning work chill mix ☀️', videoId: 'XXkXvTR7IL8', channelName: 'BLUME', channelUrl: 'https://www.youtube.com/@BLUME_Music' },
];

const STORAGE_KEY = 'lofi:music';

interface Persisted {
  custom: Track[];
  hidden: string[];
  current: string | null;
  volume: number;
  shuffle: boolean;
  repeat: boolean;
}

/** Accepts watch?v=, youtu.be/, /shorts/, /live/, /embed/ links or a bare 11-char id. */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
    if (host === 'youtu.be') return url.pathname.slice(1, 12) || null;
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = url.pathname.match(/^\/(?:shorts|live|embed)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch {
    // not a URL
  }
  return null;
}

const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

interface MusicPlayerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MusicPlayerSidebar: React.FC<MusicPlayerSidebarProps> = ({ isOpen, onToggle }) => {
  const { updateMusicState } = useAppState();

  const [custom, setCustom] = useState<Track[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string>(BUILT_IN[0].videoId);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // The YouTube iframe (~1 MB of scripts) is only created once the user presses play.
  const [activated, setActivated] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [thumbFailed, setThumbFailed] = useState<Record<string, true>>({});
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const hydrated = useRef(false);

  const tracks = [...BUILT_IN.filter((t) => !hidden.includes(t.videoId)), ...custom];
  const currentIndex = Math.max(0, tracks.findIndex((t) => t.videoId === currentId));
  const currentTrack: Track | undefined = tracks[currentIndex];

  // Handlers registered with the YouTube player outlive renders; read live values via a ref.
  const live = useRef({ tracks, currentIndex, isShuffled, isRepeating });
  useEffect(() => {
    live.current = { tracks, currentIndex, isShuffled, isRepeating };
  });

  // --- persistence ---
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Persisted | null;
      if (saved) {
        setCustom(Array.isArray(saved.custom) ? saved.custom.filter((t) => t && /^[\w-]{11}$/.test(t.videoId)) : []);
        setHidden(Array.isArray(saved.hidden) ? saved.hidden : []);
        if (saved.current) setCurrentId(saved.current);
        if (typeof saved.volume === 'number') setVolume(saved.volume);
        setIsShuffled(Boolean(saved.shuffle));
        setIsRepeating(Boolean(saved.repeat));
      }
      ['musicSidebar_tracks', 'musicSidebar_currentTrackIndex', 'musicSidebar_volume'].forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore corrupt state
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const data: Persisted = { custom, hidden, current: currentId, volume, shuffle: isShuffled, repeat: isRepeating };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  }, [custom, hidden, currentId, volume, isShuffled, isRepeating]);

  useEffect(() => {
    updateMusicState({ isPlaying, currentTrack: currentTrack?.title ?? null });
  }, [isPlaying, currentTrack?.title, updateMusicState]);

  useEffect(() => {
    playerRef.current?.setVolume(volume);
  }, [volume]);

  // --- navigation ---
  const goTo = useCallback((videoId: string) => {
    setCurrentId(videoId);
    setActivated(true);
    setIsLoading(true);
  }, []);

  const step = useCallback(
    (dir: 1 | -1) => {
      const { tracks: list, currentIndex: idx, isShuffled: shuffle } = live.current;
      if (list.length === 0) return;
      let next = (idx + dir + list.length) % list.length;
      if (shuffle && list.length > 1) {
        do next = Math.floor(Math.random() * list.length);
        while (next === idx);
      }
      goTo(list[next].videoId);
    },
    [goTo]
  );

  const playPause = () => {
    if (!activated) {
      setActivated(true);
      setIsLoading(true);
      return;
    }
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (isMuted) p?.unMute();
    else p?.mute();
    setIsMuted(!isMuted);
  };

  // --- player events ---
  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    setPlayerReady(true);
    event.target.setVolume(volume);
    if (isMuted) event.target.mute();
    event.target.playVideo();
  };

  const onStateChange = (event: YouTubeEvent<number>) => {
    switch (event.data) {
      case 1:
        setIsPlaying(true);
        setIsLoading(false);
        break;
      case 2:
      case 5:
        setIsPlaying(false);
        setIsLoading(false);
        break;
      case 3:
        setIsLoading(true);
        break;
      case 0:
        setIsPlaying(false);
        if (live.current.isRepeating) event.target.playVideo();
        else step(1);
        break;
    }
  };

  const onError = () => {
    setIsLoading(false);
    setIsPlaying(false);
    toast(`"${currentTrack?.title ?? 'This video'}" can't be played here — skipping.`, 'warning');
    if (live.current.tracks.length > 1) step(1);
  };

  // Lock-screen / hardware media keys
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack || !activated) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.channelName,
      artwork: [{ src: thumb(currentTrack.videoId), sizes: '320x180', type: 'image/jpeg' }],
    });
    navigator.mediaSession.setActionHandler('play', () => playerRef.current?.playVideo());
    navigator.mediaSession.setActionHandler('pause', () => playerRef.current?.pauseVideo());
    navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
    navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
  }, [currentTrack, activated, step]);

  // --- playlist editing ---
  const addNewTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = parseYouTubeId(newTrackUrl);
    if (!videoId) {
      setFormError('That doesn’t look like a YouTube link.');
      return;
    }
    if (tracks.some((t) => t.videoId === videoId)) {
      setFormError('That video is already in your playlist.');
      return;
    }
    setCustom((prev) => [
      ...prev,
      { videoId, title: newTrackTitle.trim() || 'My track', channelName: 'Added by you', channelUrl: `https://www.youtube.com/watch?v=${videoId}`, isCustom: true },
    ]);
    setHidden((prev) => prev.filter((id) => id !== videoId));
    setNewTrackTitle('');
    setNewTrackUrl('');
    setFormError('');
    setIsFormVisible(false);
  };

  const removeTrack = (track: Track) => {
    if (track.videoId === currentId) {
      playerRef.current?.stopVideo();
      setIsPlaying(false);
      const rest = tracks.filter((t) => t.videoId !== track.videoId);
      if (rest.length) setCurrentId(rest[Math.min(currentIndex, rest.length - 1)].videoId);
    }
    if (track.isCustom) setCustom((prev) => prev.filter((t) => t.videoId !== track.videoId));
    else setHidden((prev) => [...prev, track.videoId]);
  };

  const restoreDefaults = () => setHidden([]);

  // Escape closes the sidebar
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onToggle();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onToggle]);

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
        {isPlaying && !isOpen && (
          <div className={styles.playingIndicator}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </button>

      {/* The player stays mounted while the sidebar is closed, so music keeps playing. */}
      {activated && currentTrack && (
        <div className={styles.hiddenPlayer} aria-hidden>
          <YouTube
            videoId={currentTrack.videoId}
            onReady={onReady}
            onStateChange={onStateChange}
            onError={onError}
            opts={{
              host: 'https://www.youtube-nocookie.com',
              height: '1',
              width: '1',
              playerVars: { autoplay: 1, playsinline: 1, controls: 0, rel: 0 },
            }}
          />
        </div>
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`} aria-label="Music player" aria-hidden={!isOpen} inert={!isOpen}>
        <div className={styles.sidebarContent}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <Music size={20} />
              <span>Music Player</span>
            </div>
            <button className={styles.closeButton} onClick={onToggle} aria-label="Close music player">
              <X size={18} />
            </button>
          </div>

          <div className={styles.nowPlaying}>
            {currentTrack ? (
              <>
                <div className={styles.trackThumbnail}>
                  {!thumbFailed[currentTrack.videoId] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={currentTrack.videoId}
                      src={thumb(currentTrack.videoId)}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      width={60}
                      height={60}
                      className={styles.thumbnail}
                      onError={() => setThumbFailed((f) => ({ ...f, [currentTrack.videoId]: true }))}
                    />
                  ) : (
                    <div className={styles.thumbnailFallback} style={{ display: 'flex' }}>
                      <Music size={24} />
                    </div>
                  )}
                </div>
                <div className={styles.trackInfo}>
                  <h3 className={styles.trackTitle}>{currentTrack.title}</h3>
                  <a href={currentTrack.channelUrl} target="_blank" rel="noopener noreferrer" className={styles.channelLink}>
                    {currentTrack.channelName}
                  </a>
                </div>
              </>
            ) : (
              <div className={styles.trackInfo}>
                <h3 className={styles.trackTitle}>Your playlist is empty</h3>
              </div>
            )}
          </div>

          <div className={styles.controls}>
            <button
              className={`${styles.controlButton} ${isShuffled ? styles.active : ''}`}
              onClick={() => setIsShuffled(!isShuffled)}
              aria-pressed={isShuffled}
              aria-label="Shuffle"
            >
              <Shuffle size={18} />
            </button>
            <button className={styles.controlButton} onClick={() => step(-1)} aria-label="Previous track" disabled={!tracks.length}>
              <SkipBack size={18} />
            </button>
            <button
              className={styles.playButton}
              onClick={playPause}
              disabled={!currentTrack || (activated && isLoading && !playerReady)}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? <div className={styles.buttonSpinner}></div> : isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button className={styles.controlButton} onClick={() => step(1)} aria-label="Next track" disabled={!tracks.length}>
              <SkipForward size={18} />
            </button>
            <button
              className={`${styles.controlButton} ${isRepeating ? styles.active : ''}`}
              onClick={() => setIsRepeating(!isRepeating)}
              aria-pressed={isRepeating}
              aria-label="Repeat track"
            >
              <Repeat size={18} />
            </button>
          </div>

          <div className={styles.volumeSection}>
            <button className={styles.volumeButton} onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className={styles.volumeSlider}
              aria-label="Music volume"
            />
            <span className={styles.volumeValue}>{volume}%</span>
          </div>

          <div className={styles.playlistToggle}>
            <span className={styles.playlistButton}>
              <List size={16} />
              <span>Playlist</span>
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {hidden.length > 0 && (
                <button className={styles.addTrackButton} onClick={restoreDefaults} title="Restore removed stations">
                  <RotateCcw size={14} />
                </button>
              )}
              <button className={styles.addTrackButton} onClick={() => setIsFormVisible(!isFormVisible)} aria-expanded={isFormVisible}>
                <Plus size={16} />
                <span>Add track</span>
              </button>
            </div>
          </div>

          {isFormVisible && (
            <form className={styles.addTrackForm} onSubmit={addNewTrack}>
              <div className={styles.formHeader}>
                <h4>Add a YouTube video</h4>
                <button type="button" className={styles.formCloseButton} onClick={() => setIsFormVisible(false)} aria-label="Cancel">
                  <X size={16} />
                </button>
              </div>
              <div className={styles.formInputs}>
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://youtube.com/watch?v=…"
                  value={newTrackUrl}
                  onChange={(e) => {
                    setNewTrackUrl(e.target.value);
                    setFormError('');
                  }}
                  className={styles.formInput}
                  aria-label="YouTube link"
                  required
                />
                <input
                  type="text"
                  placeholder="Title (optional)"
                  value={newTrackTitle}
                  onChange={(e) => setNewTrackTitle(e.target.value)}
                  className={styles.formInput}
                  aria-label="Title"
                  maxLength={80}
                />
                {formError && <p className={styles.formError}>{formError}</p>}
                <button type="submit" className={styles.addButton} disabled={!newTrackUrl.trim()}>
                  <Plus size={14} />
                  Add
                </button>
              </div>
            </form>
          )}

          <ul className={styles.playlist}>
            {tracks.map((track, index) => (
              <li key={track.videoId} className={`${styles.track} ${index === currentIndex ? styles.trackActive : ''}`}>
                <button type="button" className={styles.trackSelect} onClick={() => goTo(track.videoId)} aria-current={index === currentIndex}>
                  <span className={styles.trackNumber}>{index + 1}</span>
                  <span className={styles.trackMeta}>
                    <span className={styles.trackName}>{track.title}</span>
                    <span className={styles.trackArtist}>{track.channelName}</span>
                  </span>
                  {index === currentIndex && isPlaying && (
                    <span className={styles.playingAnimation}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  )}
                </button>
                <button type="button" className={styles.trackRemove} onClick={() => removeTrack(track)} aria-label={`Remove ${track.title}`}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default MusicPlayerSidebar;
