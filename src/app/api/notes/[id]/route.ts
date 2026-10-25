import { noteRoutes } from '@/lib/server/resourceRoutes';

export const runtime = 'nodejs';

export const PATCH = noteRoutes.update;
export const DELETE = noteRoutes.remove;
