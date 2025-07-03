"use client";

import { useState, useEffect, useCallback } from 'react';

export interface BreakpointInfo {
  name: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  scale: number;
  maxWidthPercent: number;
  maxHeightPercent: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeScreen: boolean;
}

export interface ViewportSize {
  width: number;
  height: number;
}

/**
 * Hook for responsive design utilities
 * Provides breakpoint information, viewport size, and responsive utilities
 */
export const useResponsive = () => {
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 });
  const [isClient, setIsClient] = useState(false);

  // Update viewport size
  const updateViewport = useCallback(() => {
    if (typeof window !== 'undefined') {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
  }, []);

  // Initialize client-side rendering and set up resize listener
  useEffect(() => {
    setIsClient(true);
    updateViewport();

    const handleResize = () => {
      updateViewport();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateViewport]);

  // Get current breakpoint information
  const getBreakpointInfo = useCallback((): BreakpointInfo => {
    if (!isClient) {
      return {
        name: 'lg',
        scale: 1,
        maxWidthPercent: 0.6,
        maxHeightPercent: 0.7,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeScreen: false
      };
    }

    const { width } = viewport;

    if (width < 480) {
      return {
        name: 'xs',
        scale: 0.65,
        maxWidthPercent: 0.95,
        maxHeightPercent: 0.85,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isLargeScreen: false
      };
    }

    if (width < 768) {
      return {
        name: 'sm',
        scale: 0.75,
        maxWidthPercent: 0.9,
        maxHeightPercent: 0.8,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isLargeScreen: false
      };
    }

    if (width < 1024) {
      return {
        name: 'md',
        scale: 0.85,
        maxWidthPercent: 0.75,
        maxHeightPercent: 0.75,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isLargeScreen: false
      };
    }

    if (width < 1366) {
      return {
        name: 'lg',
        scale: 0.95,
        maxWidthPercent: 0.6,
        maxHeightPercent: 0.7,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeScreen: false
      };
    }

    if (width < 1920) {
      return {
        name: 'xl',
        scale: 1.0,
        maxWidthPercent: 0.5,
        maxHeightPercent: 0.7,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeScreen: false
      };
    }

    return {
      name: '2xl',
      scale: 1.1,
      maxWidthPercent: 0.45,
      maxHeightPercent: 0.65,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isLargeScreen: true
    };
  }, [viewport, isClient]);

  // Get responsive font size
  const getResponsiveFontSize = useCallback((baseSize: number, scaleFactor = 1): string => {
    const breakpoint = getBreakpointInfo();
    const scaledSize = baseSize * breakpoint.scale * scaleFactor;
    
    // Clamp between reasonable bounds
    const minSize = Math.max(scaledSize * 0.8, 10);
    const maxSize = scaledSize * 1.2;
    
    return `clamp(${minSize}px, ${scaledSize * 0.1}vw, ${maxSize}px)`;
  }, [getBreakpointInfo]);

  // Get responsive spacing
  const getResponsiveSpacing = useCallback((baseSpacing: number): string => {
    const breakpoint = getBreakpointInfo();
    const scaledSpacing = baseSpacing * breakpoint.scale;
    
    // Clamp between reasonable bounds
    const minSpacing = Math.max(scaledSpacing * 0.6, 2);
    const maxSpacing = scaledSpacing * 1.4;
    
    return `clamp(${minSpacing}px, ${scaledSpacing * 0.15}vw, ${maxSpacing}px)`;
  }, [getBreakpointInfo]);

  // Get responsive size for an element
  const getResponsiveSize = useCallback((
    baseWidth: number, 
    baseHeight: number, 
    options?: {
      aspectRatio?: number;
      minWidth?: number;
      minHeight?: number;
      maxWidthPercent?: number;
      maxHeightPercent?: number;
    }
  ) => {
    const breakpoint = getBreakpointInfo();
    const {
      aspectRatio,
      minWidth = baseWidth * 0.7,
      minHeight = baseHeight * 0.7,
      maxWidthPercent = breakpoint.maxWidthPercent,
      maxHeightPercent = breakpoint.maxHeightPercent
    } = options || {};

    // Calculate scaled dimensions
    let scaledWidth = baseWidth * breakpoint.scale;
    let scaledHeight = baseHeight * breakpoint.scale;

    // Apply viewport constraints
    const maxWidth = viewport.width * maxWidthPercent;
    const maxHeight = viewport.height * maxHeightPercent;

    // Constrain to viewport limits
    if (scaledWidth > maxWidth) {
      scaledWidth = maxWidth;
      if (aspectRatio) {
        scaledHeight = scaledWidth / aspectRatio;
      }
    }

    if (scaledHeight > maxHeight) {
      scaledHeight = maxHeight;
      if (aspectRatio) {
        scaledWidth = scaledHeight * aspectRatio;
      }
    }

    // Ensure minimum sizes are respected
    const finalWidth = Math.max(scaledWidth, minWidth);
    const finalHeight = Math.max(scaledHeight, minHeight);

    return {
      width: finalWidth,
      height: finalHeight,
      minWidth,
      minHeight
    };
  }, [getBreakpointInfo, viewport]);

  // Check if current screen matches a breakpoint
  const isBreakpoint = useCallback((breakpoint: BreakpointInfo['name']): boolean => {
    return getBreakpointInfo().name === breakpoint;
  }, [getBreakpointInfo]);

  // Check if current screen is at least a certain breakpoint
  const isBreakpointUp = useCallback((breakpoint: BreakpointInfo['name']): boolean => {
    const current = getBreakpointInfo();
    const breakpoints: BreakpointInfo['name'][] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpoints.indexOf(current.name);
    const targetIndex = breakpoints.indexOf(breakpoint);
    return currentIndex >= targetIndex;
  }, [getBreakpointInfo]);

  // Check if current screen is below a certain breakpoint
  const isBreakpointDown = useCallback((breakpoint: BreakpointInfo['name']): boolean => {
    const current = getBreakpointInfo();
    const breakpoints: BreakpointInfo['name'][] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpoints.indexOf(current.name);
    const targetIndex = breakpoints.indexOf(breakpoint);
    return currentIndex <= targetIndex;
  }, [getBreakpointInfo]);

  const breakpointInfo = getBreakpointInfo();

  return {
    viewport,
    breakpointInfo,
    isClient,
    getResponsiveFontSize,
    getResponsiveSpacing,
    getResponsiveSize,
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    // Convenience properties
    isMobile: breakpointInfo.isMobile,
    isTablet: breakpointInfo.isTablet,
    isDesktop: breakpointInfo.isDesktop,
    isLargeScreen: breakpointInfo.isLargeScreen
  };
};

export default useResponsive;
