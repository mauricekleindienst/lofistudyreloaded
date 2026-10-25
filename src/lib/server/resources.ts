import 'server-only';
import { ObjectId } from 'mongodb';
import type { AppointmentDoc, DeckDoc, FlashCard, HabitDoc, NoteDoc, TodoDoc } from './models';
import { HttpError, bool, dateStr, int, oneOf, str, TIME_RE } from './http';

// --- Serializers: Mongo docs -> API JSON (snake_case, string ids) -----------

export const serializeTodo = (t: TodoDoc) => ({
  id: t._id.toHexString(),
  text: t.text,
  completed: t.completed,
  priority: t.priority,
  category: t.category,
  due_date: t.dueDate ?? null,
  position: t.position,
  pomodoros: t.pomodoros ?? 0,
  estimate: t.estimate ?? 0,
  created_at: t.createdAt.toISOString(),
  updated_at: t.updatedAt.toISOString(),
});

export const serializeNote = (n: NoteDoc) => ({
  id: n._id.toHexString(),
  title: n.title,
  content: n.content,
  pinned: Boolean(n.pinned),
  color: n.color ?? '',
  created_at: n.createdAt.toISOString(),
  updated_at: n.updatedAt.toISOString(),
});

export const serializeAppointment = (a: AppointmentDoc) => ({
  id: a._id.toHexString(),
  title: a.title,
  description: a.description ?? '',
  date: a.date,
  time: a.time ?? '',
  color: a.color ?? '',
  category: a.category,
  reminder: a.reminder,
  created_at: a.createdAt.toISOString(),
  updated_at: a.updatedAt.toISOString(),
});

export const serializeDeck = (d: DeckDoc) => ({
  id: d._id.toHexString(),
  title: d.title,
  color: d.color ?? '',
  cards: d.cards,
  created_at: d.createdAt.toISOString(),
  updated_at: d.updatedAt.toISOString(),
});

export const serializeHabit = (h: HabitDoc) => ({
  id: h._id.toHexString(),
  name: h.name,
  emoji: h.emoji,
  color: h.color ?? '',
  days: h.days,
  target: h.target,
  position: h.position,
  created_at: h.createdAt.toISOString(),
  updated_at: h.updatedAt.toISOString(),
});

// --- Input parsers ----------------------------------------------------------

const TODO_PRIORITIES = ['low', 'medium', 'high'] as const;
const TODO_CATEGORIES = ['work', 'personal', 'study', 'health'] as const;
const APPT_CATEGORIES = ['personal', 'work', 'health', 'study', 'other'] as const;
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

type Body = Record<string, unknown>;

export function parseTodo(body: Body, partial: boolean) {
  const out: Partial<Omit<TodoDoc, '_id' | 'userId' | 'createdAt'>> = {};
  if (!partial || body.text !== undefined) out.text = str(body.text, 'Task', { max: 500, min: 1 });
  if (!partial || body.completed !== undefined) out.completed = bool(body.completed, 'completed', false);
  if (!partial || body.priority !== undefined) out.priority = oneOf(body.priority, 'priority', TODO_PRIORITIES, 'medium');
  if (!partial || body.category !== undefined) out.category = oneOf(body.category, 'category', TODO_CATEGORIES, 'work');
  if (body.due_date !== undefined) out.dueDate = dateStr(body.due_date, 'due_date', true);
  if (body.pomodoros !== undefined) out.pomodoros = int(body.pomodoros, 'pomodoros', 0, 9999);
  if (body.estimate !== undefined) out.estimate = int(body.estimate, 'estimate', 0, 99);
  if (body.position !== undefined) {
    if (typeof body.position !== 'number' || !Number.isFinite(body.position)) throw new HttpError(400, 'position must be a number');
    out.position = body.position;
  }
  return out;
}

export function parseNote(body: Body, partial: boolean) {
  const out: Partial<Omit<NoteDoc, '_id' | 'userId' | 'createdAt'>> = {};
  if (!partial || body.title !== undefined) out.title = str(body.title ?? '', 'Title', { max: 200 }) ?? '';
  if (!partial || body.content !== undefined) out.content = str(body.content ?? '', 'Content', { max: 100_000 }) ?? '';
  if (body.pinned !== undefined) out.pinned = bool(body.pinned, 'pinned');
  if (body.color !== undefined) out.color = parseColor(body.color);
  return out;
}

function parseColor(value: unknown): string | undefined {
  const color = value === null ? '' : str(value, 'color', { max: 9 })!;
  if (color && !COLOR_RE.test(color)) throw new HttpError(400, 'color must be a hex color');
  return color || undefined;
}

const MAX_CARDS = 2000;

function parseCards(value: unknown): FlashCard[] {
  if (!Array.isArray(value)) throw new HttpError(400, 'cards must be an array');
  if (value.length > MAX_CARDS) throw new HttpError(400, `A deck can hold at most ${MAX_CARDS} cards`);
  const seen = new Set<string>();
  return value.map((raw, i) => {
    if (!raw || typeof raw !== 'object') throw new HttpError(400, `Card ${i + 1} is invalid`);
    const c = raw as Record<string, unknown>;
    let id = typeof c.id === 'string' && /^[\w-]{1,40}$/.test(c.id) ? c.id : new ObjectId().toHexString();
    if (seen.has(id)) id = new ObjectId().toHexString();
    seen.add(id);
    return {
      id,
      front: str(c.front, `Card ${i + 1} front`, { max: 2000, min: 1 })!,
      back: str(c.back ?? '', `Card ${i + 1} back`, { max: 4000 }) ?? '',
      box: int(c.box, 'box', 0, 5, 0),
      due: dateStr(c.due, 'due', true) ?? new Date().toISOString().slice(0, 10),
    };
  });
}

export function parseDeck(body: Body, partial: boolean) {
  const out: Partial<Omit<DeckDoc, '_id' | 'userId' | 'createdAt'>> = {};
  if (!partial || body.title !== undefined) out.title = str(body.title, 'Title', { max: 120, min: 1 });
  if (body.color !== undefined) out.color = parseColor(body.color);
  if (!partial || body.cards !== undefined) out.cards = body.cards === undefined ? [] : parseCards(body.cards);
  return out;
}

const MAX_HABIT_DAYS = 800;

export function parseHabit(body: Body, partial: boolean) {
  const out: Partial<Omit<HabitDoc, '_id' | 'userId' | 'createdAt'>> = {};
  if (!partial || body.name !== undefined) out.name = str(body.name, 'Name', { max: 80, min: 1 });
  if (!partial || body.emoji !== undefined) out.emoji = str(body.emoji ?? '✅', 'emoji', { max: 16, min: 1 });
  if (body.color !== undefined) out.color = parseColor(body.color);
  if (!partial || body.target !== undefined) out.target = int(body.target, 'target', 1, 7, 7);
  if (!partial || body.days !== undefined) {
    const days = body.days ?? [];
    if (!Array.isArray(days)) throw new HttpError(400, 'days must be an array');
    const valid = [...new Set(days.map((d) => dateStr(d, 'day')!))].sort();
    out.days = valid.slice(-MAX_HABIT_DAYS);
  }
  if (body.position !== undefined) {
    if (typeof body.position !== 'number' || !Number.isFinite(body.position)) throw new HttpError(400, 'position must be a number');
    out.position = body.position;
  }
  return out;
}

export function parseAppointment(body: Body, partial: boolean) {
  const out: Partial<Omit<AppointmentDoc, '_id' | 'userId' | 'createdAt'>> = {};
  if (!partial || body.title !== undefined) out.title = str(body.title, 'Title', { max: 200, min: 1 });
  if (!partial || body.date !== undefined) out.date = dateStr(body.date, 'date');
  if (body.description !== undefined) out.description = str(body.description ?? '', 'Description', { max: 2000 }) ?? '';
  if (body.time !== undefined) {
    const time = body.time === null ? '' : str(body.time, 'time', { max: 5 })!;
    if (time && !TIME_RE.test(time)) throw new HttpError(400, 'time must be HH:MM');
    out.time = time || undefined;
  }
  if (body.color !== undefined) out.color = parseColor(body.color);
  if (!partial || body.category !== undefined) out.category = oneOf(body.category, 'category', APPT_CATEGORIES, 'personal');
  if (!partial || body.reminder !== undefined) out.reminder = bool(body.reminder, 'reminder', false);
  return out;
}

export const newId = () => new ObjectId();
