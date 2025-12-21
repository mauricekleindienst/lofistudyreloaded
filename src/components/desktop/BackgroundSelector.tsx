"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { X, CheckSquare, Play, Images, Pause, Search, Film } from 'lucide-react';
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
  onClose: () => void;
  onBackgroundChange: (background: Background) => void;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'all', name: 'All', icon: '🌍' },
  { id: 'nature', name: 'Nature', icon: '🌿' },
  { id: 'urban', name: 'Urban', icon: '🏙️' },
  { id: 'cozy', name: 'Cozy', icon: '🏠' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'scenery', name: 'Scenery', icon: '🏔️' },
  { id: 'cafe', name: 'Cafe', icon: '☕' },
];

export default function BackgroundSelector({
  showBackgrounds,
  currentBackground,
  selectedCategory,
  onClose,
  onBackgroundChange,
  onCategoryChange
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
              <p className={styles.subtitle}>Curated high-quality ambiances</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={onClose}
              className={styles.closeButton}
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
              autoFocus
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
                <div
                  key={bg.id}
                  className={`${styles.wallpaperBox} ${isSelected ? styles.selected : ''}`}
                  onClick={() => {
                    onBackgroundChange(bg);
                    onClose();
                  }}
                  onMouseEnter={() => setPreviewId(bg.id)}
                  onMouseLeave={() => setPreviewId(null)}
                >
                  <div className={styles.imageWrapper}>
                    <Image
                      src={`/thumbnails/${bg.id}.jpg`}
                      alt={bg.alt}
                      fill
                      sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
                      className={styles.wallpaperImage}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/thumbnails/placeholder.jpg';
                        setErrorVideos(prev => new Set(prev).add(bg.id));
                      }}
                    />
                    
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
                </div>
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
