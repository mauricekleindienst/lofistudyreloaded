"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Loader,
  Volume2,
  VolumeX,
  CloudRain,
  Waves,
  Droplets,
  Snowflake,
  Flame,
  Keyboard,
  Coffee
} from 'lucide-react';
import styles from '../../../styles/SoundPlayer.module.css';

interface Sound {
  id: string;
  name: string;
  icon: React.ElementType;
  url: string;
  category: 'nature' | 'ambient' | 'white-noise';
  color: string;
}

interface SoundState {
  volume: number;
  isPlaying: boolean;
  isMuted: boolean;
}

const sounds: Sound[] = [
  // Nature sounds (available files)
  { id: 'rain', name: 'Rain', icon: CloudRain, url: '/sounds/rain.mp3', category: 'nature', color: '#3b82f6' },
  { id: 'ocean', name: 'Ocean', icon: Waves, url: '/sounds/ocean.mp3', category: 'nature', color: '#06b6d4' },
  { id: 'waterstream', name: 'Water Stream', icon: Droplets, url: '/sounds/waterstream.mp3', category: 'nature', color: '#0891b2' },
  { id: 'blizzard', name: 'Blizzard', icon: Snowflake, url: '/sounds/blizzard.mp3', category: 'nature', color: '#6366f1' },

  // Ambient sounds (available files)
  { id: 'fire', name: 'Fireplace', icon: Flame, url: '/sounds/fire.mp3', category: 'ambient', color: '#f97316' },
  { id: 'keyboard', name: 'Typing', icon: Keyboard, url: '/sounds/keyboard.mp3', category: 'ambient', color: '#6b7280' },
  { id: 'coffee', name: 'Coffee Shop', icon: Coffee, url: '/sounds/coffee.mp3', category: 'ambient', color: '#78350f' },
];

export default function SoundPlayer() {
  const [soundStates, setSoundStates] = useState<Record<string, SoundState>>({});
  const [masterVolume, setMasterVolume] = useState(70);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [audioErrors, setAudioErrors] = useState<Record<string, string>>({});
  const [workingSounds, setWorkingSounds] = useState<Sound[]>([]);
  const [isTestingAudio, setIsTestingAudio] = useState(true);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Test audio files and filter out broken ones
  const testAudioFile = useCallback(async (sound: Sound): Promise<boolean> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.preload = 'metadata';

      const timeout = setTimeout(() => {
        console.warn(`Audio test timeout for ${sound.id}: ${sound.url}`);
        audio.src = '';
        resolve(false);
      }, 5000);

      const onCanPlay = () => {
        clearTimeout(timeout);
        cleanup();
        // Audio test passed
        resolve(true);
      };

      const onError = (e: Event) => {
        clearTimeout(timeout);
        cleanup();
        const target = e.target as HTMLAudioElement;
        const errorCode = target.error?.code;
        let errorMessage = 'Unknown error';

        switch (errorCode) {
          case 1: errorMessage = 'Audio loading aborted'; break;
          case 2: errorMessage = 'Network error'; break;
          case 3: errorMessage = 'Audio decoding failed'; break;
          case 4: errorMessage = 'Audio format not supported'; break;
          default: errorMessage = 'Audio file not found or corrupt';
        }

        console.error(`❌ Audio test failed for ${sound.id}: ${errorMessage}`);
        setAudioErrors(prev => ({
          ...prev,
          [sound.id]: errorMessage
        }));
        resolve(false);
      };

      const cleanup = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('loadedmetadata', onCanPlay);
        audio.removeEventListener('error', onError);
      };

      audio.addEventListener('canplaythrough', onCanPlay, { once: true });
      audio.addEventListener('loadedmetadata', onCanPlay, { once: true });
      audio.addEventListener('error', onError, { once: true });

      audio.src = sound.url;
      audio.load();
    });
  }, []);

  // Test all audio files on component mount
  useEffect(() => {
    const testAllAudioFiles = async () => {
      // Testing all audio files...
      setIsTestingAudio(true);

      const workingAudioFiles: Sound[] = [];

      for (const sound of sounds) {
        const isWorking = await testAudioFile(sound);
        if (isWorking) {
          workingAudioFiles.push(sound);
        }
      }

      // Found working audio files
      setWorkingSounds(workingAudioFiles);
      setIsTestingAudio(false);
    };

    testAllAudioFiles();
  }, [testAudioFile]);  // Initialize audio elements for working sounds only
  useEffect(() => {
    if (workingSounds.length === 0) return;

    const currentAudioRefs = audioRefs.current;

    workingSounds.forEach(sound => {
      if (!currentAudioRefs[sound.id]) {
        try {
          const audio = new Audio();
          audio.src = sound.url;
          audio.loop = true;
          audio.preload = 'metadata';
          audio.volume = 0;

          currentAudioRefs[sound.id] = audio;

          // Initialize sound state
          setSoundStates(prev => ({
            ...prev,
            [sound.id]: {
              volume: 0,
              isPlaying: false,
              isMuted: false
            }
          }));
        } catch (error) {
          console.error(`Error creating audio element for ${sound.id}:`, error);
        }
      }
    });

    return () => {
      // Cleanup audio elements using the captured ref
      // Cleanup audio elements using the captured ref
      Object.keys(currentAudioRefs).forEach(key => {
        try {
          const audio = currentAudioRefs[key];
          audio.pause();
          audio.src = '';
          audio.load();
          delete currentAudioRefs[key];
        } catch (error) {
          console.error('Error cleaning up audio:', error);
        }
      });
    };
  }, [workingSounds]);  // Update audio volumes when states change and auto-play/pause based on volume
  useEffect(() => {
    workingSounds.forEach(sound => {
      const audio = audioRefs.current[sound.id];
      const state = soundStates[sound.id];

      if (audio && state && audio.src) { // Check that src exists before trying to play
        try {
          const finalVolume = isMasterMuted || state.isMuted
            ? 0
            : (state.volume / 100) * (masterVolume / 100);
          audio.volume = Math.max(0, Math.min(1, finalVolume));

          // Auto-play when volume > 0, auto-pause when volume = 0
          if (state.volume > 0 && !state.isMuted && !isMasterMuted) {
            if (audio.paused && !audioErrors[sound.id]) {
              audio.play().catch(error => {
                console.error(`Error playing sound ${sound.id}:`, error);
                setAudioErrors(prev => ({
                  ...prev,
                  [sound.id]: `Playback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                }));
              });
              setSoundStates(prev => ({
                ...prev,
                [sound.id]: { ...prev[sound.id], isPlaying: true }
              }));
            }
          } else {
            if (!audio.paused) {
              audio.pause();
              setSoundStates(prev => ({
                ...prev,
                [sound.id]: { ...prev[sound.id], isPlaying: false }
              }));
            }
          }
        } catch (error) {
          console.error(`Error setting volume for ${sound.id}:`, error);
        }
      }
    });
  }, [workingSounds, soundStates, masterVolume, isMasterMuted, audioErrors]);
  const updateSoundVolume = useCallback((soundId: string, volume: number) => {
    setSoundStates(prev => ({
      ...prev,
      [soundId]: { ...prev[soundId], volume: Math.max(0, Math.min(100, volume)) }
    }));
  }, []);
  const toggleSoundMute = useCallback((soundId: string) => {
    setSoundStates(prev => ({
      ...prev,
      [soundId]: { ...prev[soundId], isMuted: !prev[soundId].isMuted }
    }));
  }, []);

  const getFilteredSounds = () => {
    return workingSounds;
  };

  return (
    <div className={styles.container}>
      {/* Master Controls */}
      <div className={styles.masterControls}>
        <button
          onClick={() => setIsMasterMuted(!isMasterMuted)}
          className={styles.masterMuteButton}
          title={isMasterMuted ? 'Unmute All' : 'Mute All'}
        >
          {isMasterMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={isMasterMuted ? 0 : masterVolume}
          onChange={(e) => setMasterVolume(parseInt(e.target.value))}
          className={styles.masterVolumeSlider}
          title={`Master Volume: ${isMasterMuted ? 0 : masterVolume}%`}
        />

      </div>

      {/* Sound Grid */}
      <div className={styles.soundGrid}>
        {isTestingAudio ? (
          <div className={styles.loadingContainer}>
            <Loader className="animate-spin w-12 h-12" style={{ color: '#ff7b00' }} />
          </div>
        ) : workingSounds.length === 0 ? (
          <div className={styles.noSoundsContainer}>
            <p className={styles.noSoundsText}>No working audio files found</p>
            <p className={styles.noSoundsSubtext}>
              Check browser console for specific errors
            </p>
          </div>
        ) : (
          getFilteredSounds().map(sound => {
            const state = soundStates[sound.id];
            const error = audioErrors[sound.id];

            if (!state) return null;

            return (

              <div
                key={sound.id}
                className={`${styles.soundCard} ${state.isPlaying ? styles.playing : ''} ${error ? styles.error : ''}`}
                style={{ '--sound-color': sound.color } as React.CSSProperties}
              >

                <div className={styles.soundInfo}>
                  <span className={styles.soundIcon}>
                    <sound.icon size={20} />
                  </span>
                  {error && <span className={styles.errorIndicator}>⚠️</span>}

                  {!error && (
                    <div className={styles.soundControls}>
                      <button
                        onClick={() => toggleSoundMute(sound.id)}
                        className={styles.soundMuteButton}
                        title={state.isMuted ? 'Unmute' : 'Mute'}
                      >
                        {state.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={state.isMuted ? 0 : state.volume}
                        onChange={(e) => updateSoundVolume(sound.id, parseInt(e.target.value))}
                        className={styles.volumeSlider}
                        title={`Volume: ${state.isMuted ? 0 : state.volume}%`}
                      />


                    </div>
                  )}
                </div>

                {error && (
                  <div className={styles.errorMessage}>
                    {error}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
