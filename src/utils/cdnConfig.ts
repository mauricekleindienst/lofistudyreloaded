// Simple CDN configuration for Digital Ocean Spaces
export const CDN_CONFIG = {
  // Primary CDN endpoint
  primary: 'https://lofistudy.fra1.cdn.digitaloceanspaces.com',
  
  // Fallback endpoints for better reliability
  fallbacks: [
    'https://lofistudy.fra1.digitaloceanspaces.com', // Direct endpoint without CDN
  ]
};

// Simple URL builder
export const buildVideoUrl = (filename: string): string => {
  return `${CDN_CONFIG.primary}/backgrounds/${filename}`;
};

// Fallback URL generator for error handling
export const getFallbackUrl = (filename: string, fallbackIndex = 0): string => {
  if (fallbackIndex >= CDN_CONFIG.fallbacks.length) {
    return ''; // No more fallbacks
  }
  
  return `${CDN_CONFIG.fallbacks[fallbackIndex]}/backgrounds/${filename}`;
};

export default CDN_CONFIG;
