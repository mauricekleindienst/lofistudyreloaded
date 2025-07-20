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
      console.error('Error sending message:', error);
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

export function subscribeToMessages(callback: (message: ChatMessage) => void): () => void {
  const channel = supabase
    .channel('chat_messages_channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      },
      (payload) => {
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

export function trackPresence(userId: string): () => void {
  const presenceChannel = supabase
    .channel('online_users')
    .on('presence', { event: 'sync' }, () => {
      // This is handled by the component
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ user_id: userId });
      }
    });
  
  return () => {
    supabase.removeChannel(presenceChannel);
  };
}

export function getOnlineUsersCount(presenceChannel: RealtimeChannel): number {
  const presenceState = presenceChannel.presenceState();
  return Object.keys(presenceState).length;
} 