import { ObjectId } from 'mongodb';
import type { PomodoroStatDoc } from '@/lib/server/models';
import { collections } from '@/lib/server/mongo';
import { route, json, readJson, requireUser, dateStr, str, rateLimit, HttpError } from '@/lib/server/http';

export const runtime = 'nodejs';

const serialize = (s: PomodoroStatDoc) => ({
  date: s.date,
  category: s.category,
  pomodoro_count: (s.pomodoroCount ?? 0) + (s.importedCount ?? 0),
  total_focus_time_minutes: (s.focusMinutes ?? 0) + (s.importedMinutes ?? 0),
});

/** GET ?from=YYYY-MM-DD (the client's local date); omit for all time. */
export const GET = route(async (request) => {
  const user = await requireUser();
  const from = dateStr(new URL(request.url).searchParams.get('from') ?? undefined, 'from', true);
  const col = await collections.pomodoroStats();
  const docs = await col
    .find({ userId: user._id, ...(from ? { date: { $gte: from } } : {}) })
    .sort({ date: -1 })
    .limit(5000)
    .toArray();
  return json({ stats: docs.map(serialize) });
});

/** Record one finished focus session. Atomic upsert, so two tabs can't lose counts. */
export const POST = route(async (request) => {
  const user = await requireUser();
  await rateLimit(`pomodoro:${user._id.toHexString()}`, 60, 3600);
  const body = await readJson(request);
  const date = dateStr(body.date, 'date')!;
  const category = str(body.category ?? 'Other', 'category', { max: 30, min: 1 })!;
  const minutes = body.minutes;
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1 || minutes > 180) {
    throw new HttpError(400, 'minutes must be between 1 and 180');
  }

  // Sanity: the client's local date can be at most one day off the server's UTC date.
  const diffDays = Math.abs(Date.parse(`${date}T12:00:00Z`) - Date.now()) / 86_400_000;
  if (diffDays > 2) throw new HttpError(400, 'date is out of range');

  // Real time must have passed since the previous session (80 % leeway for clock skew and
  // shortened sessions), and a day can hold at most 24 h — otherwise the leaderboard is a
  // matter of how fast someone can call this endpoint.
  const now = new Date();
  const users = await collections.users();
  const gate = await users.updateOne(
    {
      _id: user._id,
      $or: [{ lastPomodoroAt: { $exists: false } }, { lastPomodoroAt: { $lte: new Date(now.getTime() - minutes * 48_000) } }],
    },
    { $set: { lastPomodoroAt: now } }
  );
  if (gate.matchedCount === 0) throw new HttpError(429, 'That focus session ended too soon after the previous one');

  const col = await collections.pomodoroStats();
  const [day] = await col
    .aggregate<{ minutes: number }>([{ $match: { userId: user._id, date } }, { $group: { _id: null, minutes: { $sum: '$focusMinutes' } } }])
    .toArray();
  if ((day?.minutes ?? 0) + minutes > 1440) throw new HttpError(400, 'A day only has 24 hours of focus time');

  const doc = await col.findOneAndUpdate(
    { userId: user._id, date, category },
    {
      $inc: { pomodoroCount: 1, focusMinutes: Math.round(minutes) },
      $set: { updatedAt: new Date() },
      $setOnInsert: { _id: new ObjectId() },
    },
    { upsert: true, returnDocument: 'after' }
  );
  return json({ stat: serialize(doc!) });
});
