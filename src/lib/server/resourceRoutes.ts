import 'server-only';
import { collections } from './mongo';
import { crud } from './crud';
import {
  parseAppointment,
  parseDeck,
  parseHabit,
  parseNote,
  parseTodo,
  serializeAppointment,
  serializeDeck,
  serializeHabit,
  serializeNote,
  serializeTodo,
} from './resources';

export const todoRoutes = crud({
  collection: collections.todos,
  parse: parseTodo,
  serialize: serializeTodo,
  sort: { position: 1, createdAt: 1 },
  maxPerUser: 2000,
  label: 'tasks',
  async onCreate(col, userId) {
    const last = await col.find({ userId }).sort({ position: -1 }).limit(1).next();
    return { position: (last?.position ?? 0) + 1 };
  },
});

export const noteRoutes = crud({
  collection: collections.notes,
  parse: parseNote,
  serialize: serializeNote,
  sort: { updatedAt: -1 },
  maxPerUser: 1000,
  label: 'notes',
});

export const appointmentRoutes = crud({
  collection: collections.appointments,
  parse: parseAppointment,
  serialize: serializeAppointment,
  sort: { date: 1, time: 1 },
  maxPerUser: 5000,
  label: 'appointments',
});

export const deckRoutes = crud({
  collection: collections.decks,
  parse: parseDeck,
  serialize: serializeDeck,
  sort: { updatedAt: -1 },
  maxPerUser: 200,
  label: 'decks',
});

export const habitRoutes = crud({
  collection: collections.habits,
  parse: parseHabit,
  serialize: serializeHabit,
  sort: { position: 1, createdAt: 1 },
  maxPerUser: 50,
  label: 'habits',
  async onCreate(col, userId) {
    const last = await col.find({ userId }).sort({ position: -1 }).limit(1).next();
    return { position: (last?.position ?? 0) + 1 };
  },
});
