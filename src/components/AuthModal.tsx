"use client";

import React, { useState } from 'react';
import { X, Mail, Lock, Github } from 'lucide-react';
import { FaDiscord, FaGoogle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import styles from '../../styles/Auth.module.css';

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isVisible, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp, signInWithProvider, isConfigured } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);      if (error) {
        setError(typeof error === 'object' && error && 'message' in error ? (error as { message: string }).message : 'Authentication failed');
      } else {
        if (isSignUp) {
          setError('Check your email for the confirmation link!');
        } else {
          onClose();
        }
      }    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };  const handleOAuthSignIn = async (provider: 'discord' | 'github' | 'google') => {
    setLoading(true);
    setError('');
    
    try {
      const { error } = await signInWithProvider(provider);      if (error) {
        console.error(`${provider} OAuth error:`, error);
        
        // Provide user-friendly error messages
        const errorMessage = typeof error === 'object' && error && 'message' in error ? (error as { message: string }).message : '';
        if (errorMessage?.includes('not configured')) {
          setError(`${provider} authentication is not configured. Please check the configuration.`);
        } else if (errorMessage?.includes('unavailable')) {
          setError(`Authentication service is temporarily unavailable. Please try again later.`);
        } else {
          setError(`${provider} sign-in failed: ${errorMessage || 'Unknown error'}`);
        }
      } else {
        // OAuth initiated successfully, user will be redirected
        setError('Redirecting to ' + provider + '...');
      }
    } catch (err) {
      console.error(`${provider} OAuth exception:`, err);
      setError(`An unexpected error occurred during ${provider} sign-in.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.authOverlay} onClick={onClose}>
      <div className={styles.authModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.authHeader}>
          <h2 className={styles.authTitle}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>        <div className={styles.authContent}>
          {!isConfigured ? (
            <div className={styles.configWarning}>
              <h3>⚙️ Authentication Setup Required</h3>
              <p>To enable authentication features, please configure your Supabase credentials:</p>
              <ol>
                <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
                <li>Copy your project URL and anonymous key</li>
                <li>Update the <code>.env.local</code> file with your credentials</li>
              </ol>
              <p>The app will work without authentication, but you won&apos;t be able to save your progress.</p>
            </div>
          ) : (
            <>
              <p className={styles.authSubtitle}>
                {isSignUp 
                  ? 'Sign up to save your progress and sync across devices'
                  : 'Sign in to access your saved data and analytics'
                }
              </p>

              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.inputGroup}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.authInput}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.authInput}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className={styles.authButton}
              disabled={loading}
            >
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>          <div className={styles.divider}>
            <span>or continue with</span>
          </div>          <div className={styles.oauthButtons}>
            <button
              onClick={() => handleOAuthSignIn('discord')}
              className={styles.oauthButton}
              disabled={loading}
            >
              <FaDiscord size={18} />
              Discord
            </button>
            <button
              onClick={() => handleOAuthSignIn('github')}
              className={styles.oauthButton}
              disabled={loading}
            >
              <Github size={18} />
              GitHub
            </button>
            <button
              onClick={() => handleOAuthSignIn('google')}
              className={styles.oauthButton}
              disabled={loading}
            >
              <FaGoogle size={18} />
              Google
            </button>
          </div><div className={styles.authSwitch}>
            {isSignUp ? 'Already have an account?' : 'Don&apos;t have an account?'}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className={styles.switchButton}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
