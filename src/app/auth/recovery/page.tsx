'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase/client'

export default function RecoveryHandler() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleRecovery = async () => {
      try {
        // Get the hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        
        if (type === 'recovery' && accessToken && refreshToken) {
          // Set the session with the recovery tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (!error && data.session) {
            // Redirect to password reset page
            router.push('/auth/reset-password')
          } else {
            console.error('Error setting recovery session:', error)
            router.push('/auth/auth-code-error?error=recovery_failed')
          }
        } else {
          // Not a recovery link, redirect to home
          router.push('/')
        }
      } catch (err) {
        console.error('Recovery handling error:', err)
        router.push('/auth/auth-code-error?error=recovery_failed')
      }
    }

    handleRecovery()
  }, [])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      <div>Processing recovery link...</div>
    </div>
  )
}