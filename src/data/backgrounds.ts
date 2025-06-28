// Shared backgrounds data with enhanced category information and CDN optimization
import { buildOptimizedVideoUrl, PRELOAD_PRIORITY } from '../utils/cdnConfig';
import { Background } from '../components/desktop/types';

// Helper function to create optimized background object
const createBackground = (
  id: number, 
  filename: string, 
  alt: string, 
  note: string, 
  createdby: string, 
  priority: boolean, 
  category: string
): Background => {
  const preloadPriority: 'high' | 'medium' | 'low' = PRELOAD_PRIORITY.HIGH.includes(filename) ? 'high' : 
                         PRELOAD_PRIORITY.MEDIUM.includes(filename) ? 'medium' : 'low';
  
  return {
    id,
    src: buildOptimizedVideoUrl(filename, { 
      preload: PRELOAD_PRIORITY.HIGH.includes(filename) || priority,
      quality: priority ? 'high' : 'auto'
    }),
    // Store original filename for fallback purposes
    filename,
    alt,
    note,
    createdby,
    priority,
    category,
    // Add CDN optimization metadata
    optimized: true,
    preloadPriority
  };
};

export const backgrounds: Background[] = [
  createBackground(1, "Rain.mp4", "Rain", "Rain", "Lo-Fi.study", true, "nature"),
  createBackground(2, "Train.mp4", "Train", "Train", "Lo-Fi.study", false, "urban"),
  createBackground(3, "Classroom.mp4", "Classroom", "Classroom", "Lo-Fi.study", false, "cozy"),
  createBackground(4, "Autumn.mp4", "Autumn", "Autumn", "Lo-Fi.study", false, "nature"),
  createBackground(5, "Night.mp4", "Night", "Night", "Lo-Fi.study", false, "urban"),
  createBackground(6, "Skyrim.mp4", "Skyrim", "Skyrim", "Bethesda", false, "gaming"),
  createBackground(7, "Train2.mp4", "Train2", "Train2", "Lo-Fi.study", false, "urban"),
  createBackground(8, "Chillroom.mp4", "Chillroom", "Chillroom", "Lo-Fi.study", false, "cozy"),
  createBackground(9, "cables.mp4", "Cables", "Cables", "Lo-Fi.study", false, "urban"),
  createBackground(10, "winter.mp4", "Winter", "Winter", "Lo-Fi.study", false, "nature"),
  createBackground(11, "study_girl.mp4", "StudyGirl", "StudyGirl", "Lo-Fi.study", false, "cozy"),
  createBackground(12, "coffee.mp4", "Coffee", "Coffee", "Lo-Fi.study", false, "cozy"),
  createBackground(13, "Minecraft.mp4", "Minecraft", "Minecraft", "Mojang", false, "gaming"),
  createBackground(14, "Darkroom.mp4", "Darkroom", "Darkroom", "Lo-Fi.study", false, "cozy"),
  createBackground(16, "Snowtrain.mp4", "Snowtrain", "Snowtrain", "Lo-Fi.study", false, "urban"),
  createBackground(17, "Garden.mp4", "Garden", "Garden", "Lo-Fi.study", false, "nature"),
  createBackground(18, "japannight.mp4", "Nighttime in Japan", "Nighttime in Japan", "Lo-Fi.study", false, "urban"),
  createBackground(19, "Nightcity.mp4", "Night City", "Night City", "Lo-Fi.study", false, "urban"),
  createBackground(20, "Beachisland.mp4", "Beach Island", "Beach Island", "Lo-Fi.study", false, "nature"),
  createBackground(21, "NightRoom.mp4", "Night Room", "Night Room", "Lo-Fi.study", false, "cozy"),
  createBackground(22, "Bedroom.mp4", "Bedroom", "Bedroom", "Lo-Fi.study", false, "cozy"),
  createBackground(23, "NeonLoFi.mp4", "Neon Lo-Fi", "Neon Lo-Fi", "Lo-Fi.study", false, "urban"),
  createBackground(24, "RainyTrees.mp4", "Rainy Trees", "Rainy Trees", "Lo-Fi.study", false, "nature"),
  createBackground(25, "RainyRoofRoom.mp4", "Rainy Roof Room", "Rainy Roof Room", "Lo-Fi.study", false, "cozy"),
  createBackground(26, "NightCat.mp4", "Night Cat", "Night Cat", "Lo-Fi.study", false, "cozy"),
  createBackground(27, "MinecraftCabin.mp4", "Minecraft Cabin", "Minecraft Cabin", "Mojang", false, "gaming"),
  createBackground(28, "JapanSunset.mp4", "Japan Sunset", "Japan Sunset", "Lo-Fi.study", false, "nature"),
  createBackground(29, "EveningRain.mp4", "Evening Rain", "Evening Rain", "Lo-Fi.study", false, "nature"),
  createBackground(30, "WaterStation.mp4", "Water Station", "Water Station", "Lo-Fi.study", false, "urban")
];

export const DEFAULT_BACKGROUND: Background = backgrounds[0]; // Rain background with high priority
