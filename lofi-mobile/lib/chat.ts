import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

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
    console.error('Failed to send message:', error);
    return null;
  }
}

export async function getMessages(limit = 50): Promise<ChatMessage[]> {
  try {
    // Fetch newest 50 messages
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading messages:', error);
      return [];
    }

    // Since we use an inverted FlatList, we want the newest message at index 0.
    // The query returns [newest, 2nd newest, ..., oldest].
    // This is exactly what we want for an inverted list (index 0 is bottom).
    // So we do NOT need to reverse it.
    
    return data || [];
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  }
}

// Shared channel and listener management
let messageChannel: RealtimeChannel | null = null;
let messageListeners: ((message: ChatMessage) => void)[] = [];

export function subscribeToMessages(callback: (message: ChatMessage) => void): () => void {
  messageListeners.push(callback);

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
          messageListeners.forEach(listener => listener(newMessage));
        }
      )
      .subscribe((status) => {
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          messageChannel = null;
        }
      });
  }

  return () => {
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
        if (!presenceChannel) return;
        try {
          const presenceState = presenceChannel.presenceState();
          const count = Object.keys(presenceState).length;
          presenceCallbacks.forEach(cb => cb(count));
        } catch (e) {
           console.warn("Sync error:", e);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && presenceChannel) {
          try {
             await presenceChannel.track({ user_id: userId });
          } catch(e) {
             console.warn("Track error:", e);
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          presenceChannel = null;
        }
      });
  } else {
    // If already subscribed, immediately trigger the callback
    // Check if channel is actually subscribed before accessing state
    if (presenceChannel.state === 'closed' || presenceChannel.state === 'errored') {
       // Re-subscribe logic could go here, but for now we just return
       return () => {};
    }
    
    try {
        const presenceState = presenceChannel.presenceState();
        const count = Object.keys(presenceState).length;
        if (onCountChange) onCountChange(count);
    } catch (e) {
        console.warn("Error accessing presence state:", e);
    }
  }

  return () => {
    if (onCountChange) {
      presenceCallbacks = presenceCallbacks.filter(cb => cb !== onCountChange);
    }
  };
}
