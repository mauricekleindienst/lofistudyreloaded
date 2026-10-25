"use client";

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders a modal at the end of <body>, so it sits above windows, the top bar and the
 * dock whatever stacking context it was opened from. Escape closes it, focus moves
 * into it on open and goes back to where it was on close.
 */
export default function ModalPortal({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      close.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return createPortal(
    <div ref={ref} role="dialog" aria-modal="true" aria-label={label} style={{ display: 'contents' }}>
      {children}
    </div>,
    document.body
  );
}
