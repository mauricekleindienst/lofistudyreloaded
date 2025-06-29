"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from '../../styles/RealtimeStatus.module.css';

const RealtimeStatusIndicator: React.FC = () => {
  const authContext = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show the indicator after a brief delay to avoid hydration issues
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  // Simple logic: green dot when authenticated, yellow when offline
  const isAuthenticated = authContext?.isConfigured && authContext?.user;

  return (
    <div 
      className={`${styles.statusDot} ${isAuthenticated ? styles.online : styles.offline}`}
      title={isAuthenticated ? 'Online - Data syncing' : 'Offline - Local storage only'}
    />
  );
};

export default RealtimeStatusIndicator;
