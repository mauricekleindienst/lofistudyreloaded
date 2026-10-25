"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatStore, sendMessage, type ChatMessage } from '../lib/chat';
import { ApiError, toast } from '../lib/api';

export function useRealtimeChat() {
  const { user, updateProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(
    () =>
      chatStore.subscribe((state) => {
        setMessages(state.messages);
        setOnlineUsers(state.online);
        setLoading(!state.loaded);
      }),
    []
  );

  const send = useCallback(async (text: string): Promise<boolean> => {
    if (!text.trim()) return false;
    try {
      await sendMessage(text.trim());
      return true;
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Message could not be sent', 'error');
      return false;
    }
  }, []);

  const updateUsername = useCallback(
    async (name: string): Promise<boolean> => {
      const { error } = await updateProfile({ full_name: name.trim() });
      if (error) toast(error, 'error');
      return !error;
    },
    [updateProfile]
  );

  const refreshMessages = useCallback(async () => {
    await chatStore.poll();
  }, []);

  return {
    messages,
    loading,
    onlineUsers,
    username: user?.full_name ?? '',
    hasUsername: Boolean(user?.full_name),
    sendMessage: send,
    updateUsername,
    refreshMessages,
  };
}
