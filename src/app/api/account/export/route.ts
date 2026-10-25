import { collections } from '@/lib/server/mongo';
import { toPublicUser } from '@/lib/server/auth';
import { route, requireUser } from '@/lib/server/http';
import { serializeAppointment, serializeDeck, serializeHabit, serializeNote, serializeTodo } from '@/lib/server/resources';

export const runtime = 'nodejs';

/** GDPR-style export of everything stored for the signed-in user. */
export const GET = route(async () => {
  const user = await requireUser();
  const userId = user._id;
  const [todos, notes, appointments, stats, messages, decks, habits] = await Promise.all([
    collections.todos().then((c) => c.find({ userId }).toArray()),
    collections.notes().then((c) => c.find({ userId }).toArray()),
    collections.appointments().then((c) => c.find({ userId }).toArray()),
    collections.pomodoroStats().then((c) => c.find({ userId }).sort({ date: 1 }).toArray()),
    collections.chatMessages().then((c) => c.find({ userId }).sort({ _id: 1 }).toArray()),
    collections.decks().then((c) => c.find({ userId }).toArray()),
    collections.habits().then((c) => c.find({ userId }).sort({ position: 1 }).toArray()),
  ]);

  const body = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      account: toPublicUser(user),
      todos: todos.map(serializeTodo),
      notes: notes.map(serializeNote),
      appointments: appointments.map(serializeAppointment),
      flashcard_decks: decks.map(serializeDeck),
      habits: habits.map(serializeHabit),
      pomodoro_stats: stats.map((s) => ({
        date: s.date,
        category: s.category,
        pomodoro_count: (s.pomodoroCount ?? 0) + (s.importedCount ?? 0),
        total_focus_time_minutes: (s.focusMinutes ?? 0) + (s.importedMinutes ?? 0),
      })),
      chat_messages: messages.map((m) => ({ message: m.message, created_at: m.createdAt.toISOString() })),
    },
    null,
    2
  );

  const date = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="lofistudy-export-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  });
});
