"use client";

import Desktop from '@/components/Desktop_modern_refactored';
import { AppStateProvider } from '@/contexts/AppStateContext';
import AuthModal from '@/components/AuthModal';
import { useState } from 'react';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <AppStateProvider>
      <Desktop onShowAuth={() => setShowAuthModal(true)} />
      <AuthModal isVisible={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </AppStateProvider>
  );
}
