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

// Shared state for message management
let messageChannel: RealtimeChannel | null = null;
let messageListeners: ((message: ChatMessage) => void)[] = [];
let pollingInterval: NodeJS.Timeout | null = null;
const processedMessageIds = new Set<string>();

/**
 * Ensures a message is only processed once by listeners.
 * Prevents "Duplicate Key" errors in React when Realtime and Polling collide.
 */
function notifyListeners(message: ChatMessage) {
  if (processedMessageIds.has(message.id)) return;
  
  processedMessageIds.add(message.id);
  // Keep the set size manageable (last 200 IDs)
  if (processedMessageIds.size > 200) {
    const firstId = processedMessageIds.values().next().value;
    if (firstId) processedMessageIds.delete(firstId);
  }

  messageListeners.forEach(listener => listener(message));
}

/**
 * Fallback mechanism for when Realtime (WebSockets) is blocked or fails.
 * Fetches latest messages every 5 seconds.
 */
async function startPolling() {
  if (pollingInterval) return;
  
  console.log('Chat: Realtime unavailable or disconnected. Starting polling fallback...');
  
  pollingInterval = setInterval(async () => {
    try {
      const messages = await getMessages(20);
      messages.forEach(msg => notifyListeners(msg));
    } catch (e) {
      console.warn('Chat polling error:', e);
    }
  }, 5000);
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('Chat: Stopping polling fallback.');
  }
}

export function subscribeToMessages(callback: (message: ChatMessage) => void): () => void {
  // Add listener
  messageListeners.push(callback);

  // Initial fetch to populate known IDs (prevents duplicates on startup)
  getMessages(50).then(messages => {
    messages.forEach(msg => {
      if (!processedMessageIds.has(msg.id)) {
        processedMessageIds.add(msg.id);
      }
    });
  });

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
          notifyListeners(payload.new as ChatMessage);
        }
      )
      .subscribe((status) => {
        console.log(`Chat connection status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          stopPolling(); // Realtime is working!
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          startPolling(); // Fallback to polling
          messageChannel = null; // Prepare for possible redo
        }
      });
  }

  // Return cleanup function
  return () => {
    messageListeners = messageListeners.filter(l => l !== callback);
    if (messageListeners.length === 0) {
      if (messageChannel) {
        messageChannel.unsubscribe();
        messageChannel = null;
      }
      stopPolling();
    }
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