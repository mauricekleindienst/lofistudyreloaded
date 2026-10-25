import { deckRoutes } from '@/lib/server/resourceRoutes';

export const runtime = 'nodejs';

export const PATCH = deckRoutes.update;
export const DELETE = deckRoutes.remove;
