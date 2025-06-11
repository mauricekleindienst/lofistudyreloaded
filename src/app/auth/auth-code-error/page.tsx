'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../../../../styles/AuthError.module.css'

export default function AuthCodeError() {
  const router = useRouter()
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // Get error details from URL hash or search params
    const hash = window.location.hash
    const searchParams = new URLSearchParams(window.location.search)
    
    const errorDescription = searchParams.get('error_description') || 
                           hash.match(/error_description=([^&]*)/)?.[1] ||
                           'An unknown authentication error occurred'
    
    setError(decodeURIComponent(errorDescription))
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.content}>
          <div className={styles.icon}>
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h1 className={styles.title}>
            Authentication Error
          </h1>
          
          <p className={styles.message}>
            {error || 'There was a problem signing you in. Please try again.'}
          </p>
          
          <div className={styles.buttonGroup}>
            <button
              onClick={() => router.push('/')}
              className={`${styles.button} ${styles.primaryButton}`}
            >
              Return to Home
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className={`${styles.button} ${styles.secondaryButton}`}
            >
              Try Again
            </button>
          </div>
          
          <div className={styles.helpSection}>
            <h3 className={styles.helpTitle}>
              Common Solutions:
            </h3>
            <ul className={styles.helpList}>
              <li>• Check your internet connection</li>
              <li>• Clear browser cache and cookies</li>
              <li>• Try a different browser</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
