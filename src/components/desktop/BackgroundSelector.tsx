"use client";

import React, { useState, useCallback } from 'react';
import { X, CheckSquare, Play, Loader2, AlertCircle, Youtube, Image } from 'lucide-react';
import { backgrounds } from '@/data/backgrounds';
import { processYouTubeUrl, isValidYouTubeUrl } from '@/utils/youtube';
import styles from '../../../styles/BackgroundSelector.module.css';

interface Background {
  id: number;
  src: string;
  alt: string;
  note: string;
  createdby: string;
  priority: boolean;
  category: string;
  isYoutube?: boolean;
  videoId?: string;
}

interface BackgroundSelectorProps {
  showBackgrounds: boolean;
  currentBackground: Background;
  selectedCategory: string;
  youtubeUrl: string;
  customBackground: Background | null;
  onClose: () => void;
  onBackgroundChange: (background: Background) => void;
  onCategoryChange: (category: string) => void;
  onYoutubeSubmit: (background: Background) => void;
  onYoutubeUrlChange: (url: string) => void;
  onClearCustomBackground?: () => void;
}

const categories = [
  { id: 'all', name: 'All', icon: '🌍', count: 0 },
  { id: 'nature', name: 'Nature', icon: '🌿', count: 0 },
  { id: 'urban', name: 'Urban', icon: '🏙️', count: 0 },
  { id: 'cozy', name: 'Cozy', icon: '🏠', count: 0 },
  { id: 'gaming', name: 'Gaming', icon: '🎮', count: 0 },
];

export default function BackgroundSelector({
  showBackgrounds,
  currentBackground,
  selectedCategory,
  youtubeUrl,
  customBackground,
  onClose,
  onBackgroundChange,
  onCategoryChange,
  onYoutubeSubmit,
  onYoutubeUrlChange,
  onClearCustomBackground
}: BackgroundSelectorProps) {
  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const [youtubeError, setYoutubeError] = useState<string>('');
  const [isSubmittingYoutube, setIsSubmittingYoutube] = useState(false);

  const handleVideoPreview = useCallback((videoElement: HTMLVideoElement, isEntering: boolean) => {
    if (isEntering) {
      videoElement.currentTime = 0;
      videoElement.play().catch(() => {
        // Silently handle autoplay failures
      });
    } else {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  }, []);

  if (!showBackgrounds) return null;

  // Calculate category counts
  const categoryCounts = categories.map(category => ({
    ...category,
    count: category.id === 'all' 
      ? backgrounds.length 
      : backgrounds.filter(bg => bg.category === category.id).length
  }));

  const getFilteredBackgrounds = () => {
    let filtered = backgrounds;
    if (selectedCategory !== 'all') {
      filtered = backgrounds.filter(bg => bg.category === selectedCategory);
    }
    return filtered; // Return all filtered backgrounds without limiting
  };

  const validateYoutubeUrl = (url: string): boolean => {
    return isValidYouTubeUrl(url);
  };

  const handleYoutubeSubmit = async () => {
    if (!youtubeUrl.trim()) {
      setYoutubeError('Please enter a YouTube URL');
      return;
    }

    if (!validateYoutubeUrl(youtubeUrl)) {
      setYoutubeError('Please enter a valid YouTube URL');
      return;
    }

    setIsSubmittingYoutube(true);
    setYoutubeError('');
    
    try {
      const youtubeBackground = processYouTubeUrl(youtubeUrl);
      if (youtubeBackground) {
        await onYoutubeSubmit(youtubeBackground);
        onYoutubeUrlChange(''); // Clear the input after successful submission
      } else {
        setYoutubeError('Failed to process YouTube URL');
      }
    } catch (error) {
      console.error('YouTube submission error:', error);
      setYoutubeError('Failed to add YouTube background');
    } finally {
      setIsSubmittingYoutube(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <div className={styles.icon}>
              <Image size={24} aria-label="Background gallery icon" />
            </div>
            <div className={styles.titleText}>
              <h3 className={styles.title}>Background Gallery</h3>
              <p className={styles.subtitle}>Choose your perfect study ambiance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close gallery"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* YouTube Section */}
          <div className={styles.youtubeSection}>
            <div className={styles.youtubeSectionHeader}>
              <div className={styles.youtubeSectionIcon}>
                <Youtube size={18} />
              </div>
              <h4 className={styles.youtubeSectionTitle}>Add Custom YouTube Background</h4>
            </div>
            <div className={styles.youtubeInputContainer}>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => {
                  onYoutubeUrlChange(e.target.value);
                  setYoutubeError('');
                }}
                placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)"
                className={`${styles.youtubeInput} ${youtubeError ? styles.error : ''}`}
                disabled={isSubmittingYoutube}
              />
              <button
                onClick={handleYoutubeSubmit}
                className={styles.youtubeSubmitButton}
                disabled={!youtubeUrl.trim() || isSubmittingYoutube}
              >
                {isSubmittingYoutube ? (
                  <Loader2 size={14} className={styles.spinner} />
                ) : (
                  'Add'
                )}
              </button>
            </div>
            {youtubeError && (
              <div className={styles.errorMessage}>
                <AlertCircle size={14} />
                <span>{youtubeError}</span>
              </div>
            )}
          </div>
          
          {/* Categories */}
          <div className={styles.categories}>
            {categoryCounts.map(category => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`${styles.categoryButton} ${
                  selectedCategory === category.id ? styles.active : ''
                }`}
                aria-label={`Filter by ${category.name}`}
              >
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span>{category.name}</span>
                <span className={styles.categoryCount}>({category.count})</span>
              </button>
            ))}
          </div>

          {/* Wallpaper Grid */}
          <div className={styles.wallpaperGrid}>
            {/* Custom YouTube background */}
            {customBackground && (
              <div
                key="custom-youtube"
                className={`${styles.wallpaperBox} ${styles.youtube} ${
                  currentBackground.id === customBackground.id ? styles.selected : ''
                }`}
                onClick={() => {
                  onBackgroundChange(customBackground);
                  onClose();
                }}
              >
                <iframe
                  src={customBackground.src}
                  className={styles.wallpaperMedia}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="Custom YouTube Background"
                />
                <div className={styles.wallpaperOverlay}>
                  <div className={styles.wallpaperInfo}>
                    <div className={styles.wallpaperName}>
                      <Youtube size={12} />
                      {customBackground.alt}
                    </div>
                    <div className={styles.wallpaperCategory}>Custom</div>
                  </div>
                  <button
                    className={styles.removeCustomButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Remove the custom background
                      if (currentBackground.id === customBackground.id) {
                        // Switch to default background if current is being removed
                        onBackgroundChange(backgrounds[0]);
                      }
                      // Clear the custom background
                      if (onClearCustomBackground) {
                        onClearCustomBackground();
                      }
                      onYoutubeUrlChange('');
                    }}
                    title="Remove custom background"
                  >
                    <X size={10} />
                  </button>
                </div>
                {currentBackground.id === customBackground.id && (
                  <div className={styles.selectionIndicator}>
                    <CheckSquare size={12} />
                  </div>
                )}
              </div>
            )}

            {/* Regular backgrounds */}
            {getFilteredBackgrounds().map(bg => (
              <div
                key={bg.id}
                className={`${styles.wallpaperBox} ${
                  currentBackground.id === bg.id ? styles.selected : ''
                }`}
                onClick={() => {
                  onBackgroundChange(bg);
                  onClose();
                }}
              >
                <video
                  src={bg.src}
                  className={styles.wallpaperMedia}
                  muted
                  loop
                  preload="metadata"
                  aria-label={`Background video: ${bg.alt}`}
                  title={bg.alt}
                  onMouseEnter={(e) => {
                    setPreviewingId(bg.id);
                    handleVideoPreview(e.currentTarget, true);
                  }}
                  onMouseLeave={(e) => {
                    setPreviewingId(null);
                    handleVideoPreview(e.currentTarget, false);
                  }}
                  onError={() => {
                    console.error(`Failed to load video: ${bg.src}`);
                  }}
                />
                <div className={styles.wallpaperOverlay}>
                  <div className={styles.wallpaperInfo}>
                    <div className={styles.wallpaperName}>{bg.alt}</div>
                    <div className={styles.wallpaperCategory}>
                      {bg.category.charAt(0).toUpperCase() + bg.category.slice(1)}
                    </div>
                  </div>
                </div>
                {currentBackground.id === bg.id && (
                  <div className={styles.selectionIndicator}>
                    <CheckSquare size={12} />
                  </div>
                )}
                {previewingId === bg.id && (
                  <div className={styles.playingIndicator}>
                    <Play size={12} />
                  </div>
                )}
              </div>
            ))}

            {/* Empty state */}
            {getFilteredBackgrounds().length === 0 && !customBackground && (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>🎨</div>
                <h4 className={styles.emptyStateTitle}>No backgrounds found</h4>
                <p className={styles.emptyStateMessage}>
                  Try selecting a different category or add a custom YouTube background
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <span>
              {getFilteredBackgrounds().length} {
                selectedCategory === 'all' ? 'total' : selectedCategory
              } background{getFilteredBackgrounds().length !== 1 ? 's' : ''}
            </span>
            {customBackground && (
              <span className={styles.customIndicator}>
                • 1 custom background
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
