"use client";

import React, { useState } from 'react';
import { X, Github } from 'lucide-react';
import { FaDiscord, FaGoogle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { createClient } from '../utils/supabase/client';
import styles from '../../styles/Auth.module.css';

interface AuthModalProps {
  isVisible: boolean;
  onClose: () => void;
}

// Add this at the top of the component to debug
const AuthModal: React.FC<AuthModalProps> = ({ isVisible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signInWithProvider, isConfigured } = useAuth();
  const supabase = createClient();
  



  const handleOAuthSignIn = async (provider: 'discord' | 'github' | 'google') => {
    setLoading(true);
    setError('');
    
    try {
      const { error } = await signInWithProvider(provider);
      
      if (error) {
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
            Sign In / Sign Up
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.authContent}>
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
                Select a provider to continue
              </p>

              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              
              <div className={styles.oauthButtons}>
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
              </div>

              <div className={styles.authSwitch}>
                <p>By signing up, you agree to our <a href="/legal" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
