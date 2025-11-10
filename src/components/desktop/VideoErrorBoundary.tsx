"use client";

import React from 'react';

interface VideoErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface VideoErrorBoundaryState {
  hasError: boolean;
}

class VideoErrorBoundary extends React.Component<VideoErrorBoundaryProps, VideoErrorBoundaryState> {
  constructor(props: VideoErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): VideoErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: { componentStack: string }) {
    // Log error for diagnostics; avoid crashing the app UI
    console.error('Background video UI crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

export default VideoErrorBoundary;