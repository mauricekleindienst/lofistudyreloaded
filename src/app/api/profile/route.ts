import { collections } from '@/lib/server/mongo';
import { toPublicUser } from '@/lib/server/auth';
import { route, json, readJson, requireUser, str, HttpError } from '@/lib/server/http';

export const runtime = 'nodejs';

export const GET = route(async () => {
  const user = await requireUser();
  return json({ user: toPublicUser(user) });
});

/** Update display name, avatar or merge keys into the settings object. */
export const PATCH = route(async (request) => {
  const user = await requireUser();
  const body = await readJson(request);
  const set: Record<string, unknown> = { updatedAt: new Date() };

  if (body.full_name !== undefined) {
    const name = str(body.full_name, 'Display name', { max: 40, min: 2 })!;
    if (/[<>]/.test(name)) throw new HttpError(400, 'Display name contains invalid characters');
    set.fullName = name;
  }
  if (body.avatar_url !== undefined) {
    const url = body.avatar_url === null ? '' : str(body.avatar_url, 'Avatar URL', { max: 500 })!;
    if (url && !/^https:\/\//.test(url)) throw new HttpError(400, 'Avatar URL must start with https://');
    set.avatarUrl = url || undefined;
  }
  if (body.settings !== undefined) {
    if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) {
      throw new HttpError(400, 'settings must be an object');
    }
    const depth = (v: unknown, d = 0): number =>
      v && typeof v === 'object' ? Math.max(d + 1, ...Object.values(v as object).map((x) => depth(x, d + 1))) : d;
    if (depth(body.settings) > 4) throw new HttpError(400, 'settings are nested too deeply');
    const merged = { ...(user.settings ?? {}), ...(body.settings as Record<string, unknown>) };
    if (JSON.stringify(merged).length > 10_000) throw new HttpError(400, 'settings too large');
    set.settings = merged;
  }

  const users = await collections.users();
  const updated = await users.findOneAndUpdate({ _id: user._id }, { $set: set }, { returnDocument: 'after' });
  return json({ user: toPublicUser(updated!) });
});
