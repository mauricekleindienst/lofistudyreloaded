import { getCurrentUser, toPublicUser } from '@/lib/server/auth';
import { route, json } from '@/lib/server/http';

export const runtime = 'nodejs';

export const GET = route(async () => {
  const user = await getCurrentUser();
  return json({ user: user ? toPublicUser(user) : null });
});
