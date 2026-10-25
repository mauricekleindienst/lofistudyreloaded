import { enabledProviders } from '@/lib/server/oauth';
import { route, json } from '@/lib/server/http';

export const runtime = 'nodejs';

export const GET = route(async () => json({ providers: enabledProviders() }));
