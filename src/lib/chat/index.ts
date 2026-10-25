"use client";

import { api } from '../api';

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

type Listener = (state: ChatState) => void;

export interface ChatState {
  messages: ChatMessage[];
  online: number;
  loaded: boolean;
  /** messages that arrived after the first load (for unread badges) */
  lastBatch: ChatMessage[];
}

const ACTIVE_INTERVAL = 4000;
const HIDDEN_INTERVAL = 20000;
const MAX_MESSAGES = 200;

/**
 * One poller shared by every subscriber (chat window, unread badge), so the
 * app makes a single request every few seconds no matter how many listen.
 */
class ChatStore {
  private state: ChatState = { messages: [], online: 0, loaded: false, lastBatch: [] };
  private listeners = new Set<Listener>();
  private timer: number | null = null;
  private inFlight = false;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    if (this.listeners.size === 1) this.start();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stop();
    };
  }

  private emit() {
    this.listeners.forEach((l) => l(this.state));
  }

  private start() {
    document.addEventListener('visibilitychange', this.onVisibility);
    this.poll();
  }

  private stop() {
    document.removeEventListener('visibilitychange', this.onVisibility);
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = null;
  }

  private onVisibility = () => {
    if (document.visibilityState === 'visible') this.poll();
  };

  private schedule() {
    if (this.timer) window.clearTimeout(this.timer);
    if (this.listeners.size === 0) return;
    const delay = document.visibilityState === 'visible' ? ACTIVE_INTERVAL : HIDDEN_INTERVAL;
    this.timer = window.setTimeout(() => this.poll(), delay);
  }

  async poll() {
    if (this.inFlight) return;
    this.inFlight = true;
    try {
      const last = this.state.messages[this.state.messages.length - 1];
      const res = await api<{ messages: ChatMessage[]; online: number }>(`/api/chat${last ? `?after=${last.id}` : ''}`);
      const known = new Set(this.state.messages.map((m) => m.id));
      const fresh = res.messages.filter((m) => !known.has(m.id));
      this.state = {
        messages: [...this.state.messages, ...fresh].slice(-MAX_MESSAGES),
        online: res.online,
        loaded: true,
        lastBatch: this.state.loaded ? fresh : [],
      };
      this.emit();
    } catch {
      // network hiccup: keep the current messages and try again later
    } finally {
      this.inFlight = false;
      this.schedule();
    }
  }

  /** Called after a successful send so the sender sees the message immediately. */
  add(message: ChatMessage) {
    if (this.state.messages.some((m) => m.id === message.id)) return;
    this.state = { ...this.state, messages: [...this.state.messages, message].slice(-MAX_MESSAGES), lastBatch: [] };
    this.emit();
  }

  reset() {
    this.state = { messages: [], online: 0, loaded: false, lastBatch: [] };
    if (this.listeners.size) this.poll();
  }
}

export const chatStore = new ChatStore();

export async function sendMessage(message: string): Promise<ChatMessage> {
  const res = await api<{ message: ChatMessage }>('/api/chat', { method: 'POST', json: { message } });
  chatStore.add(res.message);
  return res.message;
}
