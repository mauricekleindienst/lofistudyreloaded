import { appointmentRoutes } from '@/lib/server/resourceRoutes';

export const runtime = 'nodejs';

export const PATCH = appointmentRoutes.update;
export const DELETE = appointmentRoutes.remove;
