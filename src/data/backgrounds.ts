import type { Background } from '../components/desktop/types';

// Videos are self-hosted under /public/backgrounds (the old DigitalOcean
// Space is gone). Each has a 1080p and a 720p H.264 loop plus a WebP poster.
const MIXKIT = 'Mixkit';

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
  // Illustrated lo-fi loops
  bg(1, 'rain', 'Rain', 'rain'),
  bg(8, 'chillroom', 'Chill Room', 'cozy'),
  bg(11, 'study_girl', 'Study Girl', 'cozy'),
  bg(3, 'classroom', 'Classroom', 'cozy'),
  bg(31, 'couch', 'Couch', 'cozy'),
  bg(4, 'autumn', 'Autumn', 'nature'),
  bg(32, 'winter', 'Winter', 'nature'),
  bg(2, 'train', 'Train', 'urban'),
  bg(7, 'train2', 'Night Train', 'night'),
  bg(5, 'night', 'Night', 'night'),
  bg(9, 'cables', 'Cables', 'urban'),
  bg(6, 'skyrim', 'Skyrim', 'gaming', 'Bethesda'),
  // Real footage (Mixkit Stock Video Free License), turned into seamless loops
  bg(40, 'rainy_window', 'Rainy Window', 'rain', MIXKIT),
  bg(41, 'rainy_roof', 'Rainy Roof', 'rain', MIXKIT),
  bg(42, 'rain_ripples', 'Rain on the Lake', 'rain', MIXKIT),
  bg(43, 'night_park', 'Rainy Park at Night', 'rain', MIXKIT),
  bg(44, 'rainy_street', 'Rainy Street', 'urban', MIXKIT),
  bg(45, 'city_bokeh', 'City Lights', 'urban', MIXKIT),
  bg(46, 'coffee', 'Coffee', 'cozy', MIXKIT),
  bg(47, 'forest_stream', 'Forest Stream', 'nature', MIXKIT),
  bg(48, 'misty_forest', 'Misty Forest', 'nature', MIXKIT),
  bg(49, 'winter_moon', 'Winter Moon', 'nature', MIXKIT),
  bg(50, 'starry_lake', 'Starry Lake', 'night', MIXKIT),
  bg(51, 'aurora', 'Northern Lights', 'night', MIXKIT),
];

export const DEFAULT_BACKGROUND: Background = backgrounds[0];

export const findBackground = (id: unknown): Background | undefined =>
  backgrounds.find((b) => String(b.id) === String(id));
