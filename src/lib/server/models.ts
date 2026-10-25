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
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteDoc {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  content: string;
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
