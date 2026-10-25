"use client";

import { useCallback, useState } from 'react';
import Desktop from '@/components/Desktop';
import AuthModal from '@/components/AuthModal';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { PomodoroProvider } from '@/contexts/PomodoroContext';

export default function HomeClient() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const openAuth = useCallback(() => setShowAuthModal(true), []);
  const closeAuth = useCallback(() => setShowAuthModal(false), []);

  return (
    <AppStateProvider>
      <PomodoroProvider>
        <Desktop onShowAuth={openAuth} />
        <AuthModal isVisible={showAuthModal} onClose={closeAuth} />
      </PomodoroProvider>
    </AppStateProvider>
  );
}
