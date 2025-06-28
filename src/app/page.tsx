"use client";

import Desktop from '@/components/Desktop_modern_refactored';
import { AppStateProvider } from '@/contexts/AppStateContext';
import AuthModal from '@/components/AuthModal';
import ClientServiceWorkerInit from '@/components/ClientServiceWorkerInit';
import { useState } from 'react';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <AppStateProvider>
      <ClientServiceWorkerInit />
      <Desktop onShowAuth={() => setShowAuthModal(true)} />
      <AuthModal isVisible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </AppStateProvider>
  );
}
