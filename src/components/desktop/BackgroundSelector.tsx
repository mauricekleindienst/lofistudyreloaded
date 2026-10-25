"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { X, CheckSquare, Play, Images, Search, Film, ImageIcon, Shuffle, SunDim } from 'lucide-react';
import { backgrounds } from '@/data/backgrounds';
import styles from '../../../styles/BackgroundSelector.module.css';
import Image from 'next/image';
import type { Background } from './types';

interface BackgroundSelectorProps {
  showBackgrounds: boolean;
  currentBackground: Background;
  selectedCategory: string;
  onClose: () => void;
  onBackgroundChange: (background: Background) => void;
  onCategoryChange: (category: string) => void;
  motion: boolean;
  onMotionChange: (motion: boolean) => void;
  /** 0-80 % black overlay */
  dim: number;
  onDimChange: (dim: number) => void;
}

const categories = [
  { id: 'all', name: 'All', icon: '🌍' },
  { id: 'rain', name: 'Rain', icon: '🌧️' },
  { id: 'nature', name: 'Nature', icon: '🌿' },
  { id: 'night', name: 'Night', icon: '🌙' },
  { id: 'cozy', name: 'Cozy', icon: '🏠' },
  { id: 'urban', name: 'Urban', icon: '🏙️' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
];

export default function BackgroundSelector({
  showBackgrounds,
  currentBackground,
  selectedCategory,
  onClose,
  onBackgroundChange,
  onCategoryChange,
  motion,
  onMotionChange,
  dim,
  onDimChange,
}: BackgroundSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [errorVideos, setErrorVideos] = useState<Set<number>>(new Set());
  const [previewId, setPreviewId] = useState<number | null>(null);

  // Memoize filtered backgrounds
  const filteredBackgrounds = useMemo(() => {
    let filtered = backgrounds;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(bg => bg.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bg => 
        bg.alt.toLowerCase().includes(query) || 
        bg.category.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [selectedCategory, searchQuery]);

  // Get visible backgrounds
  const visibleBackgrounds = useMemo(() => {
    return filteredBackgrounds.slice(0, visibleCount);
  }, [filteredBackgrounds, visibleCount]);

  // Calculate category counts based on search query (if any) or total
  const categoryCounts = useMemo(() => categories.map(category => ({
    ...category,
    count: category.id === 'all' 
      ? backgrounds.length 
      : backgrounds.filter(bg => bg.category === category.id).length
  })), []);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(20);
    setErrorVideos(new Set());
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    if (!showBackgrounds) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showBackgrounds, onClose]);

  if (!showBackgrounds) return null;

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
              <Images size={24} />
            </div>
            <div className={styles.titleText}>
              <h3 className={styles.title}>Background Gallery</h3>
              <p className={styles.subtitle}>{backgrounds.length} looping scenes · illustrated and real</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={() => {
                const pool = backgrounds.filter((b) => b.id !== currentBackground.id);
                onBackgroundChange(pool[Math.floor(Math.random() * pool.length)]);
              }}
              className={styles.motionToggle}
              title="Pick a random background"
            >
              <Shuffle size={16} />
              <span>Surprise me</span>
            </button>
            <button
              type="button"
              onClick={() => onMotionChange(!motion)}
              className={styles.motionToggle}
              aria-pressed={motion}
              title={motion ? 'Show still images (saves battery)' : 'Play animated backgrounds'}
            >
              {motion ? <Film size={16} /> : <ImageIcon size={16} />}
              <span>{motion ? 'Animated' : 'Still'}</span>
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

        {/* Search & Filters */}
        <div className={styles.filterSection}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search backgrounds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search backgrounds"
            />
            {searchQuery && (
              <button 
                className={styles.clearSearch}
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <label className={styles.dimControl} title="Darken the background so windows stand out">
            <SunDim size={16} aria-hidden />
            <span>Dim</span>
            <input
              type="range"
              min={0}
              max={80}
              step={5}
              value={dim}
              onChange={(e) => onDimChange(Number(e.target.value))}
              aria-label="Dim background"
            />
            <span className={styles.dimValue}>{dim}%</span>
          </label>

          <div className={styles.categories}>
            {categoryCounts.map(category => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`${styles.categoryButton} ${
                  selectedCategory === category.id ? styles.active : ''
                }`}
              >
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span>{category.name}</span>
                <span className={styles.categoryCount}>{category.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.wallpaperGrid}>
            {visibleBackgrounds.map((bg) => {
              const hasError = errorVideos.has(bg.id);
              const isSelected = currentBackground.id === bg.id;
              
              return (
                <button
                  type="button"
                  key={bg.id}
                  className={`${styles.wallpaperBox} ${isSelected ? styles.selected : ''}`}
                  aria-label={`Use background: ${bg.alt}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onBackgroundChange(bg);
                    onClose();
                  }}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setPreviewId(bg.id)}
                  onPointerLeave={() => setPreviewId(null)}
                  onFocus={() => setPreviewId(bg.id)}
                  onBlur={() => setPreviewId(null)}
                >
                  <div className={styles.imageWrapper}>
                    <Image
                      src={bg.poster}
                      alt={bg.alt}
                      fill
                      sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
                      className={styles.wallpaperImage}
                      loading="lazy"
                      onError={() => {
                        setErrorVideos(prev => new Set(prev).add(bg.id));
                      }}
                    />
                    
                    {motion && previewId === bg.id && (
                      <video
                        className={styles.previewVideo}
                        src={bg.srcMobile}
                        muted
                        autoPlay
                        loop
                        playsInline
                        preload="none"
                        aria-hidden
                      />
                    )}

                    {hasError && (
                      <div className={styles.errorPlaceholder}>
                        <span>Failed to load</span>
                      </div>
                    )}
                    
                    <div className={styles.wallpaperOverlay}>
                      {isSelected && (
                        <div className={styles.selectedBadge}>
                          <CheckSquare size={14} />
                          <span>Active</span>
                        </div>
                      )}
                      
                      {!isSelected && previewId === bg.id && (
                        <div className={styles.previewBadge}>
                          <Play size={14} />
                          <span>Select</span>
                        </div>
                      )}
                      
                      <div className={styles.wallpaperInfo}>
                        <span className={styles.wallpaperName}>{bg.alt}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Load More */}
          {visibleCount < filteredBackgrounds.length && (
            <div className={styles.loadMoreContainer}>
              <button
                onClick={loadMoreBackgrounds}
                className={styles.loadMoreButton}
              >
                Load More
              </button>
            </div>
          )}

          {/* Empty State */}
          {filteredBackgrounds.length === 0 && (
            <div className={styles.emptyState}>
              <Search size={48} className={styles.emptyIcon} />
              <h3>No backgrounds found</h3>
              <p>Try adjusting your search or category filter</p>
              <button 
                className={styles.resetButton}
                onClick={() => {
                  setSearchQuery('');
                  onCategoryChange('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
