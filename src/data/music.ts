// Generated from the Free Music Archive (HoliznaCC0). Every track is released under
// CC0 1.0 (public domain): free to host, stream and modify, no attribution required —
// we credit the artist anyway. Files: /public/music/<station>/<track>.m4a, AAC 64 kbps
// (48 kbps for the long ambient pieces), loudness-normalised to -16 LUFS.

export interface MusicTrack {
  id: string;
  title: string;
  /** seconds */
  duration: number;
  album: string;
  source: string;
}

export interface MusicStation {
  id: string;
  name: string;
  tagline: string;
  /** background slug used as cover art */
  cover: string;
  tracks: MusicTrack[];
}

export const MUSIC_ARTIST = { name: 'HoliznaCC0', url: 'https://freemusicarchive.org/music/holiznacc0/' };
export const MUSIC_LICENSE = { name: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' };

export const trackSrc = (t: MusicTrack) => `/music/${t.id}.m4a`;
export const coverSrc = (s: MusicStation) => `/backgrounds/${s.cover}.webp`;

const t = (id: string, title: string, duration: number, album: string, source: string): MusicTrack => ({ id, title, duration, album, source });

export const STATIONS: MusicStation[] = [
  {
    id: "lofi-beats",
    name: "Lo-fi Beats",
    tagline: "Classic study beats",
    cover: "study_girl",
    tracks: [
      t("lofi-beats/still-life", "Still Life", 134, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/still-life-lofi-chill-nostalgic/"),
      t("lofi-beats/bubbles", "Bubbles", 147, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/bubbles-lofi-bright-relaxed/"),
      t("lofi-beats/tranquil-mindscape", "Tranquil Mindscape", 153, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/tranquil-mindscape-lofi-happy-reflection/"),
      t("lofi-beats/when-time-called-me-darling", "When Time Called Me Darling", 215, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/when-time-called-me-darling-lofi-relaxing-chill/"),
      t("lofi-beats/calm-currents", "Calm Currents", 147, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/calm-currents-lofi-relax-calm/"),
      t("lofi-beats/one-night-in-france", "One Night In France", 194, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/one-night-in-france-lofi-nostalgic-chill/"),
      t("lofi-beats/birds", "Birds", 169, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/birds-lofi-chill/"),
      t("lofi-beats/waiting-around", "Waiting Around", 151, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/waiting-around-lofi-calm/"),
      t("lofi-beats/moon-unit", "Moon Unit", 172, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/moon-unit-lofi-reflection-dreamy/"),
      t("lofi-beats/doodles", "Doodles", 138, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/doodles-lofi-happy-mp3/"),
      t("lofi-beats/lucid", "Lucid", 144, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/lucid-lofi-dreamy-chill/"),
      t("lofi-beats/tokyo-sunset", "Tokyo Sunset", 138, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/tokyo-sunset-lofi-peaceful-soft/"),
      t("lofi-beats/reminders", "Reminders", 144, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/reminders-lofi-calm-nostalgic/"),
      t("lofi-beats/shimmer", "Shimmer", 180, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/shimmer-lofi-chill/"),
      t("lofi-beats/warm-fuzz", "Warm Fuzz", 172, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/warm-fuzz-lofi-retro/"),
      t("lofi-beats/walking-away", "Walking Away", 156, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/walking-away-lofi-peaceful-motivating/"),
      t("lofi-beats/color-of-a-soul", "Color Of A Soul", 156, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/color-of-a-soul-lofi-calm-nostalgic/"),
      t("lofi-beats/when-i-was-human", "When I Was Human", 152, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/when-i-was-human-lofi-chill/"),
      t("lofi-beats/ode-to-forgetting", "Ode To Forgetting", 184, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/ode-to-forgetting-lofi-chill-relax/"),
      t("lofi-beats/ocean-breeze", "Ocean Breeze", 197, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/ocean-breeze-lofi-ukulele-peaceful-mp3/"),
      t("lofi-beats/saturation", "Saturation", 155, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/saturation-lofi-calm-relaxed/"),
      t("lofi-beats/wave-maker", "Wave Maker", 185, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/wave-maker-lofi-dreamy-retro/"),
      t("lofi-beats/wetlands", "Wetlands", 163, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/wetlands-lofi-calm-relaxed/"),
      t("lofi-beats/dreamshifter", "Dreamshifter", 157, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/dreamshifter-lofi-relaxed-nostalgic/"),
      t("lofi-beats/dreamy-reverie", "Dreamy Reverie", 143, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/dreamy-reverie-lofi-nostalgic-chill/"),
      t("lofi-beats/ease-into-night", "Ease into Night", 151, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/ease-into-night-lofi-relax-chill/"),
      t("lofi-beats/summer-break", "Summer Break", 173, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/summer-break-lofi-nostalgic-mp3/"),
      t("lofi-beats/infinite-echoes", "Infinite Echoes", 140, "Public Domain Lofi", "https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/infinite-echoes-lofi-dreamy-soft/"),
    ],
  },
  {
    id: "coffee-shop",
    name: "Coffee Shop",
    tagline: "Warm, dusty and mellow",
    cover: "coffee",
    tracks: [
      t("coffee-shop/morning-coffee", "Morning Coffee", 191, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/morning-coffee/"),
      t("coffee-shop/everything-you-ever-dreamed", "Everything You Ever Dreamed.", 220, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/everything-you-ever-dreamed/"),
      t("coffee-shop/something-in-the-air", "Something In the Air", 131, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/something-in-the-air/"),
      t("coffee-shop/small-towns-smaller-lives", "Small Towns Smaller Lives", 146, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/small-towns-smaller-lives/"),
      t("coffee-shop/glad-to-be-stuck-inside", "Glad To Be Stuck Inside", 160, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/glad-to-be-stuck-insidemp3/"),
      t("coffee-shop/vintage", "Vintage", 173, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/vintagemp3/"),
      t("coffee-shop/a-little-shade", "A Little Shade", 178, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/a-little-shade/"),
      t("coffee-shop/cellar-door", "Cellar Door", 132, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/cellar-door/"),
      t("coffee-shop/puppy-love", "Puppy Love", 149, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/puppy-love/"),
      t("coffee-shop/clouds", "Clouds", 229, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/clouds-6/"),
      t("coffee-shop/autumn", "Autumn", 169, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/autumn/"),
      t("coffee-shop/new-shoes", "New Shoes", 155, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/new-shoes/"),
      t("coffee-shop/foggy-headed", "Foggy Headed", 246, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/foggy-headed/"),
      t("coffee-shop/ramen", "Ramen", 112, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/ramenmp3/"),
      t("coffee-shop/creature-comforts", "Creature Comforts", 174, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/creature-comforts/"),
      t("coffee-shop/plants", "Plants", 232, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/plantsmp3/"),
      t("coffee-shop/seasons-change", "Seasons Change", 135, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/seasons-change/"),
      t("coffee-shop/yesterday", "Yesterday", 150, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/yesterday-1/"),
    ],
  },
  {
    id: "city-stroll",
    name: "City Stroll",
    tagline: "Laid-back hip-hop",
    cover: "train",
    tracks: [
      t("city-stroll/busking-in-the-sunlight", "Busking In the SunLight", 262, "City Slacker", "https://freemusicarchive.org/music/holiznacc0/city-slacker/busking-in-the-sunlight/"),
      t("city-stroll/bus-stop", "Bus Stop", 196, "City Slacker", "https://freemusicarchive.org/music/holiznacc0/city-slacker/bus-stop/"),
      t("city-stroll/busted-ac-unit", "Busted AC Unit", 151, "City Slacker", "https://freemusicarchive.org/music/holiznacc0/city-slacker/busted-ac-unit/"),
      t("city-stroll/nowhere-to-be-nothing-to-do", "Nowhere To Be, Nothing To Do", 217, "City Slacker", "https://freemusicarchive.org/music/holiznacc0/city-slacker/nowhere-to-be-nothing-to-do/"),
      t("city-stroll/hooptie-with-the-windows-down", "Hooptie With The Windows Down", 233, "City Slacker", "https://freemusicarchive.org/music/holiznacc0/city-slacker/hooptie-with-the-windows-down/"),
      t("city-stroll/moving-forward", "Moving Forward", 128, "City Slacker", "https://freemusicarchive.org/music/holiznacc0/city-slacker/moving-forward/"),
      t("city-stroll/day-trips", "Day Trips", 183, "City Slacker", "https://freemusicarchive.org/music/holiznacc0/city-slacker/day-trips/"),
      t("city-stroll/sky-scrapers", "Sky Scrapers", 138, "City Slacker", "https://freemusicarchive.org/music/holiznacc0/city-slacker/sky-scrapers/"),
      t("city-stroll/fresh-fit", "Fresh Fit", 163, "City Slacker", "https://freemusicarchive.org/music/holiznacc0/city-slacker/fresh-fit/"),
      t("city-stroll/studio-apartment", "Studio Apartment", 197, "City Slacker", "https://freemusicarchive.org/music/holiznacc0/city-slacker/studio-apartment/"),
      t("city-stroll/unwind", "Unwind", 250, "Kick It (laid back HipHop)", "https://freemusicarchive.org/music/holiznacc0/kick-it-laid-back-hiphop/unwind/"),
    ],
  },
  {
    id: "seasons",
    name: "Four Seasons",
    tagline: "Sun, rain and first snow",
    cover: "autumn",
    tracks: [
      t("seasons/roof-tops", "Roof Tops", 214, "Summer Air ( Lo-fi )", "https://freemusicarchive.org/music/holiznacc0/summer-air-lo-fi/roof-tops/"),
      t("seasons/summer-felt-longer-then", "Summer Felt Longer Then", 227, "Summer Air ( Lo-fi )", "https://freemusicarchive.org/music/holiznacc0/summer-air-lo-fi/summer-felt-longer-then/"),
      t("seasons/the-last-long-day", "The Last Long Day", 144, "Summer Air ( Lo-fi )", "https://freemusicarchive.org/music/holiznacc0/summer-air-lo-fi/the-last-long-day/"),
      t("seasons/august-never-lasts", "August Never Lasts", 158, "Summer Air ( Lo-fi )", "https://freemusicarchive.org/music/holiznacc0/summer-air-lo-fi/august-never-lasts/"),
      t("seasons/faded-in-the-sunlight", "Faded in the Sunlight", 178, "Summer Air ( Lo-fi )", "https://freemusicarchive.org/music/holiznacc0/summer-air-lo-fi/faded-in-the-sunlight/"),
      t("seasons/windows-down", "Windows Down", 165, "Lazy Summer Lofi", "https://freemusicarchive.org/music/holiznacc0/lazy-summer-lofi-1/windows-downmp3/"),
      t("seasons/blue-skies", "Blue Skies", 175, "Lazy Summer Lofi", "https://freemusicarchive.org/music/holiznacc0/lazy-summer-lofi-1/blue-skiesmp3/"),
      t("seasons/laundry-on-the-wire", "Laundry On The Wire", 179, "Lazy Summer Lofi", "https://freemusicarchive.org/music/holiznacc0/lazy-summer-lofi-1/laundry-on-the-wiremp3/"),
      t("seasons/spring-at-last", "Spring At Last", 137, "Spring at last (LOFI TAPE)", "https://freemusicarchive.org/music/holiznacc0/spring-at-last-lofi-tape/spring-at-last/"),
      t("seasons/april-showers", "April Showers", 127, "Spring at last (LOFI TAPE)", "https://freemusicarchive.org/music/holiznacc0/spring-at-last-lofi-tape/april-showers/"),
      t("seasons/kids", "Kids", 194, "Spring at last (LOFI TAPE)", "https://freemusicarchive.org/music/holiznacc0/spring-at-last-lofi-tape/kids/"),
      t("seasons/winter-blues", "Winter Blues", 223, "Winter Lofi", "https://freemusicarchive.org/music/holiznacc0/winter-lofi/winter-blues/"),
      t("seasons/first-snow", "First Snow", 174, "Winter Lofi", "https://freemusicarchive.org/music/holiznacc0/winter-lofi/first-snowmp3/"),
      t("seasons/snow-drift", "Snow Drift", 173, "Winter Lofi", "https://freemusicarchive.org/music/holiznacc0/winter-lofi/snow-drift/"),
      t("seasons/fire-place", "Fire Place", 170, "Winter Lofi", "https://freemusicarchive.org/music/holiznacc0/winter-lofi/fire-place/"),
    ],
  },
  {
    id: "jazz-guitar",
    name: "Jazz Guitar",
    tagline: "Busted guitars, soft swing",
    cover: "chillroom",
    tracks: [
      t("jazz-guitar/busted-jazz", "Busted Jazz", 149, "Lo-fi And Chill", "https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill/busted-jazz-1/"),
      t("jazz-guitar/poor-but-happy", "Poor, But Happy", 127, "Busted Guitar (LOFI EDIT)", "https://freemusicarchive.org/music/holiznacc0/busted-guitar-lofi-edit/poor-but-happy/"),
      t("jazz-guitar/keeping-cool", "Keeping Cool", 153, "Busted Guitar (LOFI EDIT)", "https://freemusicarchive.org/music/holiznacc0/busted-guitar-lofi-edit/keeping-cool/"),
      t("jazz-guitar/come-again", "Come Again", 182, "Busted Guitar (LOFI EDIT)", "https://freemusicarchive.org/music/holiznacc0/busted-guitar-lofi-edit/come-again/"),
      t("jazz-guitar/so-broke", "So Broke", 221, "Busted Guitar (LOFI EDIT)", "https://freemusicarchive.org/music/holiznacc0/busted-guitar-lofi-edit/so-broke/"),
      t("jazz-guitar/1-jazz", "1 (jazz)", 122, "Busted Guitar (JAZZ)", "https://freemusicarchive.org/music/holiznacc0/busted-guitar-jazz/1-jazz/"),
      t("jazz-guitar/2-jazz", "2 (jazz)", 164, "Busted Guitar (JAZZ)", "https://freemusicarchive.org/music/holiznacc0/busted-guitar-jazz/2-jazz/"),
      t("jazz-guitar/3-jazz", "3 (jazz)", 162, "Busted Guitar (JAZZ)", "https://freemusicarchive.org/music/holiznacc0/busted-guitar-jazz/3-jazz/"),
      t("jazz-guitar/4-jazz", "4 (jazz)", 256, "Busted Guitar (JAZZ)", "https://freemusicarchive.org/music/holiznacc0/busted-guitar-jazz/4-jazz/"),
    ],
  },
  {
    id: "night-drive",
    name: "Night Drive",
    tagline: "Neon synths after dark",
    cover: "rainy_street",
    tracks: [
      t("night-drive/machines-with-feelings", "Machines With Feelings", 197, "Waves Of Nostalgia 2", "https://freemusicarchive.org/music/holiznacc0/waves-of-nostalgia-2/machines-with-feelings/"),
      t("night-drive/all-the-fight-left", "All The Fight Left", 171, "Waves Of Nostalgia 2", "https://freemusicarchive.org/music/holiznacc0/waves-of-nostalgia-2/all-the-fight-left/"),
      t("night-drive/new-gods", "New Gods", 315, "Waves Of Nostalgia 2", "https://freemusicarchive.org/music/holiznacc0/waves-of-nostalgia-2/new-gods/"),
      t("night-drive/night-life", "Night Life", 223, "Waves Of Nostalgia 2", "https://freemusicarchive.org/music/holiznacc0/waves-of-nostalgia-2/night-life/"),
      t("night-drive/street-lights-passing-by", "Street Lights Passing By", 215, "Waves Of Nostalgia 2", "https://freemusicarchive.org/music/holiznacc0/waves-of-nostalgia-2/street-lights-passing-by/"),
      t("night-drive/we-used-to-dance", "We used To Dance", 214, "Waves Of Nostalgia 2", "https://freemusicarchive.org/music/holiznacc0/waves-of-nostalgia-2/we-used-to-dance/"),
      t("night-drive/fires-uptown", "Fires Uptown", 190, "Waves Of Nostalgia 2", "https://freemusicarchive.org/music/holiznacc0/waves-of-nostalgia-2/fires-uptown/"),
      t("night-drive/ocean-memory", "Ocean Memory", 150, "OCEAN MEMORY ( Lo-fi Chill )", "https://freemusicarchive.org/music/holiznacc0/ocean-memory-lo-fi-chill/ocean-memory/"),
      t("night-drive/washed-up", "Washed Up", 234, "OCEAN MEMORY ( Lo-fi Chill )", "https://freemusicarchive.org/music/holiznacc0/ocean-memory-lo-fi-chill/washed-up/"),
      t("night-drive/cold-salt-water", "Cold (Salt) Water", 153, "OCEAN MEMORY ( Lo-fi Chill )", "https://freemusicarchive.org/music/holiznacc0/ocean-memory-lo-fi-chill/cold-salt-water/"),
      t("night-drive/currents-we-used-to-know", "Currents We Used to Know", 202, "OCEAN MEMORY ( Lo-fi Chill )", "https://freemusicarchive.org/music/holiznacc0/ocean-memory-lo-fi-chill/currents-we-used-to-know/"),
    ],
  },
  {
    id: "deep-space",
    name: "Deep Space",
    tagline: "Ambient for deep focus",
    cover: "starry_lake",
    tracks: [
      t("deep-space/before-the-big-bang", "Before the Big Bang", 256, "An Ocean In Outer Space", "https://freemusicarchive.org/music/holiznacc0/an-ocean-in-outer-space/before-the-big-bang/"),
      t("deep-space/astronaut", "Astronaut", 125, "An Ocean In Outer Space", "https://freemusicarchive.org/music/holiznacc0/an-ocean-in-outer-space/astronaut-1/"),
      t("deep-space/the-milky-way", "The Milky Way", 292, "An Ocean In Outer Space", "https://freemusicarchive.org/music/holiznacc0/an-ocean-in-outer-space/the-milky-way/"),
      t("deep-space/saturn-in-a-meteor-shower", "Saturn in a Meteor Shower", 185, "An Ocean In Outer Space", "https://freemusicarchive.org/music/holiznacc0/an-ocean-in-outer-space/saturn-in-a-meteor-shower/"),
      t("deep-space/last-train-to-earth", "Last Train To Earth", 371, "A Small Town On Pluto", "https://freemusicarchive.org/music/holiznacc0/a-small-town-on-pluto/last-train-to-earth/"),
      t("deep-space/the-edge-of-nowhere", "The Edge Of Nowhere", 377, "A Small Town On Pluto", "https://freemusicarchive.org/music/holiznacc0/a-small-town-on-pluto/the-edge-of-nowhere-2/"),
      t("deep-space/the-only-store-in-town", "The Only Store In Town", 265, "A Small Town On Pluto", "https://freemusicarchive.org/music/holiznacc0/a-small-town-on-pluto/the-only-store-in-town/"),
      t("deep-space/rain-sleep-meditation", "Rain Sleep Meditation", 875, "Space - Sleep - Meditation", "https://freemusicarchive.org/music/holiznacc0/space-sleep-meditation/rain-sleep-meditation/"),
      t("deep-space/dreamscape", "DreamScape", 1319, "Space - Sleep - Meditation", "https://freemusicarchive.org/music/holiznacc0/space-sleep-meditation/dreamscape/"),
    ],
  },
  {
    id: "piano",
    name: "Quiet Piano",
    tagline: "Gentle keys and music boxes",
    cover: "rainy_window",
    tracks: [
      t("piano/drifting-piano", "Drifting Piano", 110, "Background Music", "https://freemusicarchive.org/music/holiznacc0/background-music/drifting-piano/"),
      t("piano/game-travel-1-piano", "Game Travel 1 (Piano)", 116, "Background Music", "https://freemusicarchive.org/music/holiznacc0/background-music/game-travel-1-piano/"),
      t("piano/spring-on-the-horizon", "Spring On The Horizon", 91, "Background Music", "https://freemusicarchive.org/music/holiznacc0/background-music/spring-on-the-horizon/"),
      t("piano/a-small-town-on-pluto-composed", "A Small Town On Pluto (Composed)", 230, "Background Music", "https://freemusicarchive.org/music/holiznacc0/background-music/a-small-town-on-pluto-composed/"),
      t("piano/a-small-town-on-pluto-music-box", "A Small Town On Pluto (Music Box)", 228, "Background Music", "https://freemusicarchive.org/music/holiznacc0/background-music/a-small-town-on-pluto-music-box/"),
      t("piano/cabin-fever", "Cabin Fever", 208, "Background Music", "https://freemusicarchive.org/music/holiznacc0/background-music/cabin-fever/"),
      t("piano/ost-music-box-1", "OST Music Box 1", 77, "Background Music", "https://freemusicarchive.org/music/holiznacc0/background-music/ost-music-box-1/"),
      t("piano/ost-music-box-7", "OST Music Box 7", 128, "Background Music", "https://freemusicarchive.org/music/holiznacc0/background-music/ost-music-box-7/"),
      t("piano/vst-guitar", "VST guitar", 109, "Background Music", "https://freemusicarchive.org/music/holiznacc0/background-music/vst-guitar/"),
    ],
  },
];

export const ALL_TRACKS: MusicTrack[] = STATIONS.flatMap((s) => s.tracks);

export const findTrack = (id: string | null | undefined) => (id ? ALL_TRACKS.find((x) => x.id === id) : undefined);
export const stationOf = (track: MusicTrack) => STATIONS.find((s) => track.id.startsWith(`${s.id}/`))!;
