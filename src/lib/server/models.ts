import type { ObjectId } from 'mongodb';

export type OAuthProvider = 'github' | 'discord' | 'google';

export interface UserDoc {
  _id: ObjectId;
  email: string;
  passwordHash?: string;
  fullName: string;
  avatarUrl?: string;
  providers?: { provider: OAuthProvider; providerId: string }[];
  settings: Record<string, unknown>;
  /** last recorded focus session; sessions can't be logged faster than real time */
  lastPomodoroAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDoc {
  _id: ObjectId;
  tokenHash: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
  userAgent?: string;
}

export interface TodoDoc {
  _id: ObjectId;
  userId: ObjectId;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'study' | 'health';
  dueDate?: string;
  position: number;
  /** focus sessions spent on this task */
  pomodoros?: number;
  /** planned focus sessions */
  estimate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteDoc {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  content: string;
  pinned?: boolean;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  /** Leitner box 0-5; higher = known better */
  box: number;
  /** next review day, YYYY-MM-DD */
  due: string;
}

export interface DeckDoc {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  color?: string;
  cards: FlashCard[];
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitDoc {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  emoji: string;
  color?: string;
  /** days the habit was done, YYYY-MM-DD, newest last (capped) */
  days: string[];
  /** times per week the user aims for */
  target: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentDoc {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  description?: string;
  date: string;
  time?: string;
  color?: string;
  category: 'personal' | 'work' | 'health' | 'study' | 'other';
  reminder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PomodoroStatDoc {
  _id: ObjectId;
  userId: ObjectId;
  /** Local calendar day of the user, YYYY-MM-DD */
  date: string;
  category: string;
  pomodoroCount: number;
  focusMinutes: number;
  /** sessions brought over from guest mode: shown in your own stats, never on the leaderboard */
  importedCount?: number;
  importedMinutes?: number;
  updatedAt: Date;
}

export interface ChatMessageDoc {
  _id: ObjectId;
  userId: ObjectId;
  username: string;
  message: string;
  createdAt: Date;
}

export interface PresenceDoc {
  _id: string;
  lastSeen: Date;
}

export interface OAuthStateDoc {
  _id: string;
  provider: OAuthProvider;
  codeVerifier: string;
  createdAt: Date;
}

export interface RateLimitDoc {
  _id: string;
  count: number;
  expiresAt: Date;
}
