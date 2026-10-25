"use client";

import React from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import styles from '../../../styles/Toasts.module.css';
import type { ModernNotification } from './types';

interface NotificationManagerProps {
  notifications: ModernNotification[];
  onRemoveNotification: (id: string) => void;
}

const ICONS = { success: CheckCircle2, warning: AlertTriangle, error: AlertCircle, info: Info } as const;

/** Toasts sit just above the dock so they never cover the top bar or a window's title. */
export default function NotificationManager({ notifications, onRemoveNotification }: NotificationManagerProps) {
  return (
    <div className={styles.stack} role="region" aria-label="Notifications" aria-live="polite">
      {notifications.map((n) => {
        const Icon = ICONS[n.type];
        return (
          <div key={n.id} className={`${styles.toast} ${styles[n.type]}`} role={n.type === 'error' ? 'alert' : 'status'}>
            <Icon size={18} className={styles.icon} aria-hidden />
            <p className={styles.message}>{n.message}</p>
            <button className={styles.close} onClick={() => onRemoveNotification(n.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
