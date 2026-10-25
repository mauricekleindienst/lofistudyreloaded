"use client";

// Small cross-component UI events, so deeply nested windows can ask the
// desktop to do things without prop drilling.

export function openAuthModal() {
  window.dispatchEvent(new Event('lofi:open-auth'));
}
