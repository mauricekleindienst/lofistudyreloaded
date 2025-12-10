"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw, User, Users, LogIn, MessageSquare } from 'lucide-react';
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
    if (user && !hasUsername && !loading) {
      setUsernameDialogOpen(true);
    }
  }, [user, hasUsername, loading]);

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

  const formatDateSeparator = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const groupMessagesByDate = (messages: Array<{ id: string; created_at: string; user_id: string; username: string; message: string }>) => {
    const grouped: { date: string; messages: Array<{ id: string; created_at: string; user_id: string; username: string; message: string }> }[] = [];
    
    messages.forEach((message) => {
      const messageDate = new Date(message.created_at).toDateString();
      const lastGroup = grouped[grouped.length - 1];
      
      if (lastGroup && lastGroup.date === messageDate) {
        lastGroup.messages.push(message);
      } else {
        grouped.push({
          date: messageDate,
          messages: [message]
        });
      }
    });
    
    return grouped;
  };

  const generateRandomUsername = () => {
    const adjectives = ['Happy', 'Lucky', 'Sunny', 'Cozy', 'Calm', 'Focus', 'Chill', 'Quiet'];
    const nouns = ['Student', 'Learner', 'Coder', 'Writer', 'Reader', 'Thinker', 'Mind', 'Soul'];
    const randomUsername = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={20} />
          <h2>Community Chat</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={styles.onlineUsers}>
            <Users size={14} />
            <span>{onlineUsers} online</span>
          </div>
          <button 
            onClick={refreshMessages} 
            className={styles.refreshButton}
            disabled={loading}
            title="Refresh messages"
          >
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          </button>
        </div>
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
            {groupMessagesByDate(messages).map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                <div className={styles.dateSeparator}>
                  <div className={styles.dateLine}></div>
                  <span className={styles.dateText}>
                    {formatDateSeparator(group.messages[0].created_at)}
                  </span>
                  <div className={styles.dateLine}></div>
                </div>
                {group.messages.map((msg) => (
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
              </React.Fragment>
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