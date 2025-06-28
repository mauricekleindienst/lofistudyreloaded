// Enhanced CDN configuration for Digital Ocean Spaces
export const CDN_CONFIG = {
  // Primary CDN endpoint
  primary: 'https://lofistudy.fra1.cdn.digitaloceanspaces.com',
  
  // Fallback endpoints for better reliability
  fallbacks: [
    'https://lofistudy.fra1.digitaloceanspaces.com', // Direct endpoint without CDN
  ],
  
  // Optimized parameters for video delivery
  videoParams: {
    // Add cache control headers
    cacheControl: 'public, max-age=31536000', // 1 year cache
    
    // Video optimization parameters
    quality: 'auto', // Adaptive quality
    format: 'mp4',   // Ensure consistent format
  },
  
  // Regional optimization
  regions: {
    europe: 'fra1', // Frankfurt for European users
    // Add more regions if you expand
  }
};

// Enhanced URL builder with optimization parameters
export const buildOptimizedVideoUrl = (filename: string, options: {
  preload?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'auto';
  region?: string;
} = {}) => {
  const { preload = false, quality = 'auto', region = 'fra1' } = options;
  
  // Use CDN endpoint with optimization parameters
  let url = `${CDN_CONFIG.primary}/backgrounds/${filename}`;
  
  // Add query parameters for optimization
  const params = new URLSearchParams();
  
  // Add cache busting for development (remove in production)
  if (process.env.NODE_ENV === 'development') {
    params.append('v', Date.now().toString());
  }
  
  // Add preload hint
  if (preload) {
    params.append('preload', 'metadata');
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  return url;
};

// Fallback URL generator for error handling
export const getFallbackUrl = (filename: string, fallbackIndex = 0): string => {
  if (fallbackIndex >= CDN_CONFIG.fallbacks.length) {
    return ''; // No more fallbacks
  }
  
  return `${CDN_CONFIG.fallbacks[fallbackIndex]}/backgrounds/${filename}`;
};

// Preload hints for critical resources
export const PRELOAD_PRIORITY = {
  HIGH: ['Rain.mp4'], // Default background
  MEDIUM: ['Train.mp4', 'Classroom.mp4', 'Autumn.mp4'], // Popular backgrounds
  LOW: [] // Load on demand
};

export default CDN_CONFIG;
