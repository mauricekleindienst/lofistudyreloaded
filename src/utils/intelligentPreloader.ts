// Intelligent preloading utility based on user behavior
import { Background } from '@/components/desktop/types';

interface UserBehaviorData {
  viewCounts: Record<string, number>;
  lastViewed: Record<string, number>;
  categoryPreferences: Record<string, number>;
  sessionStartTime: number;
}

class IntelligentPreloader {
  private behaviorData: UserBehaviorData;
  private readonly STORAGE_KEY = 'lofistudy-user-behavior';
  private readonly MAX_PRELOAD_COUNT = 5;

  constructor() {
    this.behaviorData = this.loadBehaviorData();
  }

  private loadBehaviorData(): UserBehaviorData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load user behavior data:', error);
    }

    return {
      viewCounts: {},
      lastViewed: {},
      categoryPreferences: {},
      sessionStartTime: Date.now()
    };
  }

  private saveBehaviorData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.behaviorData));
    } catch (error) {
      console.warn('Failed to save user behavior data:', error);
    }
  }

  // Track when user views a background
  trackBackgroundView(background: Background): void {
    const bgId = background.id.toString();
    
    // Increment view count
    this.behaviorData.viewCounts[bgId] = (this.behaviorData.viewCounts[bgId] || 0) + 1;
    
    // Update last viewed timestamp
    this.behaviorData.lastViewed[bgId] = Date.now();
    
    // Update category preference
    this.behaviorData.categoryPreferences[background.category] = 
      (this.behaviorData.categoryPreferences[background.category] || 0) + 1;
    
    this.saveBehaviorData();
  }

  // Get intelligent preload suggestions
  getPreloadSuggestions(backgrounds: Background[], currentBackground: Background): Background[] {
    const suggestions: { background: Background; score: number }[] = [];
    
    backgrounds.forEach(bg => {
      if (bg.id === currentBackground.id) return;
      
      let score = 0;
      const bgId = bg.id.toString();
      
      // Score based on view count (heavily weighted)
      const viewCount = this.behaviorData.viewCounts[bgId] || 0;
      score += viewCount * 10;
      
      // Score based on category preference
      const categoryScore = this.behaviorData.categoryPreferences[bg.category] || 0;
      score += categoryScore * 5;
      
      // Score based on recency
      const lastViewed = this.behaviorData.lastViewed[bgId];
      if (lastViewed) {
        const daysSinceView = (Date.now() - lastViewed) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 10 - daysSinceView); // Higher score for recently viewed
      }
      
      // Boost score for high-priority backgrounds
      if (bg.priority) {
        score += 20;
      }
      
      // Boost score for same category as current background
      if (bg.category === currentBackground.category) {
        score += 15;
      }
      
      // Boost score for adjacent backgrounds in the list
      const currentIndex = backgrounds.findIndex(b => b.id === currentBackground.id);
      const bgIndex = backgrounds.findIndex(b => b.id === bg.id);
      const distance = Math.abs(currentIndex - bgIndex);
      if (distance <= 2) {
        score += 25 - (distance * 5);
      }

      suggestions.push({ background: bg, score });
    });
    
    // Sort by score and return top suggestions
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, this.MAX_PRELOAD_COUNT)
      .map(item => item.background);
  }

  // Get popular backgrounds for new users
  getPopularBackgrounds(backgrounds: Background[]): Background[] {
    return backgrounds
      .filter(bg => bg.priority || bg.category === 'nature' || bg.category === 'cozy')
      .slice(0, 3);
  }

  // Check if user is new (no behavior data)
  isNewUser(): boolean {
    return Object.keys(this.behaviorData.viewCounts).length === 0;
  }

  // Get category usage statistics
  getCategoryStats(): Record<string, number> {
    return { ...this.behaviorData.categoryPreferences };
  }

  // Clear behavior data (for testing or privacy)
  clearBehaviorData(): void {
    this.behaviorData = {
      viewCounts: {},
      lastViewed: {},
      categoryPreferences: {},
      sessionStartTime: Date.now()
    };
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear behavior data:', error);
    }
  }
}

// Singleton instance
export const intelligentPreloader = new IntelligentPreloader();
