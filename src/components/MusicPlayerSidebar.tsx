"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Plus,
  X,
  ChevronLeft,
  Shuffle,
  Repeat,
  List
} from 'lucide-react';
import Image from 'next/image';
import YouTube, { YouTubeEvent } from 'react-youtube';
import styles from '../../styles/MusicPlayerSidebar.module.css';
import { useAppState } from '../contexts/AppStateContext';

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
}

// Initial music tracks list
const initialTracks: Track[] = [
  { id: 1, title: 'Lofi hip hop radio 📚', videoId: 'jfKfPfyJRdk', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 2, title: 'Medieval lofi radio 🏰', videoId: '_uMuuHk_KkQ', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 3, title: 'Jazz lofi radio 🎷', videoId: 'HuFYqnbVbzY', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 4, title: 'Sad lofi radio ☔', videoId: 'P6Segk8cr-c', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 5, title: 'Asian lofi radio ⛩️', videoId: 'Na0w3Mz46GA', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 6, title: 'Peaceful piano radio 🎹', videoId: '4oStw0r33so', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 7, title: 'Synthwave radio 🌌', videoId: '4xDzrJKXOOY', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 8, title: 'Dark ambient radio 🌃', videoId: 'S_MOd40zlYU', channelName: 'LofiGirl', channelUrl: 'https://www.youtube.com/@LofiGirl' },
  { id: 9, title: 'Dark academia 🌓', videoId: 'SllpB3W5f6s', channelName: 'Toxic Drunker', channelUrl: 'https://www.youtube.com/@ToxicDrunker_' },
  { id: 10, title: 'Jazz music ☕', videoId: 'MYPVQccHhAQ', channelName: 'Relaxing Jazz Piano', channelUrl: 'https://www.youtube.com/@relaxingjazzpiano6491' },
  { id: 11, title: 'Lofi Pokemon mix 🏝️', videoId: '6CjpgFOOtuI', channelName: 'STUDIO MATCHA US', channelUrl: 'https://www.youtube.com/@LoFi_Pokemon_Matcha' },
  { id: 12, title: 'Skyrim soundtrack ❄️', videoId: '_Z1VzsE1GVg', channelName: 'Aaronmn7', channelUrl: 'https://www.youtube.com/@AeronN7' },
  { id: 13, title: 'Animal crossing 🌳', videoId: 'V6GUhCxMDLg', channelName: 'RemDaBom', channelUrl: 'https://www.youtube.com/@RemDaBom' },
  { id: 14, title: 'Harry Potter study musik 📚', videoId: 'pQdTu0IeVho', channelName: 'AmbientWorlds', channelUrl: 'https://www.youtube.com/@AmbientWorlds' },
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
    const storedTracks = localStorage.getItem('musicSidebar_tracks');
    const storedTrackIndex = localStorage.getItem('musicSidebar_currentTrackIndex');
    const storedVolume = localStorage.getItem('musicSidebar_volume');
    
    if (storedTracks) {
      try {
        setTracks(JSON.parse(storedTracks));
      } catch (e) {
        console.error('Error parsing stored tracks:', e);
      }
    }
    if (storedTrackIndex) setCurrentTrackIndex(parseInt(storedTrackIndex));
    if (storedVolume) setVolume(parseInt(storedVolume));
  }, []);

  useEffect(() => {
    localStorage.setItem('musicSidebar_tracks', JSON.stringify(tracks));
    localStorage.setItem('musicSidebar_currentTrackIndex', currentTrackIndex.toString());
    localStorage.setItem('musicSidebar_volume', volume.toString());
  }, [tracks, currentTrackIndex, volume]);

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
      setTracks([...tracks, { 
        id: tracks.length + 1, 
        title, 
        videoId, 
        channelName: "Custom", 
        channelUrl: "" 
      }]);
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
      <div className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`} onClick={onToggle} />      {/* Sidebar Toggle Button */}
      <div className={styles.toggleButtonWrapper}>
        <button
          className={`${styles.toggleButton} ${isOpen ? styles.open : ''}`}
          onClick={onToggle}
          title={isOpen ? "Close Music Player" : "Open Music Player"}
        >
          {isOpen ? <ChevronLeft size={20} /> : <Music size={20} />}
          <span className={styles.toggleButtonText}>
            {isOpen ? 'Close' : 'Music'}
          </span>
        </button>
        {isPlaying && !isOpen && (
          <div className={styles.playingIndicator}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
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
                key={currentTrack.videoId}
                videoId={currentTrack.videoId}
                onReady={onReady}
                onStateChange={onStateChange}
                opts={{
                  height: '0',
                  width: '0',
                  playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                  },
                }}
              />
            </div>
          )}

          {/* Current Track Display */}
          <div className={styles.nowPlaying}>
            <div className={styles.trackThumbnail}>
              <Image 
                src={getThumbnailUrl(currentTrack.videoId)} 
                alt="Track thumbnail" 
                width={60}
                height={60}
                className={styles.thumbnail}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
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
              <p className={styles.channelName}>{currentTrack.channelName}</p>
            </div>
            {isLoading && (
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
              </div>
            )}
          </div>

          {/* Main Controls */}
          <div className={styles.controls}>
            <button
              className={`${styles.controlButton} ${isShuffled ? styles.active : ''}`}
              onClick={() => setIsShuffled(!isShuffled)}
              title="Shuffle"
            >
              <Shuffle size={16} />
            </button>
            
            <button
              className={styles.controlButton}
              onClick={previousTrack}
              disabled={isLoading}
              title="Previous"
            >
              <SkipBack size={18} />
            </button>
            
            <button
              className={styles.playButton}
              onClick={playPause}
              disabled={isLoading}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <div className={styles.buttonSpinner}></div>
              ) : isPlaying ? (
                <Pause size={20} />
              ) : (
                <Play size={20} />
              )}
            </button>
            
            <button
              className={styles.controlButton}
              onClick={nextTrack}
              disabled={isLoading}
              title="Next"
            >
              <SkipForward size={18} />
            </button>
            
            <button
              className={`${styles.controlButton} ${isRepeating ? styles.active : ''}`}
              onClick={() => setIsRepeating(!isRepeating)}
              title="Repeat"
            >
              <Repeat size={16} />
            </button>
          </div>

          {/* Volume Control */}
          <div className={styles.volumeSection}>
            <button onClick={toggleMute} className={styles.volumeButton}>
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className={styles.volumeSlider}
            />
            <span className={styles.volumeValue}>{isMuted ? 0 : volume}%</span>
          </div>          {/* Playlist Header */}
          <div className={styles.playlistToggle}>
            <div className={styles.playlistButton}>
              <List size={16} />
              <span>Playlist ({tracks.length})</span>
            </div>
            <button 
              className={styles.addTrackButton} 
              onClick={() => setIsFormVisible(!isFormVisible)}
              title="Add Track"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Playlist - Always Visible */}
          <div className={styles.playlist}>
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => selectTrack(index)}
                className={`${styles.track} ${
                  index === currentTrackIndex ? styles.trackActive : ''
                }`}
              >
                <div className={styles.trackNumber}>
                  {index === currentTrackIndex && isPlaying ? (
                    <div className={styles.playingAnimation}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className={styles.trackMeta}>
                  <div className={styles.trackName}>{track.title}</div>
                  <div className={styles.trackArtist}>{track.channelName}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Add Track Form */}
          {isFormVisible && (
            <div className={styles.addTrackForm}>
              <div className={styles.formHeader}>
                <h4>Add New Track</h4>
                <button 
                  className={styles.formCloseButton} 
                  onClick={() => setIsFormVisible(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className={styles.formInputs}>
                <input
                  type="text"
                  placeholder="Track title..."
                  value={newTrackTitle}
                  onChange={(e) => setNewTrackTitle(e.target.value)}
                  className={styles.formInput}
                />
                <input
                  type="text"
                  placeholder="YouTube URL..."
                  value={newTrackUrl}
                  onChange={(e) => setNewTrackUrl(e.target.value)}
                  className={styles.formInput}
                />
              </div>
              <button 
                onClick={() => addNewTrack(newTrackTitle, newTrackUrl)}
                className={styles.addButton}
                disabled={!newTrackTitle.trim() || !newTrackUrl.trim()}
              >
                <Plus size={14} />
                Add Track
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && <div className={styles.backdrop} onClick={onToggle} />}
    </>
  );
};

export default MusicPlayerSidebar;
