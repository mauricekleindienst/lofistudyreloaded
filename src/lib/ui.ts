"use client";

// Small cross-component UI events, so deeply nested windows can ask the
// desktop to do things without prop drilling.

export function openAuthModal() {
  window.dispatchEvent(new Event('lofi:open-auth'));
}

/** Opens (or focuses) a desktop app window by id, e.g. 'pomodoro'. */
export function openApp(id: string) {
  window.dispatchEvent(new CustomEvent('lofi:open-app', { detail: id }));
}
