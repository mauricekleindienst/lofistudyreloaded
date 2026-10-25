import { todoRoutes } from '@/lib/server/resourceRoutes';

export const runtime = 'nodejs';

export const PATCH = todoRoutes.update;
export const DELETE = todoRoutes.remove;
