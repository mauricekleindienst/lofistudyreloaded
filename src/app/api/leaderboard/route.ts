import type { ObjectId } from 'mongodb';
import { collections } from '@/lib/server/mongo';
import { getCurrentUser } from '@/lib/server/auth';
import { route, json, dateStr, rateLimit, clientIp } from '@/lib/server/http';

export const runtime = 'nodejs';

interface Row {
  _id: ObjectId;
  sessions: number;
  minutes: number;
  rank: number;
}

/** GET ?from=YYYY-MM-DD&sort=sessions|time — top 50, plus the caller's own row. */
export const GET = route(async (request) => {
  await rateLimit(`leaderboard:${clientIp(request)}`, 60, 60);
  const params = new URL(request.url).searchParams;
  const from = dateStr(params.get('from') ?? undefined, 'from', true);
  const sortBy = params.get('sort') === 'time' ? 'minutes' : 'sessions';
  const me = await getCurrentUser();
  // $documentNumber needs a single sort key, so the tie-breaker is folded into one score.
  const score = sortBy === 'minutes' ? { $add: [{ $multiply: ['$minutes', 1e7] }, '$sessions'] } : { $add: [{ $multiply: ['$sessions', 1e7] }, '$minutes'] };

  // Ranking happens inside MongoDB; only the top 50 and the caller's own row come back.
  const col = await collections.pomodoroStats();
  const [result] = await col
    .aggregate<{ top: Row[]; mine: Row[] }>([
      ...(from ? [{ $match: { date: { $gte: from } } }] : []),
      { $group: { _id: '$userId', sessions: { $sum: '$pomodoroCount' }, minutes: { $sum: '$focusMinutes' } } },
      { $set: { score } },
      { $setWindowFields: { sortBy: { score: -1 }, output: { rank: { $documentNumber: {} } } } },
      { $facet: { top: [{ $limit: 50 }], mine: me ? [{ $match: { _id: me._id } }] : [{ $limit: 0 }] } },
    ])
    .toArray();

  const top = result?.top ?? [];
  const mine = result?.mine[0];
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
