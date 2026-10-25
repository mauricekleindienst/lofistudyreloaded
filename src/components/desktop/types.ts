// Shared types for Desktop components
import type React from 'react';

export interface Background {
  id: number;
  slug: string;
  src: string;
  srcMobile: string;
  poster: string;
  alt: string;
  note: string;
  createdby: string;
  category: 'nature' | 'cozy' | 'urban' | 'gaming';
}

export interface ModernApp {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  component: React.ComponentType;
  category: 'productivity' | 'entertainment' | 'tools' | 'study';
  color: string;
  description: string;
}

export interface ModernWindow {
  id: string;
  app: ModernApp;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  zIndex: number;
}

export interface ModernNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface DesktopProps {
  onShowAuth: () => void;
}
