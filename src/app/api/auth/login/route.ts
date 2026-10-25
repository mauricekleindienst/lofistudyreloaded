import { collections } from '@/lib/server/mongo';
import { createSession, toPublicUser, verifyPassword } from '@/lib/server/auth';
import { route, json, readJson, str, rateLimit, clientIp, HttpError } from '@/lib/server/http';

export const runtime = 'nodejs';

export const POST = route(async (request) => {
  const body = await readJson(request);
  const email = str(body.email, 'Email', { max: 254, min: 3 })!.toLowerCase();
  const password = str(body.password, 'Password', { max: 200 })!;

  await rateLimit(`login-ip:${clientIp(request)}`, 30, 900);
  await rateLimit(`login-email:${email}`, 10, 900);

  const users = await collections.users();
  const user = await users.findOne({ email });
  const ok = await verifyPassword(password, user?.passwordHash);
  if (!user || !ok) {
    if (user && !user.passwordHash && user.providers?.length) {
      throw new HttpError(
        401,
        `This account uses ${user.providers.map((p) => p.provider).join(' / ')} sign-in. Use that button instead.`
      );
    }
    throw new HttpError(401, 'Wrong email or password');
  }

  await createSession(user._id, request.headers.get('user-agent'));
  return json({ user: toPublicUser(user) });
});
