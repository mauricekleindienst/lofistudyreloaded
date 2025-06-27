"use client";

import React from 'react';
import { X, Minus } from 'lucide-react';
import desktopStyles from '../../../styles/Desktop.module.css';

interface ModernApp {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  component: React.ComponentType;
  category: 'productivity' | 'entertainment' | 'tools' | 'study';
  color: string;
  description: string;
}

interface ModernWindow {
  id: string;
  app: ModernApp;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  zIndex: number;
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
}

interface WindowManagerProps {
  openWindows: ModernWindow[];
  onMinimize: (windowId: string) => void;
  onClose: (windowId: string) => void;
  onBringToFront: (windowId: string) => void;
}

interface DraggableProps {
  children: React.ReactNode;
  disabled?: boolean;
  defaultPosition?: { x: number; y: number };
  onStart?: () => void;
  handle?: string;
}

// Custom Draggable Hook
const useDraggable = (nodeRef: React.RefObject<HTMLElement | null>) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (!nodeRef.current) return;
    
    const rect = nodeRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [nodeRef]);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging || !nodeRef.current) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elementWidth = nodeRef.current.offsetWidth;
    const elementHeight = nodeRef.current.offsetHeight;
    
    // Calculate maximum positions to keep window fully within viewport
    const maxX = viewportWidth - elementWidth;
    const maxY = viewportHeight - elementHeight;
    
    // Constrain position to viewport bounds
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    nodeRef.current.style.left = `${boundedX}px`;
    nodeRef.current.style.top = `${boundedY}px`;
  }, [isDragging, dragOffset.x, dragOffset.y, nodeRef]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    isDragging,
    handleMouseDown
  };
};

// Custom Draggable Component
const CustomDraggable: React.FC<DraggableProps> = ({ 
  children, 
  disabled = false, 
  defaultPosition = { x: 0, y: 0 },
  onStart,
  handle = '.window-handle'
}) => {
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const { isDragging, handleMouseDown } = useDraggable(nodeRef);

  React.useEffect(() => {
    if (nodeRef.current && defaultPosition) {
      nodeRef.current.style.left = `${defaultPosition.x}px`;
      nodeRef.current.style.top = `${defaultPosition.y}px`;
    }
  }, [defaultPosition]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const target = e.target as HTMLElement;
    const handleElement = target.closest(handle);
    if (!handleElement) return;
    
    if (onStart) onStart();
    handleMouseDown(e);
  };

  return (
    <div
      ref={nodeRef}
      style={{ position: 'absolute' }}
      onMouseDown={handleDragStart}
      className={isDragging ? desktopStyles.selectNone : ''}
    >
      {children}
    </div>
  );
};

export default function WindowManager({ 
  openWindows, 
  onMinimize, 
  onClose, 
  onBringToFront 
}: WindowManagerProps) {
  return (
    <>
      {openWindows.map(window => (
        <CustomDraggable
          key={window.id}
          defaultPosition={window.position}
          handle=".window-handle"
          onStart={() => onBringToFront(window.id)}
        >
          <div
            className={`${desktopStyles.window} ${window.isMinimized ? desktopStyles.minimized : ''}`}
            style={{ 
              zIndex: 30 + window.zIndex,
              width: window.size.width,
              height: window.size.height
            }}
          >
            {/* Window Header */}
            <div className={`window-handle ${desktopStyles.windowHeader}`}>
              <div className={desktopStyles.windowTitleSection}>
                <window.app.icon size={20} className={desktopStyles.whiteIcon} />
                <span className={desktopStyles.windowTitle}>{window.app.name}</span>
              </div>
              <div className={desktopStyles.windowControls}>
                <button
                  onClick={() => onMinimize(window.id)}
                  className={desktopStyles.windowButton}
                  title="Minimize"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => onClose(window.id)}
                  className={`${desktopStyles.windowButton} ${desktopStyles.closeButton}`}
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Window Content */}
            <div className={desktopStyles.windowContent}>
              <window.app.component />
            </div>
          </div>
        </CustomDraggable>
      ))}
    </>
  );
}
