"use client";

import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, Save, Edit3, Download, Trash2, LogOut, CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { openAuthModal } from '../../lib/ui';
import styles from '../../../styles/AccountSettings.module.css';

type Message = { type: 'success' | 'error'; text: string } | null;

const AccountSettings: React.FC = () => {
  const { user, signOut, updateProfile, changePassword, deleteAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [profileMessage, setProfileMessage] = useState<Message>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<Message>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && !isEditing) setDisplayName(user.full_name);
  }, [user, isEditing]);

  // A different account (or signing out) starts from a clean form — nothing typed for the
  // previous account, like a half-finished delete confirmation, may carry over.
  const [shownUser, setShownUser] = useState(user?.id);
  if (shownUser !== user?.id) {
    setShownUser(user?.id);
    setIsEditing(false);
    setProfileMessage(null);
    setCurrentPassword('');
    setNewPassword('');
    setPasswordMessage(null);
    setShowDeleteConfirm(false);
    setDeleteConfirm('');
    setDeletePassword('');
    setDeleteError('');
  }

  if (!user) {
    return (
      <div className={styles.accountSettings}>
        <div className={styles.section} style={{ textAlign: 'center' }}>
          <LogIn size={40} style={{ margin: '0 auto 12px', opacity: 0.8 }} />
          <h3>You&apos;re using Lo-Fi.Study as a guest</h3>
          <p className={styles.helpText}>
            Your tasks, notes and stats are saved on this device. Create a free account to sync them everywhere and
            join the leaderboard and chat.
          </p>
          <button className={styles.saveButton} onClick={openAuthModal} style={{ margin: '16px auto 0' }}>
            <LogIn size={16} /> Sign in or create account
          </button>
        </div>
      </div>
    );
  }

  const flash = (set: (m: Message) => void, message: Message, ms = 4000) => {
    set(message);
    window.setTimeout(() => set(null), ms);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await updateProfile({ full_name: displayName.trim() });
    setSavingProfile(false);
    if (error) {
      flash(setProfileMessage, { type: 'error', text: error }, 6000);
    } else {
      setIsEditing(false);
      flash(setProfileMessage, { type: 'success', text: 'Profile updated' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      flash(setPasswordMessage, { type: 'error', text: 'New password must be at least 8 characters' }, 6000);
      return;
    }
    setSavingPassword(true);
    const { error } = await changePassword(currentPassword, newPassword);
    setSavingPassword(false);
    if (error) {
      flash(setPasswordMessage, { type: 'error', text: error }, 6000);
    } else {
      setCurrentPassword('');
      setNewPassword('');
      flash(setPasswordMessage, { type: 'success', text: 'Password saved. Other devices were signed out.' });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    const { error } = await deleteAccount(deletePassword);
    setDeleting(false);
    if (error) setDeleteError(error);
  };

  return (
    <div className={styles.accountSettings}>
      <div className={styles.tabNavigation} role="tablist">
        {([
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'security', label: 'Security', icon: Shield },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`${styles.tabButton} ${activeTab === id ? styles.active : ''}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'profile' && (
          <div className={styles.profileTab}>
            <form className={styles.section} onSubmit={handleSaveProfile}>
              <div className={styles.sectionHeader}>
                <h3>Profile</h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setProfileMessage(null);
                  }}
                  className={styles.editButton}
                  disabled={savingProfile}
                >
                  <Edit3 size={16} />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {profileMessage && (
                <div className={`${styles.message} ${styles[profileMessage.type]}`} role="status">
                  {profileMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {profileMessage.text}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="account-name">Display name</label>
                <input
                  id="account-name"
                  type="text"
                  value={displayName}
                  maxLength={40}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!isEditing || savingProfile}
                  className={styles.input}
                  autoComplete="nickname"
                />
                <small className={styles.helpText}>Shown on the leaderboard and in chat.</small>
              </div>

              <div className={styles.formGroup}>
                <label>Email</label>
                <div className={styles.emailField}>
                  <Mail size={16} />
                  <span>{user.email}</span>
                </div>
                {user.providers.length > 0 && (
                  <small className={styles.helpText}>Linked: {user.providers.join(', ')}</small>
                )}
              </div>

              {isEditing && (
                <div className={styles.actionButtons}>
                  <button type="submit" className={styles.saveButton} disabled={savingProfile || displayName.trim().length < 2}>
                    <Save size={16} />
                    {savingProfile ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className={styles.securityTab}>
            <form className={styles.section} onSubmit={handleChangePassword}>
              <h3>{user.has_password ? 'Change password' : 'Set a password'}</h3>
              {!user.has_password && (
                <p className={styles.helpText}>Add a password to also sign in with your email.</p>
              )}
              {passwordMessage && (
                <div className={`${styles.message} ${styles[passwordMessage.type]}`} role="status">
                  {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {passwordMessage.text}
                </div>
              )}
              {user.has_password && (
                <div className={styles.formGroup}>
                  <label htmlFor="current-password">Current password</label>
                  <input
                    id="current-password"
                    type="password"
                    className={styles.input}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              )}
              <div className={styles.formGroup}>
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  className={styles.input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <small className={styles.helpText}>At least 8 characters.</small>
              </div>
              <button type="submit" className={styles.saveButton} disabled={savingPassword}>
                <Shield size={16} />
                {savingPassword ? 'Saving…' : 'Save password'}
              </button>
            </form>

            <div className={styles.section}>
              <h3>Your data</h3>
              <div className={styles.securityActions}>
                <a className={styles.actionButton} href="/api/account/export" download>
                  <Download size={16} />
                  Download my data
                </a>
                <button className={`${styles.actionButton} ${styles.logoutButton}`} onClick={() => signOut()}>
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <h3>Danger zone</h3>
              {!showDeleteConfirm ? (
                <button className={`${styles.actionButton} ${styles.danger}`} onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={16} />
                  Delete account
                </button>
              ) : (
                <div className={styles.deleteConfirmation}>
                  <p>
                    This permanently deletes your account, tasks, notes, appointments, stats and chat messages. Type{' '}
                    <strong>DELETE</strong> to confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    aria-label="Type DELETE to confirm"
                    className={styles.confirmInput}
                  />
                  {user.has_password && (
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Your password"
                      aria-label="Your password"
                      autoComplete="current-password"
                      className={styles.confirmInput}
                    />
                  )}
                  {deleteError && <small className={styles.errorText}>{deleteError}</small>}
                  <div className={styles.confirmButtons}>
                    <button
                      className={styles.cancelButton}
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirm('');
                        setDeletePassword('');
                        setDeleteError('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.danger}`}
                      onClick={handleDelete}
                      disabled={deleteConfirm !== 'DELETE' || (user.has_password && !deletePassword) || deleting}
                    >
                      <Trash2 size={16} />
                      {deleting ? 'Deleting…' : 'Delete forever'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
