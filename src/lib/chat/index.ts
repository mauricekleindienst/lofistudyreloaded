import { createClient } from '../../utils/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

const supabase = createClient();

export async function sendMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage | null> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([message])
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', JSON.stringify(error, null, 2));
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to send message:', error); // Log the full error object
    return null;
  }
}

export async function getMessages(limit = 50): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading messages:', error);
      return [];
    }

    return data?.reverse() || [];
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
}

// Shared channel and listener management to prevent "multiple subscription" errors
let messageChannel: RealtimeChannel | null = null;
let messageListeners: ((message: ChatMessage) => void)[] = [];

export function subscribeToMessages(callback: (message: ChatMessage) => void): () => void {
  // Add listener to the list
  messageListeners.push(callback);

  // If channel doesn't exist yet, create and subscribe
  if (!messageChannel) {
    messageChannel = supabase.channel('chat_messages_channel');

    messageChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          // Notify all listeners
          messageListeners.forEach(listener => listener(newMessage));
        }
      )
      .subscribe((status) => {
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          // Reset if it fails so it can try to resubscribe later
          messageChannel = null;
        }
      });
  }

  // Return cleanup function
  return () => {
    // Remove listener
    messageListeners = messageListeners.filter(l => l !== callback);
  };
}

// Shared presence management
let presenceChannel: RealtimeChannel | null = null;
let presenceCallbacks: ((count: number) => void)[] = [];

export function trackPresence(userId: string, onCountChange?: (count: number) => void): () => void {
  if (onCountChange) {
    presenceCallbacks.push(onCountChange);
  }

  if (!presenceChannel) {
    presenceChannel = supabase.channel('online_users');

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel!.presenceState();
        const count = Object.keys(presenceState).length;
        presenceCallbacks.forEach(cb => cb(count));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel!.track({ user_id: userId });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          presenceChannel = null;
        }
      });
  } else {
    // If already subscribed, immediately trigger the callback with current state if possible
    const presenceState = presenceChannel.presenceState();
    const count = Object.keys(presenceState).length;
    if (onCountChange) onCountChange(count);
  }

  return () => {
    if (onCountChange) {
      presenceCallbacks = presenceCallbacks.filter(cb => cb !== onCountChange);
    }
  };
}

export function getOnlineUsersCount(presenceChannel: RealtimeChannel): number {
  const presenceState = presenceChannel.presenceState();
  return Object.keys(presenceState).length;
} 