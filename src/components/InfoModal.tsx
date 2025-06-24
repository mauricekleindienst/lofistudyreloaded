"use client";

import React from 'react';
import { 
  X,
  Info,
  Mail,
  FileText,
  Shield
} from 'lucide-react';
import styles from '../../styles/InfoModal.module.css';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <Info size={24} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>About Lo-Fi.Study</h2>
              <p className={styles.modalSubtitle}>Your ultimate focus companion</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={styles.closeButton}
            title="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className={styles.modalContent}>
          <div className={styles.description}>
            <p>
              Lo-Fi.Study is your ultimate focus companion designed to boost productivity and enhance your study sessions. 
              Our platform combines the power of the Pomodoro technique with ambient soundscapes, customizable backgrounds, 
              and comprehensive progress tracking to create the perfect environment for deep work and learning.
            </p>
          </div>
          
          <div className={styles.features}>
            <h3>Features:</h3>
            <ul>
              <li>🍅 Pomodoro Timer with customizable work and break intervals</li>
              <li>🎵 Curated lo-fi music and ambient sounds</li>
              <li>🎨 Beautiful background videos and images</li>
              <li>📊 Detailed statistics and progress tracking</li>
              <li>📝 Integrated todo list and task management</li>
              <li>☁️ Cloud sync to save your progress across devices</li>
            </ul>
          </div>
          
          <div className={styles.actionButtons}>
            <a 
              href="/contact" 
              className={styles.actionButton}
              onClick={onClose}
            >
              <Mail size={16} />
              Contact
            </a>
            <a 
              href="/legal" 
              className={styles.actionButton}
              onClick={onClose}
            >
              <FileText size={16} />
              Legal Notice
            </a>
            <a 
              href="/privacy" 
              className={styles.actionButton}
              onClick={onClose}
            >
              <Shield size={16} />
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
