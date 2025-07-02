"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, CheckSquare, Play, Loader2, AlertCircle, Youtube, Image, Pause } from 'lucide-react';
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
  animationDisabled: boolean;
  onClose: () => void;
  onBackgroundChange: (background: Background) => void;
  onCategoryChange: (category: string) => void;
  onYoutubeSubmit: (background: Background) => void;
  onYoutubeUrlChange: (url: string) => void;
  onAnimationToggle: (disabled: boolean) => void;
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
  animationDisabled,
  onClose,
  onBackgroundChange,
  onCategoryChange,
  onYoutubeSubmit,
  onYoutubeUrlChange,
  onAnimationToggle,
  onClearCustomBackground
}: BackgroundSelectorProps) {
  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const [youtubeError, setYoutubeError] = useState<string>('');
  const [isSubmittingYoutube, setIsSubmittingYoutube] = useState(false);
  const [previewTimeout, setPreviewTimeout] = useState<NodeJS.Timeout | null>(null);
  const [visibleCount, setVisibleCount] = useState(20); // Initially show only 20 backgrounds
  const [loadedVideos, setLoadedVideos] = useState<Set<number>>(new Set());
  const [loadingVideos, setLoadingVideos] = useState<Set<number>>(new Set());
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

  const handleVideoPreview = useCallback((videoElement: HTMLVideoElement, isEntering: boolean) => {
    if (isEntering) {
      // Clear any existing timeout
      if (previewTimeout) {
        clearTimeout(previewTimeout);
      }
      
      // Delay the preview to avoid triggering on quick mouse movements
      const timeout = setTimeout(() => {
        videoElement.currentTime = 0;
        videoElement.play().catch(() => {
          // Silently handle autoplay failures
        });
      }, 200); // 200ms delay
      
      setPreviewTimeout(timeout);
    } else {
      // Clear timeout and stop video immediately
      if (previewTimeout) {
        clearTimeout(previewTimeout);
        setPreviewTimeout(null);
      }
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  }, [previewTimeout]);

  // Reset visible count when category changes
  useEffect(() => {
    setVisibleCount(20);
    setLoadedVideos(new Set());
    setLoadingVideos(new Set());
    setErrorVideos(new Set());
  }, [selectedCategory]);

  // Progressive loading effect - load videos one by one with delays
  useEffect(() => {
    if (visibleBackgrounds.length === 0) return;

    const loadVideosProgressively = async () => {
      for (let i = 0; i < Math.min(visibleBackgrounds.length, 12); i++) {
        const bg = visibleBackgrounds[i];
        
        // Skip if already loaded or loading
        if (loadedVideos.has(bg.id) || loadingVideos.has(bg.id)) {
          continue;
        }

        // Add to loading set
        setLoadingVideos(prev => new Set(prev).add(bg.id));

        // Add a delay between each video load to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, i * 200)); // 200ms between each load

        // Create a video element to preload metadata
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        
        const onLoadedData = () => {
          setLoadingVideos(prev => {
            const newSet = new Set(prev);
            newSet.delete(bg.id);
            return newSet;
          });
          setLoadedVideos(prev => new Set(prev).add(bg.id));
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('error', onError);
        };

        const onError = () => {
          setLoadingVideos(prev => {
            const newSet = new Set(prev);
            newSet.delete(bg.id);
            return newSet;
          });
          setErrorVideos(prev => new Set(prev).add(bg.id));
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('error', onError);
        };

        video.addEventListener('loadeddata', onLoadedData);
        video.addEventListener('error', onError);
        video.src = bg.src;
      }
    };

    loadVideosProgressively();
  }, [visibleBackgrounds, loadedVideos, loadingVideos]);

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
    const newVisibleCount = Math.min(visibleCount + 20, filteredBackgrounds.length);
    setVisibleCount(newVisibleCount);
    
    // Trigger progressive loading for new videos
    const newVideos = filteredBackgrounds.slice(visibleCount, newVisibleCount);
    setTimeout(() => {
      newVideos.forEach((bg, index) => {
        if (!loadedVideos.has(bg.id) && !loadingVideos.has(bg.id)) {
          setTimeout(() => {
            setLoadingVideos(prev => new Set(prev).add(bg.id));
            
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            
            const onLoadedData = () => {
              setLoadingVideos(prev => {
                const newSet = new Set(prev);
                newSet.delete(bg.id);
                return newSet;
              });
              setLoadedVideos(prev => new Set(prev).add(bg.id));
              video.removeEventListener('loadeddata', onLoadedData);
              video.removeEventListener('error', onError);
            };

            const onError = () => {
              setLoadingVideos(prev => {
                const newSet = new Set(prev);
                newSet.delete(bg.id);
                return newSet;
              });
              setErrorVideos(prev => new Set(prev).add(bg.id));
              video.removeEventListener('loadeddata', onLoadedData);
              video.removeEventListener('error', onError);
            };

            video.addEventListener('loadeddata', onLoadedData);
            video.addEventListener('error', onError);
            video.src = bg.src;
          }, index * 200); // Stagger loading
        }
      });
    }, 100);
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
          <div className={styles.headerActions}>
            <button
              onClick={() => onAnimationToggle(!animationDisabled)}
              className={`${styles.animationToggle} ${animationDisabled ? styles.active : ''}`}
              title={animationDisabled ? "Enable background animation" : "Disable background animation"}
              aria-label={animationDisabled ? "Enable background animation" : "Disable background animation"}
            >
              {animationDisabled ? <Image size={18} aria-label="Paused animation" /> : <Pause size={18} />}
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

          {/* Loading Progress Indicator */}
          {(loadingVideos.size > 0 || loadedVideos.size < Math.min(visibleBackgrounds.length, 12)) && (
            <div className={styles.loadingProgress}>
              <div className={styles.progressText}>
                Loading previews... {loadedVideos.size}/{Math.min(visibleBackgrounds.length, 12)}
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ 
                    width: `${(loadedVideos.size / Math.min(visibleBackgrounds.length, 12)) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}

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
            {getFilteredBackgrounds().map((bg) => {
              const isLoaded = loadedVideos.has(bg.id);
              const isLoading = loadingVideos.has(bg.id);
              const hasError = errorVideos.has(bg.id);
              const shouldShowSkeleton = !isLoaded && !hasError;
              
              return (
                <div
                  key={bg.id}
                  className={`${styles.wallpaperBox} ${
                    currentBackground.id === bg.id ? styles.selected : ''
                  } ${shouldShowSkeleton ? styles.loading : ''}`}
                  onClick={() => {
                    onBackgroundChange(bg);
                    onClose();
                  }}
                >
                  {/* Skeleton placeholder */}
                  {shouldShowSkeleton && (
                    <div className={styles.skeletonPlaceholder}>
                      <div className={styles.skeletonShimmer}></div>
                      {isLoading && (
                        <div className={styles.skeletonSpinner}>
                          <div className={styles.spinner}></div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Video element */}
                  <video
                    src={bg.src}
                    className={`${styles.wallpaperMedia} ${
                      shouldShowSkeleton ? styles.hidden : ''
                    }`}
                    muted
                    loop
                    preload="none"
                    aria-label={`Background video: ${bg.alt}`}
                    title={bg.alt}
                    onLoadedData={() => {
                      if (!loadedVideos.has(bg.id)) {
                        setLoadedVideos(prev => new Set(prev).add(bg.id));
                      }
                      setLoadingVideos(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(bg.id);
                        return newSet;
                      });
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoaded) return; // Don't preview if not loaded
                      
                      setPreviewingId(bg.id);
                      const video = e.currentTarget;
                      if (video.readyState === 0) {
                        video.load();
                      }
                      handleVideoPreview(video, true);
                    }}
                    onMouseLeave={(e) => {
                      setPreviewingId(null);
                      handleVideoPreview(e.currentTarget, false);
                    }}
                    onError={() => {
                      console.error(`Failed to load video: ${bg.src}`);
                      setErrorVideos(prev => new Set(prev).add(bg.id));
                      setLoadingVideos(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(bg.id);
                        return newSet;
                      });
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
                  
                  {previewingId === bg.id && isLoaded && (
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
