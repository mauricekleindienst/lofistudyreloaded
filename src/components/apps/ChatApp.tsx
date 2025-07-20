"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, User, Users, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import styles from '../../../styles/ChatbotApp.module.css';

const ChatApp: React.FC = () => {
  const { user } = useAuth();
  const { 
    messages, 
    loading, 
    onlineUsers, 
    username,
    hasUsername,
    sendMessage: sendChatMessage,
    updateUsername,
    refreshMessages
  } = useRealtimeChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show username dialog if user doesn't have a username
  useEffect(() => {
    if (user && !hasUsername) {
      setUsernameDialogOpen(true);
    }
  }, [user, hasUsername]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set initial username input value when username changes
  useEffect(() => {
    setUsernameInput(username);
  }, [username]);

  const handleSubmitUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!usernameInput.trim()) return;
    
    const success = await updateUsername(usernameInput);
    if (success) {
      setUsernameDialogOpen(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    const success = await sendChatMessage(newMessage);
    if (success) {
      setNewMessage('');
      inputRef.current?.focus();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const generateRandomUsername = () => {
    const randomUsername = `User_${Math.floor(Math.random() * 10000)}`;
    setUsernameInput(randomUsername);
  };

  // If user is not authenticated, show sign-in message
  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.signInContainer}>
          <LogIn size={48} className={styles.signInIcon} />
          <h2>Sign in to use Chat</h2>
          <p>Please sign in to send and receive messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Anonymous Chat</h2>
        <div className={styles.onlineUsers}>
          <Users size={16} />
          <span>{onlineUsers} online</span>
        </div>
        <button 
          onClick={refreshMessages} 
          className={styles.refreshButton}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? styles.spinning : ''} />
        </button>
      </div>

      <div className={styles.messagesContainer}>
        {loading && messages.length === 0 ? (
          <div className={styles.loadingContainer}>
            <RefreshCw size={24} className={`${styles.loadingIcon} animate-spin`} />
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`${styles.message} ${msg.user_id === user?.id ? styles.ownMessage : ''}`}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.username}>
                    {msg.user_id === user?.id ? 'You' : msg.username}
                  </span>
                  <span className={styles.timestamp}>{formatTime(msg.created_at)}</span>
                </div>
                <div className={styles.messageContent}>{msg.message}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form onSubmit={handleSendMessage} className={styles.inputForm}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!user || loading}
          ref={inputRef}
          className={styles.messageInput}
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || !user || loading}
          className={styles.sendButton}
        >
          <Send size={18} />
        </button>
      </form>

      {usernameDialogOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Choose a username</h3>
              <button 
                onClick={generateRandomUsername}
                className={styles.closeButton}
                type="button"
              >
                <User size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmitUsername}>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter a username"
                className={styles.usernameInput}
                autoFocus
              />
              <button 
                type="submit"
                disabled={!usernameInput.trim()}
                className={styles.submitButton}
              >
                Start Chatting
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp; 