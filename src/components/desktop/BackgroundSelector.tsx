"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { X, CheckSquare, Play, Images, Pause, } from 'lucide-react';
import { backgrounds } from '@/data/backgrounds';
import styles from '../../../styles/BackgroundSelector.module.css';
import Image from 'next/image';

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
  animationDisabled: boolean;
  onClose: () => void;
  onBackgroundChange: (background: Background) => void;
  onCategoryChange: (category: string) => void;
  onAnimationToggle: (disabled: boolean) => void;
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
  animationDisabled,
  onClose,
  onBackgroundChange,
  onCategoryChange,
  onAnimationToggle
}: BackgroundSelectorProps) {
  const [previewingId] = useState<number | null>(null);
  const [previewTimeout] = useState<NodeJS.Timeout | null>(null);
  const [visibleCount, setVisibleCount] = useState(20); // Initially show only 20 backgrounds
  const [errorVideos, setErrorVideos] = useState<Set<number>>(new Set());

  // Memoize filtered backgrounds to avoid recalculation on every render
  const filteredBackgrounds = useMemo(() => {
    let filtered = backgrounds;
    if (selectedCategory !== 'all') {
      filtered = backgrounds.filter(bg => bg.category === selectedCategory);
    }
    return filtered;
  }, [selectedCategory]);

  // Get visible backgrounds (limited for performance)
  const visibleBackgrounds = useMemo(() => {
    return filteredBackgrounds.slice(0, visibleCount);
  }, [filteredBackgrounds, visibleCount]);

  // Memoize category counts to avoid recalculation on every render
  const categoryCounts = useMemo(() => categories.map(category => ({
    ...category,
    count: category.id === 'all' 
      ? backgrounds.length 
      : backgrounds.filter(bg => bg.category === category.id).length
  })), []);

  

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(20);
    setErrorVideos(new Set());
  }, [selectedCategory]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }
    };
  }, [previewTimeout]);

  if (!showBackgrounds) return null;

  const getFilteredBackgrounds = () => visibleBackgrounds;

  const loadMoreBackgrounds = () => {
    setVisibleCount(prev => Math.min(prev + 20, filteredBackgrounds.length));
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
              <Images size={24} aria-label="Background gallery icon" />
            </div>
            <div className={styles.titleText}>
              <h3 className={styles.title}>Background Gallery</h3>
              <p className={styles.subtitle}>Choose your perfect study ambiance</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => onAnimationToggle(!animationDisabled)}
              className={`${styles.animationToggle} ${animationDisabled ? styles.active : ''}`}
              title={animationDisabled ? "Enable background animation" : "Disable background animation"}
              aria-label={animationDisabled ? "Enable background animation" : "Disable background animation"}
            >
              {animationDisabled ? <Images size={18} aria-label="Paused animation" /> : <Pause size={18} />}
              <span>{animationDisabled ? 'Still' : 'Animated'}</span>
            </button>
            <button
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close gallery"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          
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

            {/* Regular backgrounds */}
            {getFilteredBackgrounds().map((bg) => {
              const hasError = errorVideos.has(bg.id);
              
              return (
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
                  {/* Thumbnail image */}
                  <Image
                    src={`/thumbnails/${bg.id}.jpg`}
                    className={styles.wallpaperMedia}
                    alt={bg.alt}
                    width={300}
                    height={200}
                    title={bg.alt}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/thumbnails/placeholder.jpg';
                      setErrorVideos(prev => new Set(prev).add(bg.id));
                    }}
                  />
                  
                  {/* Error state */}
                  {hasError && (
                    <div className={styles.errorPlaceholder}>
                      <div className={styles.errorIcon}>⚠️</div>
                      <div className={styles.errorText}>Failed to load</div>
                    </div>
                  )}
                  
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
                  
                  {previewingId === bg.id && !hasError && (
                    <div className={styles.playingIndicator}>
                      <Play size={12} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Load More Button */}
            {visibleCount < filteredBackgrounds.length && (
              <div className={styles.loadMoreContainer}>
                <button
                  onClick={loadMoreBackgrounds}
                  className={styles.loadMoreButton}
                >
                  Load More ({filteredBackgrounds.length - visibleCount} remaining)
                </button>
              </div>
            )}

            {/* Empty state */}
            {getFilteredBackgrounds().length === 0 && (
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
        
       
      </div>
    </div>
  );
}
