import 'server-only';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCurrentUser } from './auth';
import { collections } from './mongo';
import type { UserDoc } from './models';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json<T>(data: T, init?: number | ResponseInit) {
  const responseInit = typeof init === 'number' ? { status: init } : init;
  return NextResponse.json(data, {
    ...responseInit,
    headers: { 'Cache-Control': 'no-store', ...(responseInit?.headers ?? {}) },
  });
}

/**
 * Cookies are SameSite=Lax, which already blocks cross-site POSTs from carrying
 * the session. The Origin check is a second fence for state-changing requests.
 */
function assertSameOrigin(request: Request) {
  if (request.method === 'GET' || request.method === 'HEAD') return;
  const origin = request.headers.get('origin');
  if (!origin) return; // non-browser clients
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    if (new URL(origin).host !== host) throw new HttpError(403, 'Cross-origin request blocked');
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(403, 'Invalid origin');
  }
}

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/** Wraps a route handler with origin checking and uniform error responses. */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      assertSameOrigin(request);
      return await handler(request, context);
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ error: err.message }, err.status);
      }
      console.error(`[api] ${request.method} ${new URL(request.url).pathname}`, err);
      return json({ error: 'Internal server error' }, 500);
    }
  };
}

export async function requireUser(): Promise<UserDoc> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'Not signed in');
  return user;
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {
    // fall through
  }
  throw new HttpError(400, 'Expected a JSON object body');
}

export function parseObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id) || id.length !== 24) throw new HttpError(404, 'Not found');
  return new ObjectId(id);
}

/**
 * The reverse proxy (Caddy) appends the real peer address as the *last*
 * X-Forwarded-For entry; earlier entries are client-controlled and spoofable.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/** Fixed-window rate limit stored in Mongo so it holds across restarts and replicas. */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000));
  const id = `${key}:${windowStart}`;
  const limits = await collections.rateLimits();
  const doc = await limits.findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((windowStart + 1) * windowSeconds * 1000) } },
    { upsert: true, returnDocument: 'after' }
  );
  if (doc && doc.count > limit) {
    throw new HttpError(429, 'Too many requests, please slow down.');
  }
}

// --- tiny validators -------------------------------------------------------

export function str(value: unknown, field: string, opts: { max: number; min?: number; optional?: boolean }): string | undefined {
  if (value === undefined || value === null) {
    if (opts.optional) return undefined;
    throw new HttpError(400, `${field} is required`);
  }
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be a string`);
  const trimmed = value.trim();
  if (trimmed.length < (opts.min ?? 0)) throw new HttpError(400, `${field} is too short`);
  if (value.length > opts.max) throw new HttpError(400, `${field} is too long (max ${opts.max})`);
  return opts.min ? trimmed : value;
}

export function oneOf<T extends string>(value: unknown, field: string, allowed: readonly T[], fallback?: T): T {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return value as T;
  throw new HttpError(400, `${field} must be one of ${allowed.join(', ')}`);
}

export function bool(value: unknown, field: string, fallback?: boolean): boolean {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value === 'boolean') return value;
  throw new HttpError(400, `${field} must be a boolean`);
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function dateStr(value: unknown, field: string, optional = false): string | undefined {
  if ((value === undefined || value === null || value === '') && optional) return undefined;
  if (typeof value !== 'string' || !DATE_RE.test(value)) throw new HttpError(400, `${field} must be YYYY-MM-DD`);
  // Round-trip through Date to reject impossible days like 2026-02-30.
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, `${field} is not a valid date`);
  }
  return value;
}
