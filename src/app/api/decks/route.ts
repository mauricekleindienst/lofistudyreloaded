import { deckRoutes } from '@/lib/server/resourceRoutes';

export const runtime = 'nodejs';

export const GET = deckRoutes.list;
export const POST = deckRoutes.create;
