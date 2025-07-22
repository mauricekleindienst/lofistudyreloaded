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
import { FaD, FaDiscord } from 'react-icons/fa6';

interface DiscordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiscordModal({ isOpen, onClose }: DiscordModalProps) {
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
              <FaDiscord size={20} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>Join our Discord</h2>
              <p className={styles.modalSubtitle}>
                Connect with the community, get support, and share your progress!
              </p>
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
        <div className={styles.modalContent} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 420 }}>
          <div style={{ width: '100%', maxWidth: 380, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <iframe
              src="https://discord.com/widget?id=1397139010387709952&theme=dark"
              width="100%"
              height="400"
              style={{ borderRadius: '8px', border: 'none', maxWidth: '350px', width: '100%' }}
              allowTransparency={true}
              title="Discord Widget"
              loading="lazy"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
