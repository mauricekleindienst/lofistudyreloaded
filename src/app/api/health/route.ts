import { getDb } from '@/lib/server/mongo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await (await getDb()).command({ ping: 1 });
    return Response.json({ ok: true, db: 'up' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ ok: false, db: 'down' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
