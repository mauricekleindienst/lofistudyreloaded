import { ObjectId, MongoServerError } from 'mongodb';
import { collections } from '@/lib/server/mongo';
import { createSession, hashPassword, toPublicUser } from '@/lib/server/auth';
import { route, json, readJson, str, rateLimit, clientIp, HttpError } from '@/lib/server/http';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const POST = route(async (request) => {
  await rateLimit(`register:${clientIp(request)}`, 10, 3600);
  const body = await readJson(request);
  const email = str(body.email, 'Email', { max: 254, min: 3 })!.toLowerCase();
  const password = str(body.password, 'Password', { max: 200 })!;
  const fullName = str(body.full_name, 'Name', { max: 40, optional: true })?.trim();

  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');

  const now = new Date();
  const user = {
    _id: new ObjectId(),
    email,
    passwordHash: await hashPassword(password),
    fullName: fullName || email.split('@')[0].slice(0, 40),
    settings: {},
    createdAt: now,
    updatedAt: now,
  };

  const users = await collections.users();
  try {
    await users.insertOne(user);
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      throw new HttpError(409, 'An account with this email already exists. Try signing in.');
    }
    throw err;
  }

  await createSession(user._id, request.headers.get('user-agent'));
  return json({ user: toPublicUser(user) }, 201);
});
