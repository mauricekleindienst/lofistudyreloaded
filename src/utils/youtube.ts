// YouTube utility functions for background videos

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  embedUrl: string;
  thumbnailUrl: string;
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Create YouTube embed URL from video ID
 */
export function createYouTubeEmbedUrl(videoId: string, options: {
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  controls?: boolean;
  showinfo?: boolean;
} = {}): string {
  const params = new URLSearchParams();
  
  if (options.autoplay) params.set('autoplay', '1');
  if (options.mute) params.set('mute', '1');
  if (options.loop) {
    params.set('loop', '1');
    params.set('playlist', videoId); // Required for loop to work
  }
  if (options.controls === false) params.set('controls', '0');
  if (options.showinfo === false) params.set('showinfo', '0');
  
  // Additional parameters for better background video experience
  params.set('rel', '0'); // Don't show related videos
  params.set('modestbranding', '1'); // Minimal YouTube branding
  params.set('iv_load_policy', '3'); // Hide annotations
  params.set('disablekb', '1'); // Disable keyboard controls
  
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Get video info from YouTube video ID
 */
export function getYouTubeVideoInfo(videoId: string): YouTubeVideoInfo {
  return {
    id: videoId,
    title: `YouTube Video ${videoId}`,
    embedUrl: createYouTubeEmbedUrl(videoId, {
      autoplay: true,
      mute: true,
      loop: true,
      controls: false,
      showinfo: false
    }),
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  };
}

/**
 * Process YouTube URL and return background-compatible object
 */
export function processYouTubeUrl(url: string): {
  id: number;
  src: string;
  alt: string;
  note: string;
  createdby: string;
  priority: boolean;
  category: string;
  isYoutube: boolean;
  videoId: string;
} | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  const videoInfo = getYouTubeVideoInfo(videoId);
  
  return {
    id: Date.now(), // Use timestamp as unique ID
    src: videoInfo.embedUrl,
    alt: `YouTube: ${videoInfo.title}`,
    note: 'Custom YouTube background',
    createdby: 'YouTube',
    priority: false,
    category: 'custom',
    isYoutube: true,
    videoId: videoId
  };
}
