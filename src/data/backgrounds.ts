import type { Background } from '../components/desktop/types';

// Videos are self-hosted under /public/backgrounds (the old DigitalOcean
// Space is gone). Each has a 1080p and a 720p H.264 loop plus a WebP poster.
const bg = (id: number, slug: string, name: string, category: Background['category'], createdby = 'Lo-Fi.Study'): Background => ({
  id,
  slug,
  alt: name,
  note: name,
  createdby,
  category,
  src: `/backgrounds/${slug}-1080.mp4`,
  srcMobile: `/backgrounds/${slug}-720.mp4`,
  poster: `/backgrounds/${slug}.webp`,
});

export const backgrounds: Background[] = [
  bg(1, 'rain', 'Rain', 'nature'),
  bg(8, 'chillroom', 'Chill Room', 'cozy'),
  bg(11, 'study_girl', 'Study Girl', 'cozy'),
  bg(3, 'classroom', 'Classroom', 'cozy'),
  bg(31, 'couch', 'Couch', 'cozy'),
  bg(4, 'autumn', 'Autumn', 'nature'),
  bg(32, 'winter', 'Winter', 'nature'),
  bg(2, 'train', 'Train', 'urban'),
  bg(7, 'train2', 'Night Train', 'urban'),
  bg(5, 'night', 'Night', 'urban'),
  bg(9, 'cables', 'Cables', 'urban'),
  bg(6, 'skyrim', 'Skyrim', 'gaming', 'Bethesda'),
];

export const DEFAULT_BACKGROUND: Background = backgrounds[0];

export const findBackground = (id: unknown): Background | undefined =>
  backgrounds.find((b) => String(b.id) === String(id));
