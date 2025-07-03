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

// Custom Draggable Hook with both Mouse and Touch support
const useDraggable = (nodeRef: React.RefObject<HTMLElement | null>) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

  // Get client coordinates from either mouse or touch event
  const getClientCoordinates = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0] || e.changedTouches[0];
      return { clientX: touch.clientX, clientY: touch.clientY };
    } else {
      // Mouse event
      return { clientX: e.clientX, clientY: e.clientY };
    }
  };

  // Start dragging (mouse or touch)
  const handleDragStart = React.useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!nodeRef.current) return;
    
    const rect = nodeRef.current.getBoundingClientRect();
    const { clientX, clientY } = getClientCoordinates(e);
    
    setIsDragging(true);
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });

    // Prevent default behavior (especially important for touch)
    e.preventDefault();
  }, [nodeRef]);

  // Update position during drag (mouse or touch)
  const updatePosition = React.useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !nodeRef.current) return;
    
    const { clientX, clientY } = getClientCoordinates(e);
    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;
    
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

    // Prevent default behavior
    e.preventDefault();
  }, [isDragging, dragOffset.x, dragOffset.y]);

  // End dragging
  const handleDragEnd = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      // Add both mouse and touch event listeners
      document.addEventListener('mousemove', updatePosition, { passive: false });
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', updatePosition, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
      document.addEventListener('touchcancel', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', updatePosition);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', updatePosition);
        document.removeEventListener('touchend', handleDragEnd);
        document.removeEventListener('touchcancel', handleDragEnd);
      };
    }
  }, [isDragging, updatePosition, handleDragEnd]);

  return {
    isDragging,
    handleMouseDown: handleDragStart,
    handleTouchStart: handleDragStart
  };
};

// Custom Draggable Component with Mouse and Touch support
const CustomDraggable: React.FC<DraggableProps> = ({ 
  children, 
  disabled = false, 
  defaultPosition = { x: 0, y: 0 },
  onStart,
  handle = '.window-handle'
}) => {
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const { isDragging, handleMouseDown, handleTouchStart } = useDraggable(nodeRef);

  React.useEffect(() => {
    if (nodeRef.current && defaultPosition) {
      nodeRef.current.style.left = `${defaultPosition.x}px`;
      nodeRef.current.style.top = `${defaultPosition.y}px`;
    }
  }, [defaultPosition]);

  // Handle mouse drag start
  const handleMouseDragStart = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const target = e.target as HTMLElement;
    const handleElement = target.closest(handle);
    if (!handleElement) return;
    
    if (onStart) onStart();
    handleMouseDown(e);
  };

  // Handle touch drag start
  const handleTouchDragStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    const target = e.target as HTMLElement;
    const handleElement = target.closest(handle);
    if (!handleElement) return;
    
    if (onStart) onStart();
    handleTouchStart(e);
  };

  return (
    <div
      ref={nodeRef}
      style={{ 
        position: 'absolute',
        touchAction: 'none' // Prevent default touch behaviors like scrolling
      }}
      onMouseDown={handleMouseDragStart}
      onTouchStart={handleTouchDragStart}
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
