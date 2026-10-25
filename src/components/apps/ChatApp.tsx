"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Send, RefreshCw, User, Users, LogIn, X } from 'lucide-react';
import { openAuthModal } from '../../lib/ui';
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
    sendMessage: sendChatMessage,
    updateUsername,
    refreshMessages
  } = useRealtimeChat();

  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Follow new messages only while the reader is at the bottom; don't yank
  // them away from history they scrolled up to read.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

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

    // One send at a time: a double Enter must not post the message twice.
    if (!newMessage.trim() || !user || sending) return;

    stickToBottom.current = true;
    setSending(true);
    try {
      const success = await sendChatMessage(newMessage);
      if (success) {
        setNewMessage('');
        inputRef.current?.focus();
      }
    } finally {
      setSending(false);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.onlineUsers} title="People with the chat open in the last minute">
          <span className={styles.onlineDot} aria-hidden />
          <Users size={14} />
          <span>{onlineUsers} online</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {user && (
            <button
              onClick={() => setUsernameDialogOpen(true)}
              className={styles.refreshButton}
              title="Change display name"
              aria-label="Change display name"
            >
              <User size={16} />
            </button>
          )}
          <button
            onClick={refreshMessages}
            className={styles.refreshButton}
            disabled={loading}
            title="Refresh messages"
            aria-label="Refresh messages"
          >
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          </button>
        </div>
      </div>

      <div className={styles.messagesContainer} ref={scrollRef} onScroll={handleScroll} aria-live="polite">
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
          </>
        )}
      </div>

      {user ? (
        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            aria-label="Message"
            maxLength={500}
            enterKeyHint="send"
            ref={inputRef}
            className={styles.messageInput}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={styles.sendButton}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      ) : (
        <div className={styles.inputForm}>
          <button type="button" className={styles.submitButton} onClick={openAuthModal}>
            <LogIn size={16} /> Sign in to join the conversation
          </button>
        </div>
      )}

      {usernameDialogOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Your display name</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={generateRandomUsername}
                  className={styles.closeButton}
                  title="Randomize"
                  type="button"
                >
                  <RefreshCw size={14} />
                </button>
                {username && (
                  <button
                    onClick={() => setUsernameDialogOpen(false)}
                    className={styles.closeButton}
                    title="Close"
                    type="button"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
            <form onSubmit={handleSubmitUsername}>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Display name"
                maxLength={40}
                aria-label="Display name"
                className={styles.usernameInput}
                autoFocus
              />
              <button
                type="submit"
                disabled={usernameInput.trim().length < 2}
                className={styles.submitButton}
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;