// Shared types for Desktop components

export interface Background {
  id: number;
  src: string;
  alt: string;
  note: string;
  createdby: string;
  priority: boolean;
  category: string;
  isYoutube?: boolean;
  // CDN optimization properties
  filename?: string;
  optimized?: boolean;
  preloadPriority?: 'high' | 'medium' | 'low';
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
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
}

export interface ModernNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export interface DesktopProps {
  onShowAuth: () => void;
}
