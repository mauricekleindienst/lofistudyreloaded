import 'server-only';
import { MongoClient, type Db, type Collection, type Document } from 'mongodb';
import type {
  UserDoc,
  SessionDoc,
  TodoDoc,
  NoteDoc,
  AppointmentDoc,
  PomodoroStatDoc,
  ChatMessageDoc,
  PresenceDoc,
  OAuthStateDoc,
  RateLimitDoc,
  DeckDoc,
  HabitDoc,
} from './models';

// One client per server process. In dev, Next's hot reload would otherwise
// open a new pool on every edit, so the promise is parked on globalThis.
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoIndexesReady?: Promise<void>;
};

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
    });
    globalForMongo._mongoClientPromise = client.connect().catch((err) => {
      // Allow the next request to retry instead of caching a rejected promise forever.
      globalForMongo._mongoClientPromise = undefined;
      throw err;
    });
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  const db = client.db(process.env.MONGODB_DB || undefined);
  if (!globalForMongo._mongoIndexesReady) {
    globalForMongo._mongoIndexesReady = ensureIndexes(db).catch((err) => {
      globalForMongo._mongoIndexesReady = undefined;
      throw err;
    });
  }
  await globalForMongo._mongoIndexesReady;
  return db;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('users').createIndex(
      { 'providers.provider': 1, 'providers.providerId': 1 },
      { unique: true, partialFilterExpression: { 'providers.provider': { $exists: true } } }
    ),
    db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ userId: 1 }),
    db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('todos').createIndex({ userId: 1, position: 1 }),
    db.collection('notes').createIndex({ userId: 1, updatedAt: -1 }),
    db.collection('appointments').createIndex({ userId: 1, date: 1 }),
    db.collection('decks').createIndex({ userId: 1, updatedAt: -1 }),
    db.collection('habits').createIndex({ userId: 1, position: 1 }),
    db.collection('pomodoro_stats').createIndex({ userId: 1, date: 1, category: 1 }, { unique: true }),
    db.collection('pomodoro_stats').createIndex({ date: 1 }),
    db.collection('chat_messages').createIndex({ userId: 1, _id: 1 }),
    db.collection('presence').createIndex({ lastSeen: 1 }, { expireAfterSeconds: 60 }),
    db.collection('oauth_states').createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 }),
    db.collection('rate_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

async function col<T extends Document>(name: string): Promise<Collection<T>> {
  return (await getDb()).collection<T>(name);
}

export const collections = {
  users: () => col<UserDoc>('users'),
  sessions: () => col<SessionDoc>('sessions'),
  todos: () => col<TodoDoc>('todos'),
  notes: () => col<NoteDoc>('notes'),
  appointments: () => col<AppointmentDoc>('appointments'),
  pomodoroStats: () => col<PomodoroStatDoc>('pomodoro_stats'),
  chatMessages: () => col<ChatMessageDoc>('chat_messages'),
  presence: () => col<PresenceDoc>('presence'),
  oauthStates: () => col<OAuthStateDoc>('oauth_states'),
  rateLimits: () => col<RateLimitDoc>('rate_limits'),
  decks: () => col<DeckDoc>('decks'),
  habits: () => col<HabitDoc>('habits'),
};
