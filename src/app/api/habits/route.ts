import { habitRoutes } from '@/lib/server/resourceRoutes';

export const runtime = 'nodejs';

export const GET = habitRoutes.list;
export const POST = habitRoutes.create;
