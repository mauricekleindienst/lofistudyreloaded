import { noteRoutes } from '@/lib/server/resourceRoutes';

export const runtime = 'nodejs';

export const GET = noteRoutes.list;
export const POST = noteRoutes.create;
