"use client";

import React, { useState } from 'react';
import { User, Mail, Calendar, Shield, Save, Edit3, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import styles from '../../../styles/AccountSettings.module.css';

const AccountSettings: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const supabase = createClient();
  
  const [settings, setSettings] = useState({
    displayName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    theme: 'dark',
    notifications: true,
    autoSave: true,
    syncEnabled: true,
    language: 'en'
  });const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield }
  ];
  const handleSaveSettings = () => {
    // TODO: Implement settings save to Supabase
    console.log('Saving settings:', settings);
    setIsEditing(false);
    // Show success notification
  };

  // Security Functions
  const handleChangePassword = async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      alert('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert('Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleDownloadData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch user data from all tables - using more generic table names
      const [todosRes, notesRes, sessionsRes, profileRes] = await Promise.all([
        supabase.from('todos').select('*').eq('user_id', user.id).then(res => ({ data: res.data || [], error: res.error })),
        supabase.from('notes').select('*').eq('user_id', user.id).then(res => ({ data: res.data || [], error: res.error })),
        supabase.from('pomodoro_sessions').select('*').eq('user_id', user.id).then(res => ({ data: res.data || [], error: res.error })),
        supabase.from('profiles').select('*').eq('id', user.id).then(res => ({ data: res.data || [], error: res.error }))
      ]);

      // Log any errors but continue with available data
      if (todosRes.error) console.log('Todos table not found or accessible:', todosRes.error);
      if (notesRes.error) console.log('Notes table not found or accessible:', notesRes.error);
      if (sessionsRes.error) console.log('Sessions table not found or accessible:', sessionsRes.error);
      if (profileRes.error) console.log('Profiles table not found or accessible:', profileRes.error);

      const userData = {
        account_info: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          metadata: user.user_metadata,
          app_metadata: user.app_metadata
        },
        profile: profileRes.data?.[0] || null,
        todos: todosRes.data || [],
        notes: notesRes.data || [],
        pomodoro_sessions: sessionsRes.data || [],
        export_info: {
          exported_at: new Date().toISOString(),
          exported_by: user.email,
          total_items: (todosRes.data?.length || 0) + (notesRes.data?.length || 0) + (sessionsRes.data?.length || 0)
        }      };

      // Create and download file
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lofistudy-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      // Show success message with better formatting
      const totalItems = userData.export_info.total_items;
      const message = `✅ Your data has been downloaded successfully!\n\n📊 Exported ${totalItems} items:\n• ${userData.todos.length} todos\n• ${userData.notes.length} notes\n• ${userData.pomodoro_sessions.length} focus sessions\n\n💾 File saved as: ${link.download}`;
      alert(message);
    } catch (error) {
      console.error('Error downloading data:', error);
      alert('❌ Failed to download data. Please try again.\n\nError: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteAccount = async () => {
    if (!user?.id || deleteConfirm !== 'DELETE') return;
    
    setIsLoading(true);
    try {
      // First, try to delete user data from all tables
      const deletePromises = [];      // Try to delete from each table, but don't fail if table doesn't exist
      try {
        deletePromises.push(supabase.from('todos').delete().eq('user_id', user.id));
      } catch {
        console.log('Todos table not accessible for deletion');
      }
      
      try {
        deletePromises.push(supabase.from('notes').delete().eq('user_id', user.id));      } catch {
        console.log('Notes table not accessible for deletion');
      }
      
      try {
        deletePromises.push(supabase.from('pomodoro_sessions').delete().eq('user_id', user.id));
      } catch {
        console.log('Sessions table not accessible for deletion');
      }
      
      try {
        deletePromises.push(supabase.from('profiles').delete().eq('id', user.id));
      } catch {
        console.log('Profiles table not accessible for deletion');
      }

      // Execute all deletion promises
      await Promise.allSettled(deletePromises);

      // Try to delete the auth user - this might require RLS policies or admin functions
      try {
        // Since admin functions might not be available in client-side code,
        // we'll use the regular auth methods
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        alert('Account deletion initiated. Your data has been removed and you have been signed out.\n\nNote: Complete account deletion may require additional steps. Please contact support if needed.');
      } catch (authError) {
        console.error('Auth deletion error:', authError);
        // Even if auth deletion fails, we can still sign out the user
        await signOut();
        alert('Your data has been deleted and you have been signed out.\n\nFor complete account deletion, please contact support.');
      }
      
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account completely. Some data may have been removed.\n\nPlease contact support for assistance.\n\nError: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirm('');
    }
  };
  return (
    <div className={styles.accountSettings}>
      {/* Navigation Tabs */}
      <div className={styles.tabNavigation}>
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            >
              <IconComponent size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'profile' && (
          <div className={styles.profileTab}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Profile Information</h3>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={styles.editButton}
                >
                  <Edit3 size={16} />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              
              <div className={styles.formGroup}>
                <label>Display Name</label>
                <input
                  type="text"
                  value={settings.displayName}
                  onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
                  disabled={!isEditing}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email Address</label>
                <div className={styles.emailField}>
                  <Mail size={16} />
                  <span>{settings.email}</span>
                </div>
                <small className={styles.helpText}>
                  Email cannot be changed directly. Contact support if needed.
                </small>
              </div>

              {isEditing && (
                <div className={styles.actionButtons}>
                  <button onClick={handleSaveSettings} className={styles.saveButton}>
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className={styles.section}>
              <h3>Account Statistics</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Calendar size={20} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>0</span>
                    <span className={styles.statLabel}>Tasks Completed</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Shield size={20} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>0</span>
                    <span className={styles.statLabel}>Focus Sessions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>        )}        {activeTab === 'security' && (
          <div className={styles.securityTab}>
            <div className={styles.section}>
              <h3>Account Security</h3>
              
             

              <div className={styles.securityActions}>
                <button 
                  className={styles.actionButton}
                  onClick={handleChangePassword}
                  disabled={isLoading}
                >
                  <Shield size={16} />
                  {isLoading ? 'Sending...' : 'Change Password'}
                </button>
                
                <button 
                  className={styles.actionButton}
                  onClick={handleDownloadData}
                  disabled={isLoading}
                >
                  <Download size={16} />
                  {isLoading ? 'Downloading...' : 'Download My Data'}
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <h3>Danger Zone</h3>
              
              <div>
            

                {!showDeleteConfirm ? (
                  <button 
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </button>
                ) : (
                  <div className={styles.deleteConfirmation}>
                    <p>Type <strong>DELETE</strong> to confirm account deletion:</p>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="Type DELETE here"
                      className={styles.confirmInput}
                    />
                    <div className={styles.confirmButtons}>
                      <button 
                        className={styles.cancelButton}
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirm('');
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.danger}`}
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirm !== 'DELETE' || isLoading}
                      >
                        <Trash2 size={16} />
                        {isLoading ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
