"use client";

import React from 'react';
import { X } from 'lucide-react';
import desktopStyles from '../../../styles/Desktop.module.css';

interface ModernNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

interface NotificationManagerProps {
  notifications: ModernNotification[];
  onRemoveNotification: (id: string) => void;
}

export default function NotificationManager({ 
  notifications, 
  onRemoveNotification 
}: NotificationManagerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className={desktopStyles.notificationsContainer}>
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={desktopStyles.notification}
        >
          {notification.icon && (
            <div className={desktopStyles.notificationIcon}>
              <notification.icon size={18} />
            </div>
          )}
          <div className={desktopStyles.notificationContent}>
            <p className={desktopStyles.notificationMessage}>{notification.message}</p>
            <p className={desktopStyles.notificationType}>{notification.type}</p>
          </div>
          <button
            onClick={() => onRemoveNotification(notification.id)}
            className={desktopStyles.notificationClose}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
