'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase/client'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import styles from '../../../../styles/Auth.module.css'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [hasValidToken, setHasValidToken] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (session && !error) {
          setHasValidToken(true)
        } else {
          // Try to get session from URL hash
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken && refreshToken) {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (!sessionError && data.session) {
              setHasValidToken(true)
            } else {
              setError('Invalid or expired reset link. Please request a new password reset.')
            }
          } else {
            setError('Invalid or expired reset link. Please request a new password reset.')
          }
        }
      } catch (err) {
        console.error('Error checking session:', err)
        setError('An error occurred. Please try again.')
      }
    }

    checkSession()
  }, [])

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(pwd)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validate passwords
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })
      
      if (updateError) {
        throw updateError
      }
      
      setSuccess(true)
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
      
    } catch (err: any) {
      console.error('Error updating password:', err)
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasValidToken && !error) {
    return (
      <div className={styles.container}>
        <div className={styles.authCard}>
          <div className={styles.logoContainer}>
            <img src="/lofistudy.png" alt="LoFi Study" width={200} height={60} />
          </div>
          <h1 className={styles.title}>Verifying Reset Link...</h1>
          <p className={styles.subtitle}>Please wait while we verify your password reset link.</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.authCard}>
          <div className={styles.logoContainer}>
            <img src="/lofistudy.png" alt="LoFi Study" width={200} height={60} />
          </div>
          <div className={styles.messageContainer}>
            <div className={styles.successMessage}>
              <CheckCircle className={styles.messageIcon} />
              <span>Password updated successfully! Redirecting you to the app...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.overlay}></div>
      
      <div className={styles.authCard}>
        <div className={styles.logoContainer}>
          <img src="/lofistudy.png" alt="LoFi Study" width={200} height={60} />
        </div>
        
        <h1 className={styles.title}>Reset Your Password</h1>
        <p className={styles.subtitle}>
          Enter your new password below. Make sure it's strong and secure.
        </p>
        
        {error && (
          <div className={styles.messageContainer}>
            <div className={styles.errorMessage}>
              <AlertCircle className={styles.messageIcon} />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {hasValidToken && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                New Password
              </label>
              <div className={styles.passwordContainer}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your new password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className={styles.passwordToggleIcon} />
                  ) : (
                    <Eye className={styles.passwordToggleIcon} />
                  )}
                </button>
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm New Password
              </label>
              <div className={styles.passwordContainer}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Confirm your new password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={styles.passwordToggle}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className={styles.passwordToggleIcon} />
                  ) : (
                    <Eye className={styles.passwordToggleIcon} />
                  )}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? (
                <span className={styles.loadingSpinner}>Updating Password...</span>
              ) : (
                <>Update Password</>
              )}
            </button>
          </form>
        )}
        
        <div className={styles.links}>
          <button
            type="button"
            onClick={() => router.push('/')}
            className={styles.linkButton}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}