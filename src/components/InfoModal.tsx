"use client";

import React from 'react';
import { 
  X,
  Info,
  Mail,
  FileText,
  Shield,
  Music,
  Clock,
  CheckSquare
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
              <Info size={20} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>About Lo-Fi.Study</h2>
              <p className={styles.modalSubtitle}>Your  focus companion</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={styles.closeButton}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div className={styles.modalContent}>
          <div className={styles.description}>
         
          </div>
          
          <div className={styles.features}>
            <h3>Features</h3>
            <ul>
              <li>
                <Clock size={16} className={styles.featureIcon} /> 
                Pomodoro Timer with customizable work and break intervals
              </li>
              <li>
                <Music size={16} className={styles.featureIcon} /> 
                Curated lo-fi music and ambient sounds
              </li>
              <li>
                <CheckSquare size={16} className={styles.featureIcon} /> 
                Integrated todo list and task management
              </li>
              <li>
                <Shield size={16} className={styles.featureIcon} /> 
                Cloud sync to save your progress across devices
              </li>
            </ul>
          </div>
          
          <div className={styles.actionButtons}>
            <a 
              href="/contact" 
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <Mail size={16} />
              Contact
            </a>
            <a 
              href="/legal" 
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <FileText size={16} />
              Legal Notice
            </a>
            <a 
              href="/privacy" 
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
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
