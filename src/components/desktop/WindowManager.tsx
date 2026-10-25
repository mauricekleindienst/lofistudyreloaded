"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import { X, Minus } from 'lucide-react';
import desktopStyles from '../../../styles/Desktop.module.css';
import type { ModernWindow } from './types';

interface WindowManagerProps {
  openWindows: ModernWindow[];
  /** Phones get full-screen sheets instead of floating windows. */
  compact: boolean;
  onMinimize: (windowId: string) => void;
  onClose: (windowId: string) => void;
  onBringToFront: (windowId: string) => void;
  onMove: (windowId: string, position: { x: number; y: number }) => void;
}

const EDGE = 8;
const TOP_SAFE = 8;
const HEADER = 56; // the title bar must stay grabbable above the dock
const MIN_HEIGHT = 220;

/** Top edge of the dock (it is fixed, so this is stable while dragging). */
function dockTop() {
  const dock = document.querySelector('nav[aria-label="Dock"]');
  return dock ? dock.getBoundingClientRect().top : window.innerHeight - 110;
}

function clamp(pos: { x: number; y: number }, width: number, limit = dockTop()) {
  const maxX = Math.max(EDGE, window.innerWidth - Math.min(width, window.innerWidth) - EDGE);
  const maxY = Math.max(TOP_SAFE, limit - HEADER - 8);
  return {
    x: Math.round(Math.min(Math.max(pos.x, EDGE), maxX)),
    y: Math.round(Math.min(Math.max(pos.y, TOP_SAFE), maxY)),
  };
}

/**
 * One element tree for both layouts (floating window / phone sheet), so crossing the
 * breakpoint — e.g. rotating a phone — doesn't remount the app and lose its state.
 */
function AppWindow({
  win,
  layer,
  compact,
  onMinimize,
  onClose,
  onBringToFront,
  onMove,
}: { win: ModernWindow; layer: number } & Omit<WindowManagerProps, 'openWindows'>) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number; pointerId: number; w: number; limit: number } | null>(null);
  const pos = useRef(win.position);
  const frame = useRef<number | null>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);

  const apply = (p: { x: number; y: number }) => {
    pos.current = p;
    if (ref.current) ref.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
  };

  /** Position and height that fit between the top bar and the dock. */
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const limit = dockTop();
    const p = clamp(pos.current, el.offsetWidth, limit);
    apply(p);
    el.style.height = `${Math.max(MIN_HEIGHT, Math.min(win.size.height, limit - 8 - p.y))}px`;
  }, [win.size.height]);

  // Initial placement, and re-fitting when the viewport changes (rotation, resize).
  useEffect(() => {
    if (compact) {
      if (ref.current) {
        ref.current.style.transform = '';
        ref.current.style.height = '';
      }
      return;
    }
    pos.current = win.position;
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [win.position, compact, fit]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      if (e.button !== 0) return;
      onBringToFront(win.id);
      drag.current = {
        dx: e.clientX - pos.current.x,
        dy: e.clientY - pos.current.y,
        pointerId: e.pointerId,
        w: ref.current?.offsetWidth ?? 0,
        limit: dockTop(),
      };
      ref.current?.classList.add(desktopStyles.dragging);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [onBringToFront, win.id]
  );

  // At most one style write per frame; width is measured once at drag start, so
  // moving never forces a layout read.
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    pending.current = clamp({ x: e.clientX - d.dx, y: e.clientY - d.dy }, d.w, d.limit);
    if (frame.current === null) {
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        if (pending.current) apply(pending.current);
      });
    }
  };

  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    if (pending.current) apply(pending.current);
    pending.current = null;
    ref.current?.classList.remove(desktopStyles.dragging);
    fit();
    onMove(win.id, pos.current);
  };

  return (
    <div
      ref={ref}
      className={
        compact
          ? `${desktopStyles.sheet} ${win.isMinimized ? desktopStyles.sheetHidden : ''}`
          : `${desktopStyles.window} ${win.isMinimized ? desktopStyles.minimized : ''}`
      }
      style={compact ? { zIndex: layer } : { zIndex: layer, width: win.size.width, height: win.size.height }}
      onPointerDownCapture={() => onBringToFront(win.id)}
      role="dialog"
      aria-label={win.app.name}
      aria-hidden={win.isMinimized}
      // Hidden windows stay mounted (timers, drafts) but must not take focus or clicks.
      inert={win.isMinimized}
    >
      <div
        className={desktopStyles.windowHeader}
        onPointerDown={compact ? undefined : onPointerDown}
        onPointerMove={compact ? undefined : onPointerMove}
        onPointerUp={compact ? undefined : endDrag}
        onPointerCancel={compact ? undefined : endDrag}
        style={compact ? { cursor: 'default' } : { touchAction: 'none' }}
      >
        <div className={desktopStyles.windowTitleSection}>
          <win.app.icon size={18} className={desktopStyles.whiteIcon} />
          <span className={desktopStyles.windowTitle}>{win.app.name}</span>
        </div>
        <div className={desktopStyles.windowControls}>
          <button
            onClick={() => onMinimize(win.id)}
            className={desktopStyles.windowButton}
            title={compact ? 'Hide' : 'Minimize'}
            aria-label={`${compact ? 'Hide' : 'Minimize'} ${win.app.name}`}
          >
            <Minus size={compact ? 16 : 14} />
          </button>
          <button
            onClick={() => onClose(win.id)}
            className={`${desktopStyles.windowButton} ${desktopStyles.closeButton}`}
            title="Close"
            aria-label={`Close ${win.app.name}`}
          >
            <X size={compact ? 16 : 14} />
          </button>
        </div>
      </div>
      <div className={desktopStyles.windowContent}>
        <win.app.component />
      </div>
    </div>
  );
}

export default function WindowManager({ openWindows, compact, onMinimize, onClose, onBringToFront, onMove }: WindowManagerProps) {
  // zIndex only orders the windows; the CSS layer is their rank (30, 31, …), so windows
  // always stay below the top bar, dock and modals however often they're raised.
  const order = [...openWindows].sort((a, b) => a.zIndex - b.zIndex).map((w) => w.id);
  return (
    <>
      {openWindows.map((win) => (
        <AppWindow
          key={win.id}
          win={win}
          layer={30 + order.indexOf(win.id)}
          compact={compact}
          onMinimize={onMinimize}
          onClose={onClose}
          onBringToFront={onBringToFront}
          onMove={onMove}
        />
      ))}
    </>
  );
}
