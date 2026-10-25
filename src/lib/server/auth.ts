import 'server-only';
import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import { collections } from './mongo';
import type { UserDoc } from './models';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

export const SESSION_COOKIE = 'lofi_session';
const SESSION_DAYS = 30;
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, SCRYPT);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored) {
    // Burn comparable time so "no such user" is not distinguishable by latency.
    await scrypt(password, randomBytes(16), KEYLEN, SCRYPT);
    return false;
  }
  const [scheme, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, SCRYPT);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: ObjectId, userAgent?: string | null) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const sessions = await collections.sessions();
  await sessions.insertOne({
    _id: new ObjectId(),
    tokenHash: hashToken(token),
    userId,
    createdAt: now,
    expiresAt,
    userAgent: userAgent?.slice(0, 300) ?? undefined,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const sessions = await collections.sessions();
    await sessions.deleteOne({ tokenHash: hashToken(token) });
  }
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: ObjectId) {
  const sessions = await collections.sessions();
  await sessions.deleteMany({ userId });
}

/** Returns the signed-in user for this request, or null. */
export async function getCurrentUser(): Promise<UserDoc | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sessions = await collections.sessions();
  const session = await sessions.findOne({ tokenHash: hashToken(token) });
  if (!session || session.expiresAt < new Date()) return null;

  const users = await collections.users();
  return users.findOne({ _id: session.userId });
}

export interface PublicUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  has_password: boolean;
  providers: string[];
  settings: Record<string, unknown>;
  created_at: string;
}

export function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toHexString(),
    email: user.email,
    full_name: user.fullName,
    avatar_url: user.avatarUrl ?? null,
    has_password: Boolean(user.passwordHash),
    providers: (user.providers ?? []).map((p) => p.provider),
    settings: user.settings ?? {},
    created_at: user.createdAt.toISOString(),
  };
}
