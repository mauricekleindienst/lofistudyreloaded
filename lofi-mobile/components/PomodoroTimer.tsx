import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView, Platform, DeviceEventEmitter } from 'react-native';
import { Play, Pause, RotateCcw, Coffee, Timer, Armchair, Settings, X, ChevronDown } from 'lucide-react-native';
import { useAudioPlayer } from 'expo-audio';
import { BlurView } from 'expo-blur';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { theme } from '../theme';
import { db } from '../lib/database';

// --- Constants & Types ---

const SOUND_FILES = {
  work: require('../assets/sounds/alert-work.mp3'),
  shortBreak: require('../assets/sounds/alert-short-break.mp3'),
  longBreak: require('../assets/sounds/alert-long-break.mp3'),
};

type Mode = 'pomodoro' | 'shortBreak' | 'longBreak';

const DEFAULT_DURATIONS: Record<Mode, number> = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
};

const MODE_CONFIG: Record<Mode, { color: string; label: string; icon: React.ElementType }> = {
  pomodoro: { color: theme.colors.accent, label: 'Focus', icon: Timer },
  shortBreak: { color: theme.colors.success, label: 'Short', icon: Coffee },
  longBreak: { color: '#3b82f6', label: 'Long', icon: Armchair },
};

const CATEGORIES = ["Studying", "Coding", "Writing", "Working", "Other"];

// --- Sub-Components ---

const ModeSelector = memo(({ currentMode, onChange }: { currentMode: Mode; onChange: (m: Mode) => void }) => (
  <View style={styles.modeSelector}>
    <BlurView intensity={20} tint="dark" style={styles.blurModeContainer}>
      {(Object.keys(MODE_CONFIG) as Mode[]).map((mode) => {
        const config = MODE_CONFIG[mode];
        const isActive = currentMode === mode;
        const Icon = config.icon;
        
        return (
          <TouchableOpacity 
            key={mode}
            style={[
              styles.modeButton, 
              isActive && { backgroundColor: `${config.color}33`, borderColor: config.color }
            ]}
            onPress={() => onChange(mode)}
          >
            <Icon size={20} color={isActive ? config.color : theme.colors.textSecondary} />
            <Text style={[styles.modeText, isActive && { color: config.color }]}>{config.label}</Text>
          </TouchableOpacity>
        );
      })}
    </BlurView>
  </View>
));

const TimerDisplay = memo(({ timeLeft, isActive, mode }: { timeLeft: number; isActive: boolean; mode: Mode }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <BlurView intensity={10} tint="dark" style={[styles.timerCircleContainer, { borderColor: MODE_CONFIG[mode].color }]}>
      <View style={styles.timerContent}>
        <Text style={[styles.timeText, { color: MODE_CONFIG[mode].color }]}>{formatTime(timeLeft)}</Text>
        <Text style={styles.statusText}>{isActive ? 'RUNNING' : 'PAUSED'}</Text>
      </View>
    </BlurView>
  );
});

const Controls = memo(({ isActive, mode, onToggle, onReset, onSettings }: any) => (
  <View style={styles.controls}>
    <TouchableOpacity style={styles.controlButton} onPress={onReset}>
      <RotateCcw size={24} color={theme.colors.textPrimary} />
    </TouchableOpacity>

    <TouchableOpacity 
      style={[styles.playButton, { backgroundColor: MODE_CONFIG[mode].color }]} 
      onPress={onToggle}
    >
      {isActive ? <Pause size={32} color="#fff" /> : <Play size={32} color="#fff" style={{ marginLeft: 4 }} />}
    </TouchableOpacity>

    <TouchableOpacity style={styles.controlButton} onPress={onSettings}>
      <Settings size={24} color={theme.colors.textPrimary} />
    </TouchableOpacity>
  </View>
));

// --- Main Component ---

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.pomodoro * 60);
  const [isActive, setIsActive] = useState(false);
  const [category, setCategory] = useState("Studying");
  
  const [showSettings, setShowSettings] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Audio
  const workSound = useAudioPlayer(SOUND_FILES.work);
  const shortBreakSound = useAudioPlayer(SOUND_FILES.shortBreak);
  const longBreakSound = useAudioPlayer(SOUND_FILES.longBreak);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialization & Permissions
  useEffect(() => {
    if (Platform.OS === 'android') {
      const initAndroid = async () => {
        await notifee.requestPermission();
        await notifee.createChannel({
          id: 'pomodoro-timer',
          name: 'Pomodoro Timer',
          lights: false,
          vibration: false,
          importance: AndroidImportance.DEFAULT,
        });
      };
      initAndroid();
    }
  }, []);

  const [endTime, setEndTime] = useState<number | null>(null);

  // Handlers
  const handleTimerComplete = useCallback(async () => {
    setIsActive(false);
    if (mode === 'pomodoro') {
      shortBreakSound.seekTo(0);
      shortBreakSound.play();
      await db.logPomodoroSession(durations.pomodoro, category);
    } else {
      workSound.seekTo(0);
      workSound.play();
    }
  }, [mode, durations, category, shortBreakSound, workSound]);

  // Timer Logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      // If we just started (or resumed) and don't have an end time, calculate it
      if (!endTime) {
        setEndTime(Date.now() + timeLeft * 1000);
      }

      timerRef.current = setInterval(() => {
        if (endTime) {
          const now = Date.now();
          const remaining = Math.ceil((endTime - now) / 1000);
          
          if (remaining <= 0) {
            setTimeLeft(0);
            handleTimerComplete();
          } else {
            setTimeLeft(remaining);
          }
        }
      }, 1000);
    } else if (!isActive) {
      setEndTime(null);
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, timeLeft, endTime, handleTimerComplete]);

  // Duration Updates
  useEffect(() => {
    if (!isActive) setTimeLeft(durations[mode] * 60);
  }, [durations, mode]);

  // Notifications
  useEffect(() => {
    const updateNotification = async () => {
      if (!isActive) {
        await notifee.stopForegroundService();
        return;
      }
      if (Platform.OS === 'android') {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        await notifee.displayNotification({
          id: 'timer',
          title: mode === 'pomodoro' ? 'Focus Timer' : 'Break Timer',
          body: `${timeString} remaining • ${category}`,
          android: {
            channelId: 'pomodoro-timer',
            asForegroundService: true,
            color: MODE_CONFIG[mode].color,
            colorized: true,
            ongoing: true,
            progress: { max: durations[mode] * 60, current: (durations[mode] * 60) - timeLeft },
            actions: [{ title: 'Stop', pressAction: { id: 'stop' } }],
          },
        });
      }
    };
    updateNotification();
  }, [isActive, timeLeft, mode, category]);

  // Event Listeners (Stop Action)
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(durations[mode] * 60);
  }, [durations, mode]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('STOP_TIMER', resetTimer);
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'stop') {
        resetTimer();
        if (detail.notification?.id) notifee.cancelNotification(detail.notification.id);
      }
    });
    return () => { subscription.remove(); unsubscribe(); };
  }, [resetTimer]);

  const toggleTimer = useCallback(() => {
    if (!isActive && mode === 'pomodoro' && timeLeft === durations.pomodoro * 60) {
      workSound.seekTo(0);
      workSound.play();
    }
    setIsActive((prev) => !prev);
  }, [isActive, mode, timeLeft, durations]);

  const changeMode = useCallback((newMode: Mode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(durations[newMode] * 60);
  }, [durations]);

  const updateDuration = (key: Mode, value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) setDurations(prev => ({ ...prev, [key]: num }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Timer size={24} color={theme.colors.accent} />
          <Text style={styles.headerTitle}>Timer</Text>
        </View>
        <TouchableOpacity onPress={() => setShowSettings(true)}>
          <Settings size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.bodyContainer}>
        <ModeSelector currentMode={mode} onChange={changeMode} />
        <TimerDisplay timeLeft={timeLeft} isActive={isActive} mode={mode} />
        <Controls 
          isActive={isActive} 
          mode={mode} 
          onToggle={toggleTimer} 
          onReset={resetTimer} 
          onSettings={() => setShowSettings(true)} 
        />

        <TouchableOpacity style={styles.categoryButton} onPress={() => setShowCategoryPicker(true)}>
          <Text style={styles.categoryLabel}>CATEGORY</Text>
          <View style={styles.categoryValueContainer}>
            <Text style={styles.categoryValue}>{category}</Text>
            <ChevronDown size={16} color={theme.colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Settings Modal */}
        <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
          <BlurView intensity={50} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Timer Settings</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <X size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.settingGroup}>
                <Text style={styles.settingGroupTitle}>DURATIONS (MINUTES)</Text>
                {(Object.keys(DEFAULT_DURATIONS) as Mode[]).map((key) => (
                  <View key={key} style={styles.settingRow}>
                    <Text style={styles.settingLabel}>{MODE_CONFIG[key].label}</Text>
                    <TextInput
                      style={styles.settingInput}
                      keyboardType="numeric"
                      value={durations[key].toString()}
                      onChangeText={(val) => updateDuration(key, val)}
                    />
                  </View>
                ))}
              </View>
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={() => { setShowSettings(false); resetTimer(); }}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Modal>

        {/* Category Modal */}
        <Modal visible={showCategoryPicker} transparent animationType="fade" onRequestClose={() => setShowCategoryPicker(false)}>
          <BlurView intensity={50} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                  <X size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.categoryList}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryOption, category === cat && { backgroundColor: `${theme.colors.accent}33`, borderColor: theme.colors.accent }]}
                    onPress={() => { setCategory(cat); setShowCategoryPicker(false); }}
                  >
                    <Text style={[styles.categoryOptionText, category === cat && { color: theme.colors.accent, fontWeight: 'bold' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </BlurView>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bodyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  modeSelector: { marginBottom: theme.spacing.xl, borderRadius: 12, overflow: 'hidden' },
  blurModeContainer: { flexDirection: 'row', padding: 4, backgroundColor: 'rgba(0,0,0,0.3)' },
  modeButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: 'transparent', gap: 8 },
  modeText: { color: theme.colors.textSecondary, fontWeight: '600' },
  timerCircleContainer: { width: 280, height: 280, borderRadius: 140, borderWidth: 4, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.xl, backgroundColor: 'rgba(26, 32, 44, 0.4)', overflow: 'hidden' },
  timerContent: { alignItems: 'center', justifyContent: 'center' },
  timeText: { fontSize: 64, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  statusText: { color: theme.colors.textSecondary, marginTop: 8, letterSpacing: 2, fontSize: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 32, marginBottom: theme.spacing.xl },
  controlButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 4.65, elevation: 8 },
  categoryButton: { width: '100%', padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  categoryLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 4, fontWeight: '600' },
  categoryValueContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryValue: { fontSize: 16, color: theme.colors.textPrimary, fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: theme.colors.bgSecondary, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  settingGroup: { marginBottom: 20 },
  settingGroupTitle: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600', marginBottom: 10 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  settingLabel: { fontSize: 16, color: theme.colors.textPrimary },
  settingInput: { width: 60, padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, color: theme.colors.textPrimary, textAlign: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  saveButton: { backgroundColor: theme.colors.accent, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  categoryList: { maxHeight: 300 },
  categoryOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', borderRadius: 8, marginBottom: 4 },
  categoryOptionText: { color: theme.colors.textSecondary, fontSize: 16 },
});
