import { destroySession } from '@/lib/server/auth';
import { route, json } from '@/lib/server/http';

export const runtime = 'nodejs';

export const POST = route(async () => {
  await destroySession();
  return json({ ok: true });
});
