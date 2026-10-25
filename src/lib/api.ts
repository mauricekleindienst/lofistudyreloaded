"use client";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** fetch wrapper for our own /api routes: JSON in, JSON out, readable errors. */
export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: 'same-origin',
      ...rest,
      headers: {
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError(0, 'You appear to be offline. Please check your connection.');
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

// --- toast bus: lets any module surface an error without prop drilling ----

export type ToastType = 'info' | 'success' | 'warning' | 'error';
export interface ToastDetail {
  message: string;
  type: ToastType;
}

export function toast(message: string, type: ToastType = 'info') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastDetail>('lofi:toast', { detail: { message, type } }));
}

/** YYYY-MM-DD in the user's own timezone (toISOString would give UTC). */
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDate(d);
}
