import { collections } from '@/lib/server/mongo';
import { createSession, destroyAllSessions, hashPassword, verifyPassword } from '@/lib/server/auth';
import { route, json, readJson, str, requireUser, rateLimit, HttpError } from '@/lib/server/http';

export const runtime = 'nodejs';

/** Change (or, for OAuth-only accounts, set) the password. Signs out every other device. */
export const POST = route(async (request) => {
  const user = await requireUser();
  await rateLimit(`password:${user._id.toHexString()}`, 10, 900);
  const body = await readJson(request);
  const newPassword = str(body.new_password, 'New password', { max: 200 })!;
  if (newPassword.length < 8) throw new HttpError(400, 'New password must be at least 8 characters');

  if (user.passwordHash) {
    const current = str(body.current_password, 'Current password', { max: 200 })!;
    if (!(await verifyPassword(current, user.passwordHash))) {
      throw new HttpError(401, 'Current password is wrong');
    }
  }

  const users = await collections.users();
  await users.updateOne(
    { _id: user._id },
    { $set: { passwordHash: await hashPassword(newPassword), updatedAt: new Date() } }
  );
  await destroyAllSessions(user._id);
  await createSession(user._id, request.headers.get('user-agent'));
  return json({ ok: true });
});
