"use client";

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from '../../../styles/Desktop.module.css';
import type { ModernApp } from './types';

interface AppLauncherProps {
  apps: ModernApp[];
  onOpen: (app: ModernApp) => void;
  onClose: () => void;
}

const GROUPS: { id: ModernApp['category']; label: string }[] = [
  { id: 'study', label: 'Study' },
  { id: 'productivity', label: 'Organise' },
  { id: 'tools', label: 'Tools' },
  { id: 'entertainment', label: 'Community' },
];

/** All apps, including the ones that aren't pinned to the dock. */
export default function AppLauncher({ apps, onOpen, onClose }: AppLauncherProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panelRef.current?.querySelector<HTMLButtonElement>('button[data-app]')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.launcherOverlay} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.launcher}
        role="dialog"
        aria-modal="true"
        aria-label="All apps"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.launcherHeader}>
          <h2>Apps</h2>
          <button className={styles.launcherClose} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {GROUPS.map((g) => {
          const list = apps.filter((a) => a.category === g.id);
          if (!list.length) return null;
          return (
            <section key={g.id} className={styles.launcherGroup}>
              <h3>{g.label}</h3>
              <div className={styles.launcherGrid}>
                {list.map((app) => (
                  <button
                    key={app.id}
                    data-app={app.id}
                    className={styles.launcherApp}
                    data-color={app.color}
                    onClick={() => {
                      onOpen(app);
                      onClose();
                    }}
                  >
                    <span className={styles.launcherIcon}>
                      <app.icon size={22} />
                    </span>
                    <span className={styles.launcherName}>{app.name}</span>
                    <span className={styles.launcherDesc}>{app.description}</span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
