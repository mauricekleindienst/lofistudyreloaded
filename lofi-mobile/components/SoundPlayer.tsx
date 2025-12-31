import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Image, ImageSourcePropType } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { BlurView } from 'expo-blur';
import { CloudRain, Waves, Droplets, Snowflake, Flame, Keyboard, Coffee, Volume2, VolumeX, Music, Headphones, ExternalLink, LucideIcon } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../theme';

// --- Constants & Data ---

const SOUND_FILES = {
  rain: require('../assets/sounds/rain.mp3'),
  ocean: require('../assets/sounds/ocean.mp3'),
  waterstream: require('../assets/sounds/waterstream.mp3'),
  blizzard: require('../assets/sounds/blizzard.mp3'),
  fire: require('../assets/sounds/fire.mp3'),
  keyboard: require('../assets/sounds/keyboard.mp3'),
  coffee: require('../assets/sounds/coffee.mp3'),
};

interface SoundData {
  id: string;
  name: string;
  icon: LucideIcon;
  source: any;
  color: string;
}

const SOUNDS: SoundData[] = [
  { id: 'rain', name: 'Rain', icon: CloudRain, source: SOUND_FILES.rain, color: '#3b82f6' },
  { id: 'ocean', name: 'Ocean', icon: Waves, source: SOUND_FILES.ocean, color: '#06b6d4' },
  { id: 'waterstream', name: 'Stream', icon: Droplets, source: SOUND_FILES.waterstream, color: '#0891b2' },
  { id: 'blizzard', name: 'Blizzard', icon: Snowflake, source: SOUND_FILES.blizzard, color: '#6366f1' },
  { id: 'fire', name: 'Fireplace', icon: Flame, source: SOUND_FILES.fire, color: '#f97316' },
  { id: 'keyboard', name: 'Typing', icon: Keyboard, source: SOUND_FILES.keyboard, color: '#6b7280' },
  { id: 'coffee', name: 'Cafe', icon: Coffee, source: SOUND_FILES.coffee, color: '#78350f' },
];

const SPOTIFY_PLAYLISTS = [
  {
    id: 'lofi-girl',
    name: 'Lofi Girl - Beats to Relax/Study to',
    description: 'The original chill beats playlist.',
    url: 'https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=1f07f05c76cd4324',
    image: 'https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da848bc80c95b9d248cf462c0bd1',
    color: '#1DB954',
  },
  {
    id: 'synthwave',
    name: 'Synthwave / Retro',
    description: 'Nostalgic sounds for coding.',
    url: 'https://open.spotify.com/playlist/1YIe34rcmLjCYpY9wJoM2p?si=c0f0b2272d4b4d87',
    image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da8443953467afaaac28e80dfa1a',
    color: '#1DB954',
  },
  {
    id: 'code-chill',
    name: 'Code & Chill',
    description: 'Deep focus instrumentals.',
    url: 'https://open.spotify.com/playlist/07lYUEyTkWP3NqIa7Kzyqx?si=92e3cb7b6c054d4f',
    image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da8400bc7888968e9eb0e869f4f7',
    color: '#1DB954',
  },
  {
    id: 'focus-flow',
    name: 'Focus Flow',
    description: 'Steady rhythm for deep work.',
    url: 'https://open.spotify.com/playlist/1u4F50HA53L3Jwxbnk9IeO?si=2fda819e5fc34cf0',
    image: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da843a131f06c2865923a0f2ae01',
    color: '#1DB954',
  },
];

// --- Sub-Components ---

const SoundCard = memo(({ 
  sound, 
  masterVolume, 
  isMasterMuted 
}: { 
  sound: SoundData; 
  masterVolume: number;
  isMasterMuted: boolean;
}) => {
  const player = useAudioPlayer(sound.source);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    const effectiveVolume = isMasterMuted ? 0 : volume * masterVolume;
    player.volume = effectiveVolume;
  }, [volume, masterVolume, isMasterMuted, player]);

  const toggleSound = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.loop = true;
      player.play();
      player.volume = isMasterMuted ? 0 : volume * masterVolume;
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, player, isMasterMuted, volume, masterVolume]);

  const Icon = sound.icon;

  return (
    <View style={styles.cardContainer}>
      <BlurView intensity={20} tint="dark" style={[styles.blurContainer, isPlaying && { backgroundColor: `${sound.color}15` }]}>
        <View style={[styles.card, isPlaying && { borderColor: sound.color }]}>
          <TouchableOpacity onPress={toggleSound} style={styles.cardHeader}>
            <View style={[styles.iconContainer, isPlaying && { backgroundColor: `${sound.color}30` }]}>
              <Icon size={20} color={isPlaying ? sound.color : theme.colors.textSecondary} />
            </View>
            <Text style={[styles.soundName, isPlaying && { color: sound.color }]}>{sound.name}</Text>
          </TouchableOpacity>
          
          {isPlaying && (
            <View style={styles.volumeContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={setVolume}
                minimumTrackTintColor={sound.color}
                maximumTrackTintColor="rgba(255,255,255,0.1)"
                thumbTintColor={sound.color}
              />
            </View>
          )}
        </View>
      </BlurView>
    </View>
  );
});

const PlaylistCard = memo(({ playlist }: { playlist: typeof SPOTIFY_PLAYLISTS[0] }) => (
  <TouchableOpacity 
    style={styles.playlistCard}
    onPress={() => Linking.openURL(playlist.url).catch(console.error)}
    activeOpacity={0.8}
  >
    <BlurView intensity={30} tint="dark" style={styles.playlistBlur}>
      <Image source={{ uri: playlist.image }} style={styles.playlistIcon} />
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName}>{playlist.name}</Text>
        <Text style={styles.playlistDesc} numberOfLines={2}>{playlist.description}</Text>
        <View style={styles.playRow}>
          <View style={[styles.playBadge, { backgroundColor: playlist.color }]}>
            <ExternalLink size={12} color="#000" />
            <Text style={styles.playText}>OPEN</Text>
          </View>
        </View>
      </View>
    </BlurView>
    <View style={[styles.playlistAccent, { backgroundColor: playlist.color }]} />
  </TouchableOpacity>
));

const MasterControls = memo(({ 
  volume, 
  isMuted, 
  onVolumeChange, 
  onToggleMute 
}: { 
  volume: number; 
  isMuted: boolean; 
  onVolumeChange: (val: number) => void; 
  onToggleMute: () => void; 
}) => (
  <BlurView intensity={30} tint="dark" style={styles.masterControls}>
    <TouchableOpacity onPress={onToggleMute} style={styles.masterMuteButton}>
      {isMuted ? (
        <VolumeX size={20} color={theme.colors.textSecondary} />
      ) : (
        <Volume2 size={20} color={theme.colors.accent} />
      )}
    </TouchableOpacity>
    
    <View style={styles.masterVolumeControl}>
      <Slider
        style={styles.masterSlider}
        minimumValue={0}
        maximumValue={1}
        value={volume}
        onValueChange={onVolumeChange}
        minimumTrackTintColor={isMuted ? theme.colors.textSecondary : theme.colors.accent}
        maximumTrackTintColor="rgba(255,255,255,0.1)"
        thumbTintColor={isMuted ? theme.colors.textSecondary : theme.colors.accent}
      />
    </View>
  </BlurView>
));

// --- Main Component ---

export default function SoundPlayer() {
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'ambient' | 'music'>('ambient');

  const adjustMasterVolume = useCallback((val: number) => {
    setMasterVolume(val);
    if (val > 0 && isMasterMuted) setIsMasterMuted(false);
  }, [isMasterMuted]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Volume2 size={24} color={theme.colors.accent} />
          <Text style={styles.headerTitle}>Sounds</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <BlurView intensity={20} tint="dark" style={styles.tabs}>
          {(['ambient', 'music'] as const).map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              {tab === 'ambient' ? (
                <Headphones size={16} color={activeTab === tab ? theme.colors.accent : theme.colors.textSecondary} />
              ) : (
                <Music size={16} color={activeTab === tab ? theme.colors.accent : theme.colors.textSecondary} />
              )}
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </BlurView>
      </View>

      {activeTab === 'ambient' ? (
        <>
          <View style={styles.controlsWrapper}>
            <MasterControls 
              volume={masterVolume} 
              isMuted={isMasterMuted} 
              onVolumeChange={adjustMasterVolume}
              onToggleMute={() => setIsMasterMuted(!isMasterMuted)}
            />
          </View>
          <ScrollView contentContainerStyle={styles.grid}>
            {SOUNDS.map((sound) => (
              <SoundCard 
                key={sound.id} 
                sound={sound} 
                masterVolume={masterVolume}
                isMasterMuted={isMasterMuted}
              />
            ))}
          </ScrollView>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {SPOTIFY_PLAYLISTS.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
          <Text style={styles.spotifyNote}>Opens in Spotify App</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  controlsWrapper: { padding: theme.spacing.md, paddingBottom: 0 },
  masterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  masterMuteButton: { padding: 4 },
  masterVolumeControl: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  masterSlider: { width: '100%', height: 40 },
  
  grid: {
    padding: theme.spacing.md,
    paddingBottom: 20,
    gap: 12,
  },
  cardContainer: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  blurContainer: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { 
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundName: { color: theme.colors.textSecondary, fontSize: 16, fontWeight: '600' },
  volumeContainer: { width: 180, height: 40, justifyContent: 'center' },
  slider: { width: '100%', height: 40 },
  
  tabContainer: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md },
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
    borderRadius: 8,
  },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tabText: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 14 },
  activeTabText: { color: theme.colors.accent },
  
  listContent: { padding: theme.spacing.md, gap: 12 },
  playlistCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
  },
  playlistBlur: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  playlistIcon: { width: 80, height: 80, borderRadius: 8 },
  playlistInfo: { flex: 1, justifyContent: 'center' },
  playlistName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 },
  playlistDesc: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8 },
  playRow: { flexDirection: 'row' },
  playBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  playText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  playlistAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, opacity: 0.8 },
  spotifyNote: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12, marginTop: 12, opacity: 0.6 },
});
