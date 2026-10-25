"use client";

import { useCallback, useState } from 'react';
import Desktop from '@/components/Desktop';
import AuthModal from '@/components/AuthModal';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { PomodoroProvider } from '@/contexts/PomodoroContext';
import { AmbientProvider } from '@/contexts/AmbientContext';

export default function HomeClient() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const openAuth = useCallback(() => setShowAuthModal(true), []);
  const closeAuth = useCallback(() => setShowAuthModal(false), []);

  return (
    <AppStateProvider>
      <PomodoroProvider>
        <AmbientProvider>
          <Desktop onShowAuth={openAuth} />
          <AuthModal isVisible={showAuthModal} onClose={closeAuth} />
        </AmbientProvider>
      </PomodoroProvider>
    </AppStateProvider>
  );
}
