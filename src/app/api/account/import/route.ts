import { ObjectId } from 'mongodb';
import { collections } from '@/lib/server/mongo';
import { route, json, readJson, requireUser, rateLimit, HttpError } from '@/lib/server/http';
import { parseAppointment, parseDeck, parseHabit, parseNote, parseTodo } from '@/lib/server/resources';

export const runtime = 'nodejs';

const MAX_ITEMS = 500;

function list(value: unknown, field: string): Record<string, unknown>[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new HttpError(400, `${field} must be an array`);
  return value.slice(0, MAX_ITEMS).filter((v) => v && typeof v === 'object') as Record<string, unknown>[];
}

/**
 * Moves data a visitor created before signing in (kept in localStorage) into the
 * account. Invalid items are skipped rather than failing the whole import.
 */
export const POST = route(async (request) => {
  const user = await requireUser();
  await rateLimit(`import:${user._id.toHexString()}`, 5, 3600);
  const body = await readJson(request);
  const now = new Date();
  const userId = user._id;

  const safe = <T,>(fn: () => T): T | null => {
    try {
      return fn();
    } catch {
      return null;
    }
  };

  const todosCol = await collections.todos();
  const last = await todosCol.find({ userId }).sort({ position: -1 }).limit(1).next();
  let position = last?.position ?? 0;

  const todos = list(body.todos, 'todos')
    .map((t) => safe(() => parseTodo(t, false)))
    .filter(Boolean)
    .map((t) => ({ ...t!, _id: new ObjectId(), userId, position: ++position, createdAt: now, updatedAt: now }));
  const notes = list(body.notes, 'notes')
    .map((n) => safe(() => parseNote(n, false)))
    .filter((n) => n && (n.title || n.content))
    .map((n) => ({ ...n!, _id: new ObjectId(), userId, createdAt: now, updatedAt: now }));
  const appointments = list(body.appointments, 'appointments')
    .map((a) => safe(() => parseAppointment(a, false)))
    .filter(Boolean)
    .map((a) => ({ ...a!, _id: new ObjectId(), userId, createdAt: now, updatedAt: now }));

  const decks = list(body.decks, 'decks')
    .slice(0, 200)
    .map((d) => safe(() => parseDeck(d, false)))
    .filter(Boolean)
    .map((d) => ({ ...d!, _id: new ObjectId(), userId, createdAt: now, updatedAt: now }));
  const habitsCol = await collections.habits();
  const lastHabit = await habitsCol.find({ userId }).sort({ position: -1 }).limit(1).next();
  let habitPosition = lastHabit?.position ?? 0;
  const habits = list(body.habits, 'habits')
    .slice(0, 50)
    .map((h) => safe(() => parseHabit(h, false)))
    .filter(Boolean)
    .map((h) => ({ ...h!, _id: new ObjectId(), userId, position: ++habitPosition, createdAt: now, updatedAt: now }));

  if (todos.length) await todosCol.insertMany(todos as never[]);
  if (decks.length) await (await collections.decks()).insertMany(decks as never[]);
  if (habits.length) await habitsCol.insertMany(habits as never[]);
  if (notes.length) await (await collections.notes()).insertMany(notes as never[]);
  if (appointments.length) await (await collections.appointments()).insertMany(appointments as never[]);

  return json({
    imported: { todos: todos.length, notes: notes.length, appointments: appointments.length, decks: decks.length, habits: habits.length },
  });
});
