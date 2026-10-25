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
const BOTTOM_SAFE = 96; // keep the title bar clear of the dock

function clamp(pos: { x: number; y: number }, el: HTMLElement) {
  const maxX = Math.max(EDGE, window.innerWidth - Math.min(el.offsetWidth, window.innerWidth) - EDGE);
  const maxY = Math.max(TOP_SAFE, window.innerHeight - BOTTOM_SAFE);
  return {
    x: Math.round(Math.min(Math.max(pos.x, EDGE), maxX)),
    y: Math.round(Math.min(Math.max(pos.y, TOP_SAFE), maxY)),
  };
}

function FloatingWindow({
  win,
  onMinimize,
  onClose,
  onBringToFront,
  onMove,
}: { win: ModernWindow } & Omit<WindowManagerProps, 'openWindows' | 'compact'>) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number; pointerId: number; w: number } | null>(null);
  const pos = useRef(win.position);
  const frame = useRef<number | null>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);

  const apply = (p: { x: number; y: number }) => {
    pos.current = p;
    if (ref.current) ref.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
  };

  // Initial placement, and re-clamping if the viewport shrinks (rotation, resize).
  useEffect(() => {
    if (ref.current) apply(clamp(win.position, ref.current));
    const onResize = () => ref.current && apply(clamp(pos.current, ref.current));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [win.position]);

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
    const maxX = Math.max(EDGE, window.innerWidth - Math.min(d.w, window.innerWidth) - EDGE);
    const maxY = Math.max(TOP_SAFE, window.innerHeight - BOTTOM_SAFE);
    pending.current = {
      x: Math.round(Math.min(Math.max(e.clientX - d.dx, EDGE), maxX)),
      y: Math.round(Math.min(Math.max(e.clientY - d.dy, TOP_SAFE), maxY)),
    };
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
    onMove(win.id, pos.current);
  };

  return (
    <div
      ref={ref}
      className={`${desktopStyles.window} ${win.isMinimized ? desktopStyles.minimized : ''}`}
      style={{ zIndex: 30 + win.zIndex, width: win.size.width, height: win.size.height }}
      onPointerDownCapture={() => onBringToFront(win.id)}
      role="dialog"
      aria-label={win.app.name}
      aria-hidden={win.isMinimized}
    >
      <div
        className={desktopStyles.windowHeader}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ touchAction: 'none' }}
      >
        <div className={desktopStyles.windowTitleSection}>
          <win.app.icon size={18} className={desktopStyles.whiteIcon} />
          <span className={desktopStyles.windowTitle}>{win.app.name}</span>
        </div>
        <div className={desktopStyles.windowControls}>
          <button onClick={() => onMinimize(win.id)} className={desktopStyles.windowButton} title="Minimize" aria-label={`Minimize ${win.app.name}`}>
            <Minus size={14} />
          </button>
          <button
            onClick={() => onClose(win.id)}
            className={`${desktopStyles.windowButton} ${desktopStyles.closeButton}`}
            title="Close"
            aria-label={`Close ${win.app.name}`}
          >
            <X size={14} />
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
  if (compact) {
    return (
      <>
        {openWindows.map((win) => (
          <div
            key={win.id}
            className={`${desktopStyles.sheet} ${win.isMinimized ? desktopStyles.sheetHidden : ''}`}
            style={{ zIndex: 30 + win.zIndex }}
            role="dialog"
            aria-label={win.app.name}
            aria-hidden={win.isMinimized}
          >
            <div className={desktopStyles.windowHeader} style={{ cursor: 'default' }}>
              <div className={desktopStyles.windowTitleSection}>
                <win.app.icon size={18} className={desktopStyles.whiteIcon} />
                <span className={desktopStyles.windowTitle}>{win.app.name}</span>
              </div>
              <div className={desktopStyles.windowControls}>
                <button onClick={() => onMinimize(win.id)} className={desktopStyles.windowButton} aria-label={`Hide ${win.app.name}`}>
                  <Minus size={16} />
                </button>
                <button
                  onClick={() => onClose(win.id)}
                  className={`${desktopStyles.windowButton} ${desktopStyles.closeButton}`}
                  aria-label={`Close ${win.app.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className={desktopStyles.windowContent}>
              <win.app.component />
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {openWindows.map((win) => (
        <FloatingWindow
          key={win.id}
          win={win}
          onMinimize={onMinimize}
          onClose={onClose}
          onBringToFront={onBringToFront}
          onMove={onMove}
        />
      ))}
    </>
  );
}
