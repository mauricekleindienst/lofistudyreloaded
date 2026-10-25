import { appointmentRoutes } from '@/lib/server/resourceRoutes';

export const runtime = 'nodejs';

export const GET = appointmentRoutes.list;
export const POST = appointmentRoutes.create;
