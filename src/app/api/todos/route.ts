import { todoRoutes } from '@/lib/server/resourceRoutes';

export const runtime = 'nodejs';

export const GET = todoRoutes.list;
export const POST = todoRoutes.create;
