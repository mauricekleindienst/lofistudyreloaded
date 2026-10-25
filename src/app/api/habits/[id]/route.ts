import { habitRoutes } from '@/lib/server/resourceRoutes';

export const runtime = 'nodejs';

export const PATCH = habitRoutes.update;
export const DELETE = habitRoutes.remove;
