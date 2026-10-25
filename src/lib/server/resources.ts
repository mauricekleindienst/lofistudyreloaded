import 'server-only';
import { ObjectId } from 'mongodb';
import type { AppointmentDoc, NoteDoc, TodoDoc } from './models';
import { HttpError, bool, dateStr, oneOf, str, TIME_RE } from './http';

// --- Serializers: Mongo docs -> API JSON (snake_case, string ids) -----------

export const serializeTodo = (t: TodoDoc) => ({
  id: t._id.toHexString(),
  text: t.text,
  completed: t.completed,
  priority: t.priority,
  category: t.category,
  due_date: t.dueDate ?? null,
  position: t.position,
  created_at: t.createdAt.toISOString(),
  updated_at: t.updatedAt.toISOString(),
});

export const serializeNote = (n: NoteDoc) => ({
  id: n._id.toHexString(),
  title: n.title,
  content: n.content,
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
  if (body.color !== undefined) {
    const color = body.color === null ? '' : str(body.color, 'color', { max: 9 })!;
    if (color && !COLOR_RE.test(color)) throw new HttpError(400, 'color must be a hex color');
    out.color = color || undefined;
  }
  if (!partial || body.category !== undefined) out.category = oneOf(body.category, 'category', APPT_CATEGORIES, 'personal');
  if (!partial || body.reminder !== undefined) out.reminder = bool(body.reminder, 'reminder', false);
  return out;
}

export const newId = () => new ObjectId();
