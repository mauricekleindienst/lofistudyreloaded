import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { BlurView } from 'expo-blur';
import { Send, Users, MessageSquare } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import { getMessages, subscribeToMessages, sendMessage, trackPresence, ChatMessage } from '../lib/chat';

// --- Sub-Components ---

const MessageItem = memo(({ item, isMe }: { item: ChatMessage; isMe: boolean }) => {
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? timeStr : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  return (
    <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
      {!isMe && <Text style={styles.username}>{item.username}</Text>}
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
      <Text style={styles.timestamp}>{formatMessageDate(item.created_at)}</Text>
    </View>
  );
});

const ChatInput = memo(({ value, onChange, onSend, disabled }: { value: string, onChange: (t: string) => void, onSend: () => void, disabled: boolean }) => (
  <BlurView intensity={20} tint="dark" style={styles.inputContainer}>
    <TextInput
      style={styles.input}
      placeholder="Type a message..."
      placeholderTextColor={theme.colors.textSecondary}
      value={value}
      onChangeText={onChange}
      multiline
      maxLength={500}
    />
    <TouchableOpacity 
      style={[styles.sendButton, disabled && styles.sendButtonDisabled]} 
      onPress={onSend}
      disabled={disabled}
    >
      <Send size={20} color="#fff" />
    </TouchableOpacity>
  </BlurView>
));

// --- Main Component ---

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    loadMessages();
    const unsubscribeMessages = subscribeToMessages((newMessage) => {
      setMessages((prev) => [newMessage, ...prev]);
    });
    return () => {
      unsubscribeMessages();
    };
  }, []);

  useEffect(() => {
    let unsubscribePresence: () => void;
    if (user) {
      unsubscribePresence = trackPresence(user.id, setOnlineCount);
    }
    return () => {
      if (unsubscribePresence) unsubscribePresence();
    };
  }, [user]);

  const loadMessages = async () => {
    const data = await getMessages();
    setMessages(data);
    setLoading(false);
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !user) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage({
      user_id: user.id,
      username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
      message: text,
    });
  }, [inputText, user]);

  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { paddingTop: insets.top }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MessageSquare size={24} color={theme.colors.accent} />
          <Text style={styles.headerTitle}>Chat</Text>
        </View>
        <View style={styles.onlineBadge}>
          <Users size={14} color={theme.colors.success} />
          <Text style={styles.onlineText}>{onlineCount} online</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageItem item={item} isMe={user?.id === item.user_id} />}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />

      <ChatInput 
        value={inputText} 
        onChange={setInputText} 
        onSend={handleSend} 
        disabled={!inputText.trim()} 
      />
      {!keyboardVisible && <View style={{ height: Math.max(insets.bottom, 20) + 80 }} />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)' },
  onlineText: { fontSize: 12, color: theme.colors.success, fontWeight: '600' },
  listContent: { padding: theme.spacing.md, gap: 12 },
  messageRow: { marginBottom: 12, maxWidth: '80%' },
  myMessageRow: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  otherMessageRow: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  username: { fontSize: 12, color: theme.colors.accent, marginBottom: 4, marginLeft: 4, fontWeight: '600' },
  messageBubble: { padding: 12, borderRadius: 16, minWidth: 60 },
  myBubble: { backgroundColor: theme.colors.accent, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: theme.colors.bgSecondary, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  messageText: { color: '#fff', fontSize: 16, lineHeight: 22 },
  timestamp: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 4, marginHorizontal: 4 },
  inputContainer: { flexDirection: 'row', padding: theme.spacing.md, alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  input: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: theme.colors.textPrimary, maxHeight: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: theme.colors.bgSecondary, opacity: 0.5 },
});
