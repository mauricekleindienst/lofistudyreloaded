"use client";
import React, { useState, useEffect, useRef } from 'react';
import YouTube, { YouTubeEvent } from 'react-youtube';
import { Music, X, SkipBack, SkipForward, Play, Pause, Volume2, VolumeX, Shuffle, Repeat, List, Plus, Trash2 } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import styles from '../../styles/MusicPlayerSidebar.module.css';
import Image from 'next/image';
import Snowfall from 'react-snowfall';

// Type declaration for YouTube iframe API
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface Track {
  id: number;
  title: string;
  videoId: string;
  channelName: string;
  channelUrl: string;
  isCustom?: boolean;
}

// Initial music tracks list
const initialTracks: Track[] = [
  { id: 1, title: 'Lofi Christmas 🎄', videoId: '1YBtzAAChU8', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 2, title: 'Lofi hip hop radio 📚', videoId: 'jfKfPfyJRdk', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 3, title: 'Medieval lofi radio 🏰', videoId: '_uMuuHk_KkQ', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 4, title: 'Jazz lofi radio 🎷', videoId: 'HuFYqnbVbzY', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 5, title: 'Sad lofi radio ☔', videoId: 'P6Segk8cr-c', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 6, title: 'Asian lofi radio ⛩️', videoId: 'Na0w3Mz46GA', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 7, title: 'Peaceful piano radio 🎹', videoId: '4oStw0r33so', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 8, title: 'Synthwave radio 🌌', videoId: '4xDzrJKXOOY', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 9, title: 'Dark ambient radio 🌃', videoId: 'S_MOd40zlYU', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 10, title: 'Dark academia 🌓', videoId: 'SllpB3W5f6s', channelName: 'Toxic Drunker', channelUrl: 'https://www.youtube.com/@ToxicDrunker_' },
  { id: 11, title: 'Jazz music ☕', videoId: 'MYPVQccHhAQ', channelName: 'Relaxing Jazz Piano', channelUrl: 'https://www.youtube.com/@relaxingjazzpiano6491' },
  { id: 12, title: 'Lofi Pokemon mix 🏝️', videoId: '6CjpgFOOtuI', channelName: 'STUDIO MATCHA US', channelUrl: 'https://www.youtube.com/@LoFi_Pokemon_Matcha' },
  { id: 13, title: 'Skyrim soundtrack ❄️', videoId: '_Z1VzsE1GVg', channelName: 'Aaronmn7', channelUrl: 'https://www.youtube.com/@AeronN7' },
  { id: 14, title: 'Animal crossing 🌳', videoId: 'V6GUhCxMDLg', channelName: 'RemDaBom', channelUrl: 'https://www.youtube.com/@RemDaBom' },
  { id: 15, title: 'Minecraft Soundtrack 🏰', videoId: 'ZUIT_rQIR5M', channelName: 'Minecraft', channelUrl: 'https://www.youtube.com/@Minecraft' },
  { id: 16, title: 'Harry Potter study musik 📚', videoId: 'pQdTu0IeVho', channelName: 'AmbientWorlds', channelUrl: 'https://www.youtube.com/@AmbientWorlds' },
  { id: 17, title: 'Morning Work Chill Mix ☀️', videoId: 'XXkXvTR7IL8', channelName: 'BLUME', channelUrl: 'https://www.youtube.com/@BLUME_Music' }
];

interface MusicPlayerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MusicPlayerSidebar: React.FC<MusicPlayerSidebarProps> = ({ isOpen, onToggle }) => {
  const { updateMusicState } = useAppState();
  
  // Music player state
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newTrackTitle, setNewTrackTitle] = useState('');  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [apiReady, setApiReady] = useState(false);  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const playerRef = useRef<YouTubeEvent['target'] | null>(null);

  // Christmas seasonal theme (auto-enabled Nov–Feb)
  const isChristmasActive = (() => {
    const m = new Date().getMonth();
    // November (10), December (11), January (0), February (1)
    return m === 10 || m === 11 || m === 0 || m === 1;
  })();

  const currentTrack = tracks[currentTrackIndex];

  // Load YouTube iframe API script on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    window.onYouTubeIframeAPIReady = () => setApiReady(true);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
      delete window.onYouTubeIframeAPIReady;
    };
  }, []);

  // Persist music player state in localStorage
  useEffect(() => {
    const storedTracksJSON = localStorage.getItem('musicSidebar_tracks');
    const storedTrackIndex = localStorage.getItem('musicSidebar_currentTrackIndex');
    const storedVolume = localStorage.getItem('musicSidebar_volume');
    
    let loadedTracks: Track[] = initialTracks;

    if (storedTracksJSON) {
      try {
        const storedTracks = JSON.parse(storedTracksJSON) as Track[];
        const customTracks = storedTracks.filter(t => t.isCustom);
        
        const initialVideoIds = new Set(initialTracks.map(t => t.videoId));
        const uniqueCustomTracks = customTracks.filter(t => !initialVideoIds.has(t.videoId));

        loadedTracks = [...initialTracks, ...uniqueCustomTracks];
      } catch (e) {
        console.error('Error parsing stored tracks:', e);
        loadedTracks = initialTracks;
      }
    }
    
    // Re-assign IDs to ensure they are unique and sequential
    const finalTracks = loadedTracks.map((track, index) => ({
      ...track,
      id: index + 1,
    }));

    setTracks(finalTracks);

    if (storedTrackIndex) {
      const index = parseInt(storedTrackIndex, 10);
      if (index >= 0 && index < finalTracks.length) {
        setCurrentTrackIndex(index);
      }
    }
    if (storedVolume) {
      const volume = parseInt(storedVolume, 10);
      if (volume >= 0 && volume <= 100) {
        setVolume(volume);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('musicSidebar_tracks', JSON.stringify(tracks));
    localStorage.setItem('musicSidebar_currentTrackIndex', currentTrackIndex.toString());
    localStorage.setItem('musicSidebar_volume', volume.toString());
  }, [tracks, currentTrackIndex, volume]);

  // No user toggle; theme auto-activates in season

  // Update context with current music state
  useEffect(() => {
    updateMusicState({
      isPlaying,
      currentTrack: tracks[currentTrackIndex]?.title || null
    });
  }, [isPlaying, currentTrackIndex, tracks, updateMusicState]);

  // Music Player Functions
  const playPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const nextTrack = () => {
    let nextIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % tracks.length;
    }
    setCurrentTrackIndex(nextIndex);
    setIsLoading(true);
  };

  const previousTrack = () => {
    let prevIndex;
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * tracks.length);
    } else {
      prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    }
    setCurrentTrackIndex(prevIndex);
    setIsLoading(true);
  };
  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsLoading(true);
  };

  const removeTrack = (id: number) => {
    const trackToRemoveIndex = tracks.findIndex(t => t.id === id);
    if (trackToRemoveIndex === -1) {
      return;
    }

    const isDeletingCurrentTrack = trackToRemoveIndex === currentTrackIndex;

    // Stop player if the current track is being deleted
    if (isDeletingCurrentTrack) {
      playerRef.current?.stopVideo();
      setIsPlaying(false);
    }

    const newTracks = tracks.filter(track => track.id !== id);

    let newCurrentTrackIndex = currentTrackIndex;

    if (newTracks.length === 0) {
      newCurrentTrackIndex = 0;
    } else if (isDeletingCurrentTrack) {
      // The new current track will be at the same index, unless it was the last track
      newCurrentTrackIndex = trackToRemoveIndex % newTracks.length;
    } else if (trackToRemoveIndex < currentTrackIndex) {
      // A track before the current one was removed
      newCurrentTrackIndex -= 1;
    }

    setTracks(newTracks);
    setCurrentTrackIndex(newCurrentTrackIndex);
  };

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    }
  };

  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    setIsLoading(false);
    
    // Set initial volume
    playerRef.current.setVolume(volume);
  };

  const onStateChange = (event: YouTubeEvent) => {
    switch (event.data) {
      case 1: // playing
        setIsPlaying(true);
        setIsLoading(false);
        break;
      case 2: // paused
        setIsPlaying(false);
        setIsLoading(false);
        break;
      case 0: // ended
        setIsPlaying(false);
        setIsLoading(false);
        if (isRepeating) {
          playerRef.current?.playVideo();
        } else {
          nextTrack();
        }
        break;
      case 3: // buffering
        setIsLoading(true);
        break;
      default:
        break;
    }
  };

  const addNewTrack = (title: string, url: string) => {
    try {
      const videoId = new URL(url).searchParams.get('v');
      if (!videoId) {
        alert('Invalid YouTube URL');
        return;
      }
      const newTrack: Track = {
        id: tracks.length > 0 ? Math.max(...tracks.map(t => t.id)) + 1 : 1,
        title,
        videoId,
        channelName: "Custom",
        channelUrl: "",
        isCustom: true,
      };
      setTracks([...tracks, newTrack]);
      setNewTrackTitle('');
      setNewTrackUrl('');
      setIsFormVisible(false);
    } catch (error) {
      alert('Invalid YouTube URL');
      console.error("Error parsing YouTube URL:", error);
    }
  };

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const getThumbnailUrl = (videoId: string) => `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  return (
    <>
      {/* Backdrop Overlay */}
      <div className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`} onClick={onToggle} />
      
      {/* Floating Toggle Button (when sidebar is closed) */}
      <button
        className={`${styles.floatingToggle} ${isOpen ? styles.hidden : ''}`}
        onClick={onToggle}
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
      
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} ${isChristmasActive ? styles.christmasTheme : ''}`}>
        {isChristmasActive && (
          <div className={styles.snowfallOverlay}>
            <Snowfall
              color="#ffffff"
              snowflakeCount={60}
              style={{ pointerEvents: 'none' }}
            />
          </div>
        )}
        <div className={styles.sidebarContent}>
          {/* Header */}
          <div className={styles.header}>
           
            <div className={styles.headerTitle}>
              <Music size={20} />
              <span>Music Player</span>
          </div>
            <button 
              className={styles.closeButton} 
              onClick={onToggle}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* YouTube Player - Hidden */}
          {apiReady && currentTrack && (
            <div style={{ display: 'none' }}>
              <YouTube
                videoId={currentTrack.videoId}
                onReady={onReady}
                onStateChange={onStateChange}
                opts={{
                  height: '0',
                  width: '0',
                  playerVars: {
                    autoplay: 1,
                  },
                }}
              />
            </div>
          )}

          {/* Now Playing */}
          <div className={styles.nowPlaying}>
            {currentTrack ? (
              <>
                <div className={styles.trackThumbnail}>
                  <Image
                    src={getThumbnailUrl(currentTrack.videoId)}
                    alt="Track thumbnail"
                    width={60}
                    height={60}
                    className={styles.thumbnail}
                    onError={(e) => {
                      const image = e.currentTarget as HTMLImageElement;
                      image.style.display = 'none';
                      const fallback = image.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div className={styles.thumbnailFallback}>
                    <Music size={24} />
                  </div>
                </div>
                <div className={styles.trackInfo}>
                  <h3 className={styles.trackTitle}>{currentTrack.title}</h3>
                  <a
                    href={currentTrack.channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.channelLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {currentTrack.channelName}
                  </a>
                </div>
              </>
            ) : (
              <div className={styles.trackInfo}>
                <h3 className={styles.trackTitle}>No track selected</h3>
                <p className={styles.channelName}>...</p>
              </div>
            )}
            {isLoading && currentTrack && (
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <button
              className={`${styles.controlButton} ${isShuffled ? styles.active : ''}`}
              onClick={() => setIsShuffled(!isShuffled)}
              title={isShuffled ? "Disable Shuffle" : "Enable Shuffle"}
            >
              <Shuffle size={18} />
            </button>
            <button className={styles.controlButton} onClick={previousTrack} title="Previous Track">
              <SkipBack size={18} />
            </button>
            <button
              className={styles.playButton}
              onClick={playPause}
              disabled={isLoading}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? <div className={styles.buttonSpinner}></div> : isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button className={styles.controlButton} onClick={nextTrack} title="Next Track">
              <SkipForward size={18} />
            </button>
            <button
              className={`${styles.controlButton} ${isRepeating ? styles.active : ''}`}
              onClick={() => setIsRepeating(!isRepeating)}
              title={isRepeating ? "Disable Repeat" : "Enable Repeat"}
            >
              <Repeat size={18} />
            </button>
          </div>

          {/* Volume Section */}
          <div className={styles.volumeSection}>
            <button className={styles.volumeButton} onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className={styles.volumeSlider}
            />
            <span className={styles.volumeValue}>{volume}%</span>
          </div>

          {/* Playlist Toggle */}
          <div className={styles.playlistToggle}>
            <button className={styles.playlistButton}>
              <List size={16} />
              <span>Playlist</span>
            </button>
            <button className={styles.addTrackButton} onClick={() => setIsFormVisible(!isFormVisible)}>
              <Plus size={16} />
              <span>Add Track</span>
            </button>
          </div>

          {/* Add Track Form */}
          {isFormVisible && (
            <div className={styles.addTrackForm}>
              <div className={styles.formHeader}>
                <h4>Add New Track</h4>
                <button className={styles.formCloseButton} onClick={() => setIsFormVisible(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className={styles.formInputs}>
                <input
                  type="text"
                  placeholder="Track Title"
                  value={newTrackTitle}
                  onChange={(e) => setNewTrackTitle(e.target.value)}
                  className={styles.formInput}
                />
                <input
                  type="text"
                  placeholder="YouTube URL"
                  value={newTrackUrl}
                  onChange={(e) => setNewTrackUrl(e.target.value)}
                  className={styles.formInput}
                />
                <button
                  className={styles.addButton}
                  onClick={() => addNewTrack(newTrackTitle, newTrackUrl)}
                  disabled={!newTrackTitle || !newTrackUrl}
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Playlist - Always Visible */}
          <div className={styles.playlist}>
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className={`${styles.track} ${index === currentTrackIndex ? styles.trackActive : ''}`}
              >
                <div style={{ flexGrow: 1, cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => selectTrack(index)}>
                  <span className={styles.trackNumber}>{index + 1}</span>
                  <div className={styles.trackMeta}>
                    <span className={styles.trackName}>{track.title}</span>
                    <span className={styles.trackArtist}>{track.channelName}</span>
                  </div>
                  {index === currentTrackIndex && isPlaying && (
                    <div className={styles.playingAnimation}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                </div>
                {track.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTrack(track.id);
                    }}
                    title="Remove track"
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 8px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicPlayerSidebar;
