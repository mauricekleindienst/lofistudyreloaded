"use client";

import React, { useState, useCallback } from 'react';
import { X, CheckSquare, Play, Loader2, AlertCircle, Youtube } from 'lucide-react';
import { backgrounds } from '@/data/backgrounds';
import desktopStyles from '../../../styles/Desktop.module.css';

interface Background {
  id: number;
  src: string;
  alt: string;
  note: string;
  createdby: string;
  priority: boolean;
  category: string;
  isYoutube?: boolean;
}

interface BackgroundSelectorProps {
  showBackgrounds: boolean;
  currentBackground: Background;
  backgroundsToShow: number;
  selectedCategory: string;
  youtubeUrl: string;
  customBackground: Background | null;
  onClose: () => void;
  onBackgroundChange: (background: Background) => void;
  onCategoryChange: (category: string) => void;
  onLoadMore: () => void;
  onYoutubeSubmit: () => void;
  onYoutubeUrlChange: (url: string) => void;
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
  backgroundsToShow,
  selectedCategory,
  youtubeUrl,
  customBackground,
  onClose,
  onBackgroundChange,
  onCategoryChange,
  onLoadMore,
  onYoutubeSubmit,
  onYoutubeUrlChange
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
    return filtered.slice(0, backgroundsToShow);
  };

  const validateYoutubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
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
      await onYoutubeSubmit();
    } catch {
      setYoutubeError('Failed to add YouTube background');
    } finally {
      setIsSubmittingYoutube(false);
    }
  };

  return (
    <div className={desktopStyles.modalOverlay} onClick={onClose}>
      <div 
        className={`${desktopStyles.modalContainer} ${desktopStyles.backgroundModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={desktopStyles.modalHeader}>
          <div className={desktopStyles.modalTitleSection}>
            <div>
              <h3 className={desktopStyles.modalTitle}>Background Gallery</h3>
              <p className={desktopStyles.modalSubtitle}>
                Choose your perfect study ambiance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={desktopStyles.modalCloseButton}
            aria-label="Close gallery"
          >
            <X size={20} />
          </button>
        </div>

        {/* YouTube URL Input */}
        <div className={desktopStyles.youtubeSection}>
          <div className={desktopStyles.youtubeSectionHeader}>
            <Youtube size={18} />
            <h4 className={desktopStyles.youtubeSectionTitle}>Add Custom YouTube Background</h4>
          </div>
          <div className={desktopStyles.youtubeInputContainer}>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => {
                onYoutubeUrlChange(e.target.value);
                setYoutubeError('');
              }}
              placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)"
              className={`${desktopStyles.youtubeInput} ${youtubeError ? desktopStyles.inputError : ''}`}
              disabled={isSubmittingYoutube}
            />
            <button
              onClick={handleYoutubeSubmit}
              className={desktopStyles.youtubeSubmitButton}
              disabled={!youtubeUrl.trim() || isSubmittingYoutube}
            >
              {isSubmittingYoutube ? (
                <Loader2 size={14} className={desktopStyles.spinning} />
              ) : (
                'Add'
              )}
            </button>
          </div>
          {youtubeError && (
            <div className={desktopStyles.errorMessage}>
              <AlertCircle size={14} />
              <span>{youtubeError}</span>
            </div>
          )}
        </div>
        
        {/* Categories Filter */}
        <div className={desktopStyles.categoriesContainer}>
          {categoryCounts.map(category => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`${desktopStyles.categoryButton} ${
                selectedCategory === category.id ? desktopStyles.activeCategoryButton : ''
              }`}
              aria-label={`Filter by ${category.name}`}
            >
              <span className={desktopStyles.categoryIcon}>{category.icon}</span>
              <span className={desktopStyles.categoryName}>{category.name}</span>
              <span className={desktopStyles.categoryCount}>({category.count})</span>
            </button>
          ))}
        </div>        <div className={desktopStyles.backgroundGrid}>          {/* Custom YouTube background */}
          {customBackground && (
            <div
              key="custom-youtube"
              className={`${desktopStyles.backgroundItem} ${desktopStyles.youtubeItem} ${
                currentBackground.id === customBackground.id ? desktopStyles.active : ''
              }`}
              onClick={() => {
                onBackgroundChange(customBackground);
                onClose();
              }}
            >
              <div className={desktopStyles.backgroundPreview}>
                <iframe
                  src={customBackground.src}
                  className={desktopStyles.backgroundVideo}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="Custom YouTube Background"
                />
                <div className={desktopStyles.backgroundOverlay}>
                  <div className={desktopStyles.backgroundInfo}>
                    <div className={desktopStyles.backgroundName}>
                      <Youtube size={14} />
                      {customBackground.alt}
                    </div>
                    <div className={desktopStyles.backgroundCategory}>
                      <span className={desktopStyles.categoryTag}>Custom</span>
                    </div>
                  </div>
                  {currentBackground.id === customBackground.id && (
                    <div className={desktopStyles.selectedIndicator}>
                      <CheckSquare size={16} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
            {/* Regular backgrounds */}
          {getFilteredBackgrounds().map(bg => (
            <div
              key={bg.id}
              className={`${desktopStyles.backgroundItem} ${
                currentBackground.id === bg.id ? desktopStyles.active : ''
              } ${previewingId === bg.id ? desktopStyles.previewing : ''}`}
              onClick={() => {
                onBackgroundChange(bg);
                onClose();
              }}
            >
              <div className={desktopStyles.backgroundPreview}>
                <video
                  src={bg.src}
                  className={desktopStyles.backgroundVideo}
                  muted
                  loop
                  preload="metadata"
                  onMouseEnter={(e) => {
                    setPreviewingId(bg.id);
                    handleVideoPreview(e.currentTarget, true);
                  }}
                  onMouseLeave={(e) => {
                    setPreviewingId(null);
                    handleVideoPreview(e.currentTarget, false);
                  }}
                  onLoadStart={() => {
                    // Handle loading state if needed
                  }}
                  onError={() => {
                    console.error(`Failed to load video: ${bg.src}`);
                  }}
                />
                <div className={desktopStyles.backgroundOverlay}>
                  <div className={desktopStyles.backgroundInfo}>
                    <div className={desktopStyles.backgroundName}>{bg.alt}</div>
                    <div className={desktopStyles.backgroundCategory}>
                      <span className={desktopStyles.categoryTag}>
                        {bg.category.charAt(0).toUpperCase() + bg.category.slice(1)}
                      </span>
                    </div>
                  </div>
                  {currentBackground.id === bg.id && (
                    <div className={desktopStyles.selectedIndicator}>
                      <CheckSquare size={16} />
                    </div>
                  )}
                  {previewingId === bg.id && (
                    <div className={desktopStyles.playingIndicator}>
                      <Play size={16} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {getFilteredBackgrounds().length === 0 && (
            <div className={desktopStyles.emptyState}>
              <div className={desktopStyles.emptyStateIcon}>🎨</div>
              <h4 className={desktopStyles.emptyStateTitle}>No backgrounds found</h4>
              <p className={desktopStyles.emptyStateMessage}>
                Try selecting a different category or add a custom YouTube background
              </p>
            </div>
          )}
        </div>        
        {/* Load More Button */}
        {backgroundsToShow < backgrounds.length && selectedCategory === 'all' && (
          <div className={desktopStyles.loadMoreContainer}>
            <button
              onClick={onLoadMore}
              className={desktopStyles.loadMoreButton}
            >
              Show More ({backgrounds.length - backgroundsToShow} remaining)
            </button>
          </div>
        )}
        
        <div className={desktopStyles.modalFooter}>
          <div className={desktopStyles.footerInfo}>
            <span>
              Showing {getFilteredBackgrounds().length} of {
                selectedCategory === 'all' ? backgrounds.length : 
                backgrounds.filter(bg => bg.category === selectedCategory).length
              } backgrounds
            </span>
            {customBackground && (
              <span className={desktopStyles.customIndicator}>
                • 1 custom background
              </span>
            )}
          </div>
        
        </div>
      </div>
    </div>
  );
}
