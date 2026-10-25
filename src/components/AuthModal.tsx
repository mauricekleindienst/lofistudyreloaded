"use client";

import React, { useEffect, useRef, useState } from 'react';
import { X, Github, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { FaDiscord, FaGoogle } from 'react-icons/fa';
import { useAuth, type OAuthProvider } from '../contexts/AuthContext';
import styles from '../../styles/Auth.module.css';

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const PROVIDERS: Record<OAuthProvider, { label: string; icon: React.ReactNode }> = {
  google: { label: 'Google', icon: <FaGoogle size={16} /> },
  github: { label: 'GitHub', icon: <Github size={16} /> },
  discord: { label: 'Discord', icon: <FaDiscord size={18} /> },
};

const AuthModal: React.FC<AuthModalProps> = ({ isVisible, onClose }) => {
  const { signIn, signUp, signInWithProvider, providers } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isVisible) return;
    setError('');
    const t = window.setTimeout(() => emailRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (mode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    const { error: err } = mode === 'signin' ? await signIn(email, password) : await signUp(email, password, name);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setPassword('');
    onClose();
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
  };

  return (
    <div className={styles.authOverlay} onClick={onClose}>
      <div
        className={styles.authModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <div className={styles.authHeader}>
          <h2 className={styles.authTitle} id="auth-title">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={styles.authContent}>
          <p className={styles.authSubtitle}>
            {mode === 'signin'
              ? 'Sign in to sync your tasks, notes and focus stats across devices.'
              : 'Free forever. Anything you made as a guest moves into your account.'}
          </p>

          {error && (
            <div className={styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          <form className={styles.authForm} onSubmit={handleSubmit} noValidate={false}>
            {mode === 'signup' && (
              <div className={styles.inputGroup}>
                <User size={16} className={styles.inputIcon} aria-hidden />
                <input
                  className={styles.authInput}
                  type="text"
                  placeholder="Display name (optional)"
                  aria-label="Display name"
                  autoComplete="nickname"
                  maxLength={40}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div className={styles.inputGroup}>
              <Mail size={16} className={styles.inputIcon} aria-hidden />
              <input
                ref={emailRef}
                className={styles.authInput}
                type="email"
                placeholder="Email"
                aria-label="Email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={`${styles.inputGroup} ${styles.passwordContainer}`}>
              <Lock size={16} className={styles.inputIcon} aria-hidden />
              <input
                className={styles.authInput}
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'signup' ? 'Password (min. 8 characters)' : 'Password'}
                aria-label="Password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={mode === 'signup' ? 8 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? (
                <Loader2 size={18} className={styles.spin} aria-label="Loading" />
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {providers.length > 0 && (
            <>
              <div className={styles.divider}>
                <span>or continue with</span>
              </div>
              <div className={styles.oauthButtons}>
                {providers.map((p) => (
                  <button
                    key={p}
                    onClick={() => signInWithProvider(p)}
                    className={styles.oauthButton}
                    disabled={loading}
                    type="button"
                  >
                    {PROVIDERS[p].icon}
                    {PROVIDERS[p].label}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className={styles.authSwitch}>
            <p>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" className={styles.switchButton} onClick={switchMode}>
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </button>
            </p>
            <p className={styles.legalNote}>
              By continuing you agree to our{' '}
              <a href="/legal" target="_blank" rel="noopener">
                Terms
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" rel="noopener">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
