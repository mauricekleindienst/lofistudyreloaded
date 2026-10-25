import type { ObjectId } from 'mongodb';
import { collections } from '@/lib/server/mongo';
import { getCurrentUser } from '@/lib/server/auth';
import { route, json, dateStr } from '@/lib/server/http';

export const runtime = 'nodejs';

interface Row {
  _id: ObjectId;
  sessions: number;
  minutes: number;
}

/** GET ?from=YYYY-MM-DD&sort=sessions|time — top 50, plus the caller's own row. */
export const GET = route(async (request) => {
  const params = new URL(request.url).searchParams;
  const from = dateStr(params.get('from') ?? undefined, 'from', true);
  const sortBy = params.get('sort') === 'time' ? 'minutes' : 'sessions';
  const me = await getCurrentUser();

  const col = await collections.pomodoroStats();
  const grouped = await col
    .aggregate<Row>([
      ...(from ? [{ $match: { date: { $gte: from } } }] : []),
      { $group: { _id: '$userId', sessions: { $sum: '$pomodoroCount' }, minutes: { $sum: '$focusMinutes' } } },
      { $sort: sortBy === 'minutes' ? { minutes: -1, sessions: -1 } : { sessions: -1, minutes: -1 } },
    ])
    .toArray();

  const ranked = grouped.map((row, i) => ({ ...row, rank: i + 1 }));
  const top = ranked.slice(0, 50);
  const mine = me ? ranked.find((r) => r._id.equals(me._id)) : undefined;
  if (mine && mine.rank > 50) top.push(mine);

  const users = await collections.users();
  const names = new Map(
    (await users.find({ _id: { $in: top.map((r) => r._id) } }, { projection: { fullName: 1, avatarUrl: 1 } }).toArray()).map(
      (u) => [u._id.toHexString(), u]
    )
  );

  return json({
    entries: top.map((r) => {
      const id = r._id.toHexString();
      const u = names.get(id);
      return {
        id,
        name: u?.fullName || `Student #${id.slice(-4)}`,
        avatar_url: u?.avatarUrl ?? null,
        totalSessions: r.sessions,
        totalFocusTime: r.minutes,
        rank: r.rank,
        isMe: Boolean(me && r._id.equals(me._id)),
      };
    }),
  });
});
