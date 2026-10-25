"use client";

import { api, toast, localDate, ApiError } from './api';

// Types shared by the UI. Ids are strings everywhere: Mongo ObjectIds when
// signed in, "local-…" ids for guests whose data lives in localStorage.

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'study' | 'health';
  due_date?: string | null;
  position?: number;
  /** focus sessions spent on this task */
  pomodoros?: number;
  /** planned focus sessions (0 = no estimate) */
  estimate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned?: boolean;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  /** Leitner box 0-5 */
  box: number;
  /** next review day, YYYY-MM-DD */
  due: string;
}

export interface Deck {
  id: string;
  title: string;
  color?: string;
  cards: FlashCard[];
  created_at?: string;
  updated_at?: string;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color?: string;
  /** YYYY-MM-DD days the habit was done */
  days: string[];
  /** times per week */
  target: number;
  position?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  color?: string;
  category?: 'personal' | 'work' | 'health' | 'study' | 'other';
  reminder?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PomodoroStats {
  date: string;
  category: string;
  pomodoro_count: number;
  total_focus_time_minutes: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url: string | null;
  totalSessions: number;
  totalFocusTime: number;
  rank: number;
  isMe: boolean;
}

export interface UserSettings {
  selectedBackground?: string;
  pomodoroDurations?: { pomodoro: number; shortBreak: number; longBreak: number };
  pomodoroVolume?: number;
  pomodoroMuted?: boolean;
  pomodoroAutoBreaks?: boolean;
  pomodoroAutoFocus?: boolean;
  pomodoroLongEvery?: number;
  pomodoroGoal?: number;
  backgroundMotion?: boolean;
  backgroundDim?: number;
  [key: string]: unknown;
}

type New<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

// --- guest storage ------------------------------------------------------------

const KEY = {
  todos: 'lofi:guest:todos',
  notes: 'lofi:guest:notes',
  appointments: 'lofi:guest:appointments',
  decks: 'lofi:guest:decks',
  habits: 'lofi:guest:habits',
  pomodoro: 'lofi:guest:pomodoro',
  settings: 'lofi:settings',
} as const;

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    toast('Could not save locally — browser storage is full or blocked.', 'warning');
  }
}

function localId() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// One-time migration of keys written by older versions of the app.
function migrateLegacyKeys() {
  try {
    const legacyNotes = localStorage.getItem('lofi-notes');
    if (legacyNotes && !localStorage.getItem(KEY.notes)) {
      localStorage.setItem(KEY.notes, legacyNotes);
    }
    localStorage.removeItem('lofi-notes');
    const legacyBg = localStorage.getItem('selectedBackground');
    if (legacyBg) {
      const s = readLocal<UserSettings>(KEY.settings, {});
      if (!s.selectedBackground) writeLocal(KEY.settings, { ...s, selectedBackground: legacyBg });
      localStorage.removeItem('selectedBackground');
    }
  } catch {
    // storage unavailable
  }
}

function localCollection<T extends { id: string; created_at?: string; updated_at?: string }>(key: string) {
  return {
    // Guard against hand-edited or corrupt storage: anything but an array of objects is ignored.
    all: (): T[] => {
      const items = readLocal<unknown>(key, []);
      return Array.isArray(items) ? (items.filter((i) => i && typeof i === 'object' && typeof (i as T).id === 'string') as T[]) : [];
    },
    create(item: New<T>): T {
      const now = new Date().toISOString();
      const doc = { ...item, id: localId(), created_at: now, updated_at: now } as unknown as T;
      writeLocal(key, [...this.all(), doc]);
      return doc;
    },
    update(id: string, changes: Partial<T>): T | null {
      let updated: T | null = null;
      const next = this.all().map((d) => {
        if (d.id !== id) return d;
        updated = { ...d, ...changes, id, updated_at: new Date().toISOString() };
        return updated;
      });
      writeLocal(key, next);
      return updated;
    },
    remove(id: string) {
      writeLocal(key, this.all().filter((d) => d.id !== id));
      return true;
    },
    removeMany(ids: Set<string>) {
      writeLocal(key, this.all().filter((d) => !ids.has(d.id)));
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}

function localStats(): PomodoroStats[] {
  const items = readLocal<unknown>(KEY.pomodoro, []);
  return Array.isArray(items) ? (items.filter((s) => s && typeof s === 'object' && typeof s.date === 'string') as PomodoroStats[]) : [];
}

const local = {
  todos: localCollection<Todo>(KEY.todos),
  notes: localCollection<Note>(KEY.notes),
  appointments: localCollection<Appointment>(KEY.appointments),
  decks: localCollection<Deck>(KEY.decks),
  habits: localCollection<Habit>(KEY.habits),
};

function reportError(action: string, err: unknown) {
  const message = err instanceof ApiError ? err.message : 'Something went wrong';
  console.error(`[db] ${action}:`, err);
  toast(`${action} failed: ${message}`, 'error');
}

// --- the service ----------------------------------------------------------------

class DatabaseService {
  private authenticated = false;

  constructor() {
    if (typeof window !== 'undefined') migrateLegacyKeys();
  }

  /** Called by AuthProvider whenever the session changes. */
  setAuthenticated(value: boolean) {
    this.authenticated = value;
  }

  get isAuthenticated() {
    return this.authenticated;
  }

  // Generic remote-or-local CRUD, so every resource behaves identically.
  private async list<T extends { id: string }>(path: string, store: ReturnType<typeof localCollection<T>>, label: string) {
    if (!this.authenticated) return store.all();
    try {
      return (await api<{ items: T[] }>(path)).items;
    } catch (err) {
      reportError(`Loading ${label}`, err);
      return [];
    }
  }

  private async create<T extends { id: string }>(path: string, store: ReturnType<typeof localCollection<T>>, item: New<T>, label: string) {
    if (!this.authenticated) return store.create(item);
    try {
      return (await api<{ item: T }>(path, { method: 'POST', json: item })).item;
    } catch (err) {
      reportError(`Saving ${label}`, err);
      return null;
    }
  }

  private async update<T extends { id: string }>(path: string, store: ReturnType<typeof localCollection<T>>, id: string, changes: Partial<T>, label: string) {
    if (!this.authenticated) return store.update(id, changes);
    try {
      return (await api<{ item: T }>(`${path}/${id}`, { method: 'PATCH', json: changes })).item;
    } catch (err) {
      reportError(`Updating ${label}`, err);
      return null;
    }
  }

  private async remove<T extends { id: string }>(path: string, store: ReturnType<typeof localCollection<T>>, id: string, label: string) {
    if (!this.authenticated) return store.remove(id);
    try {
      await api(`${path}/${id}`, { method: 'DELETE' });
      return true;
    } catch (err) {
      reportError(`Deleting ${label}`, err);
      return false;
    }
  }

  getTodos = () => this.list<Todo>('/api/todos', local.todos, 'tasks');
  saveTodo = (t: New<Todo>) => this.create<Todo>('/api/todos', local.todos, t, 'task');
  updateTodo = (id: string, c: Partial<Todo>) => this.update<Todo>('/api/todos', local.todos, id, c, 'task');
  deleteTodo = (id: string) => this.remove<Todo>('/api/todos', local.todos, id, 'task');

  getNotes = () => this.list<Note>('/api/notes', local.notes, 'notes');
  saveNote = (n: New<Note>) => this.create<Note>('/api/notes', local.notes, n, 'note');
  updateNote = (id: string, c: Partial<Note>) => this.update<Note>('/api/notes', local.notes, id, c, 'note');
  deleteNote = (id: string) => this.remove<Note>('/api/notes', local.notes, id, 'note');

  getAppointments = () => this.list<Appointment>('/api/appointments', local.appointments, 'appointments');
  saveAppointment = (a: New<Appointment>) => this.create<Appointment>('/api/appointments', local.appointments, a, 'appointment');
  updateAppointment = (id: string, c: Partial<Appointment>) =>
    this.update<Appointment>('/api/appointments', local.appointments, id, c, 'appointment');
  deleteAppointment = (id: string) => this.remove<Appointment>('/api/appointments', local.appointments, id, 'appointment');

  getDecks = () => this.list<Deck>('/api/decks', local.decks, 'flashcards');
  saveDeck = (d: New<Deck>) => this.create<Deck>('/api/decks', local.decks, d, 'deck');
  updateDeck = (id: string, c: Partial<Deck>) => this.update<Deck>('/api/decks', local.decks, id, c, 'deck');
  deleteDeck = (id: string) => this.remove<Deck>('/api/decks', local.decks, id, 'deck');

  getHabits = () => this.list<Habit>('/api/habits', local.habits, 'habits');
  saveHabit = (h: New<Habit>) => this.create<Habit>('/api/habits', local.habits, h, 'habit');
  updateHabit = (id: string, c: Partial<Habit>) => this.update<Habit>('/api/habits', local.habits, id, c, 'habit');
  deleteHabit = (id: string) => this.remove<Habit>('/api/habits', local.habits, id, 'habit');

  // --- pomodoro ---

  /** date: the local day the session ended (defaults to today) */
  async recordPomodoro(category: string, minutes: number, date = localDate()): Promise<boolean> {
    if (!this.authenticated) {
      const all = localStats();
      const existing = all.find((s) => s.date === date && s.category === category);
      if (existing) {
        existing.pomodoro_count += 1;
        existing.total_focus_time_minutes += minutes;
      } else {
        all.push({ date, category, pomodoro_count: 1, total_focus_time_minutes: minutes });
      }
      writeLocal(KEY.pomodoro, all);
      return true;
    }
    try {
      await api('/api/pomodoro', { method: 'POST', json: { date, category, minutes } });
      return true;
    } catch (err) {
      reportError('Saving your focus session', err);
      return false;
    }
  }

  /** from = YYYY-MM-DD (inclusive), undefined = all time */
  async getPomodoroStats(from?: string): Promise<PomodoroStats[]> {
    if (!this.authenticated) {
      return localStats().filter((s) => !from || s.date >= from);
    }
    try {
      return (await api<{ stats: PomodoroStats[] }>(`/api/pomodoro${from ? `?from=${from}` : ''}`)).stats;
    } catch (err) {
      reportError('Loading statistics', err);
      return [];
    }
  }

  async getLeaderboard(from: string | undefined, sort: 'sessions' | 'time'): Promise<LeaderboardEntry[]> {
    const params = new URLSearchParams({ sort });
    if (from) params.set('from', from);
    try {
      return (await api<{ entries: LeaderboardEntry[] }>(`/api/leaderboard?${params}`)).entries;
    } catch (err) {
      reportError('Loading leaderboard', err);
      return [];
    }
  }

  // --- settings (always cached locally so the UI can start instantly) ---

  getLocalSettings(): UserSettings {
    const s = readLocal<unknown>(KEY.settings, {});
    return s && typeof s === 'object' && !Array.isArray(s) ? (s as UserSettings) : {};
  }

  async saveSettings(changes: Partial<UserSettings>): Promise<void> {
    writeLocal(KEY.settings, { ...this.getLocalSettings(), ...changes });
    if (!this.authenticated) return;
    try {
      await api('/api/profile', { method: 'PATCH', json: { settings: changes } });
    } catch (err) {
      console.warn('[db] saving settings to account failed', err);
    }
  }

  // --- guest -> account ---

  hasGuestData(): boolean {
    return Object.values(local).some((store) => store.all().length > 0) || localStats().length > 0;
  }

  private importing: Promise<number> | null = null;

  /** After sign-in: move anything created as a guest into the account (one run at a time). */
  importGuestData(): Promise<number> {
    if (!this.importing) {
      this.importing = this.runImport().finally(() => {
        this.importing = null;
      });
    }
    return this.importing;
  }

  private async runImport(): Promise<number> {
    if (!this.authenticated || !this.hasGuestData()) return 0;
    const strip = <T extends { id: string }>(items: T[]) =>
      items.map((item) => {
        const rest: Partial<T> = { ...item };
        delete rest.id;
        return rest;
      });
    // Snapshot what is sent; only those items are removed afterwards, so anything created
    // while the request is in flight stays on the device.
    const sent = Object.fromEntries(Object.entries(local).map(([k, store]) => [k, store.all()])) as {
      [K in keyof typeof local]: ReturnType<(typeof local)[K]['all']>;
    };
    const stats = localStats();
    try {
      const res = await api<{ imported: Record<string, number> }>('/api/account/import', {
        method: 'POST',
        json: {
          todos: strip(sent.todos),
          notes: strip(sent.notes),
          appointments: strip(sent.appointments),
          decks: strip(sent.decks),
          habits: strip(sent.habits),
          pomodoro: stats,
        },
      });
      (Object.keys(local) as (keyof typeof local)[]).forEach((k) => local[k].removeMany(new Set(sent[k].map((i) => i.id))));
      if (stats.length) writeLocal(KEY.pomodoro, []);
      return Object.values(res.imported).reduce((a, b) => a + b, 0);
    } catch (err) {
      reportError('Importing your guest data', err);
      return 0;
    }
  }
}

export const db = new DatabaseService();
