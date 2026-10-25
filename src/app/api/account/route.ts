import { collections } from '@/lib/server/mongo';
import { destroyAllSessions, destroySession, verifyPassword } from '@/lib/server/auth';
import { route, json, readJson, requireUser, HttpError } from '@/lib/server/http';

export const runtime = 'nodejs';

/** Permanently delete the account and everything it owns. */
export const DELETE = route(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  if (body.confirm !== 'DELETE') throw new HttpError(400, 'Type DELETE to confirm');
  if (user.passwordHash && !(await verifyPassword(String(body.password ?? ''), user.passwordHash))) {
    throw new HttpError(401, 'Password is wrong');
  }

  const userId = user._id;
  await Promise.all([
    collections.todos().then((c) => c.deleteMany({ userId })),
    collections.notes().then((c) => c.deleteMany({ userId })),
    collections.appointments().then((c) => c.deleteMany({ userId })),
    collections.pomodoroStats().then((c) => c.deleteMany({ userId })),
    collections.chatMessages().then((c) => c.deleteMany({ userId })),
    collections.presence().then((c) => c.deleteOne({ _id: userId.toHexString() })),
  ]);
  await destroySession();
  await destroyAllSessions(userId);
  await (await collections.users()).deleteOne({ _id: userId });
  return json({ ok: true });
});
