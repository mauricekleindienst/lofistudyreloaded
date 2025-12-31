import React, { useState, useEffect, memo } from 'react';
import { StyleSheet, View, TouchableOpacity, StatusBar, Keyboard, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Timer, Music, BarChart3, MessageSquare, User, CheckSquare } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { setAudioModeAsync } from 'expo-audio';
import PomodoroTimer from './components/PomodoroTimer';
import SoundPlayer from './components/SoundPlayer';
import Stats from './components/Stats';
import Chat from './components/Chat';
import TodoList from './components/TodoList';
import Auth from './components/Auth';
import Profile from './components/Profile';
import { theme } from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';

type Tab = 'timer' | 'sounds' | 'todo' | 'chat' | 'stats' | 'profile';

const TabItem = memo(({ icon: Icon, isActive, onPress }: { icon: any; isActive: boolean; onPress: () => void }) => (
  <TouchableOpacity 
    style={[styles.tabItem, isActive && styles.activeTabItem]} 
    onPress={onPress}
  >
    <Icon size={24} color={isActive ? theme.colors.accent : theme.colors.textSecondary} />
  </TouchableOpacity>
));

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('timer');
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(keyboardShow, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(keyboardHide, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <View style={styles.flex1}>
      <View style={[styles.contentContainer, activeTab !== 'chat' && { paddingBottom: 100 }]}>
        <View style={{ flex: 1, display: activeTab === 'timer' ? 'flex' : 'none' }}><PomodoroTimer /></View>
        <View style={{ flex: 1, display: activeTab === 'sounds' ? 'flex' : 'none' }}><SoundPlayer /></View>
        <View style={{ flex: 1, display: activeTab === 'todo' ? 'flex' : 'none' }}><TodoList /></View>
        <View style={{ flex: 1, display: activeTab === 'chat' ? 'flex' : 'none' }}>{user ? <Chat /> : <Auth />}</View>
        <View style={{ flex: 1, display: activeTab === 'stats' ? 'flex' : 'none' }}><Stats /></View>
        <View style={{ flex: 1, display: activeTab === 'profile' ? 'flex' : 'none' }}>{user ? <Profile /> : <Auth />}</View>
      </View>
      
      {!isKeyboardVisible && (
        <View style={[styles.floatingBarContainer, { bottom: Math.max(insets.bottom, 24) }]}>
          <BlurView intensity={40} tint="dark" style={styles.floatingBar}>
            <TabItem icon={Timer} isActive={activeTab === 'timer'} onPress={() => setActiveTab('timer')} />
            <TabItem icon={Music} isActive={activeTab === 'sounds'} onPress={() => setActiveTab('sounds')} />
            <TabItem icon={CheckSquare} isActive={activeTab === 'todo'} onPress={() => setActiveTab('todo')} />
            <TabItem icon={MessageSquare} isActive={activeTab === 'chat'} onPress={() => setActiveTab('chat')} />
            <TabItem icon={BarChart3} isActive={activeTab === 'stats'} onPress={() => setActiveTab('stats')} />
            <TabItem icon={User} isActive={activeTab === 'profile'} onPress={() => setActiveTab('profile')} />
          </BlurView>
        </View>
      )}
    </View>
  );
}

export default function App() {
  useEffect(() => {
    setAudioModeAsync({
      allowsRecording: false,
      shouldPlayInBackground: true,
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers'
    }).catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LinearGradient
          colors={['#1a202c', '#2d3748', '#1a202c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.flex1}
        >
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <SafeAreaView style={styles.flex1} edges={['top', 'left', 'right']}>
            <AppContent />
          </SafeAreaView>
        </LinearGradient>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  contentContainer: { flex: 1 },
  floatingBarContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 32, 44, 0.6)',
    borderRadius: 30,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  tabItem: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabItem: {
    // No background or border for active state
  },
});
