"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ChatMessage, 
  getMessages, 
  sendMessage, 
  subscribeToMessages,
  trackPresence
} from '../lib/chat';
import { createClient } from '../utils/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient();

export function useRealtimeChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [username, setUsername] = useState('');

  // Load initial messages and setup subscriptions
  useEffect(() => {
    if (!user) return;

    let unsubscribeMessages: (() => void) | null = null;
    let unsubscribePresence: (() => void) | null = null;

    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Load messages
        const chatMessages = await getMessages();
        setMessages(chatMessages);

        // Get username
        const { data } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (data?.full_name) {
          setUsername(data.full_name);
        } else {
          // Generate random username if not set
          setUsername(`User_${Math.floor(Math.random() * 10000)}`);
        }

        // Subscribe to new messages
        unsubscribeMessages = subscribeToMessages((newMessage) => {
          setMessages((prev) => [...prev, newMessage]);
        });

        // Track presence for online users
        unsubscribePresence = trackPresence(user.id);

        // Setup presence channel for online users count
        const presenceChannel: RealtimeChannel = supabase.channel('online_users');
        
        presenceChannel.on('presence', { event: 'sync' }, () => {
          const presenceState = presenceChannel.presenceState();
          const count = Object.keys(presenceState).length;
          setOnlineUsers(count);
        });

        await presenceChannel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ user_id: user.id });
          }
        });

      } catch (error) {
        console.error('Error setting up chat:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribePresence) unsubscribePresence();
    };
  }, [user]);

  // Send a new message
  const sendNewMessage = useCallback(async (messageText: string): Promise<boolean> => {
    if (!user || !messageText.trim()) return false;

    try {
      const message = {
        user_id: user.id,
        username: username || 'Anonymous',
        message: messageText.trim(),
      };

      const result = await sendMessage(message);
      return !!result;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }, [user, username]);

  // Update username
  const updateUsername = useCallback(async (newUsername: string): Promise<boolean> => {
    if (!user || !newUsername.trim()) return false;

    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: newUsername.trim() })
        .eq('id', user.id);

      if (!error) {
        setUsername(newUsername.trim());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating username:', error);
      return false;
    }
  }, [user]);

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const chatMessages = await getMessages();
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    messages,
    loading,
    onlineUsers,
    username,
    sendMessage: sendNewMessage,
    updateUsername,
    refreshMessages,
    hasUsername: !!username
  };
} 