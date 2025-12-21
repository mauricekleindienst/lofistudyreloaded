'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      color: 'white',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ff7b00' }}>Something went wrong!</h2>
      <p style={{ color: '#9ca3af', marginBottom: '1.5rem', maxWidth: '28rem' }}>
        We encountered an unexpected error. Please try again or return to the homepage.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ff7b00',
            color: 'white',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Try again
        </button>
        <Link 
          href="/"
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: 'white',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
