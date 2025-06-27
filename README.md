# Lo-Fi Study Desktop

A beautiful Next.js web application that simulates a desktop environment with video backgrounds, perfect for studying and productivity.

## Features

### 🎥 Video Backgrounds
- Select from 22 different high-quality background videos
- Categories include: Cozy, Nature, Urban, Gaming
- Automatic fallback to gradient background if video fails to load
- Videos include rain, trains, study rooms, nature scenes, and more

### 🪟 Draggable Windows System
- Windows can be dragged around the desktop
- Minimize, maximize, and close functionality
- Windows stay within viewport bounds
- Z-index management for proper layering
- Smooth animations for window interactions

### 📱 Built-in Apps

#### 🍅 Pomodoro Timer
- Work and break modes (25min work, 5min break)
- Visual countdown with color coding
- Auto-switch between modes
- Play/pause and reset functionality

#### ✅ Todo List
- Add tasks with priority levels (High, Medium, Low)
- Mark tasks as complete
- Delete tasks
- Automatic sorting by completion status and priority
- Task counter display

#### 🎵 Music Player
- Multiple track playlist
- Play/pause controls
- Track navigation (next/previous)
- Volume control
- Progress visualization
- Beautiful album art display

#### 🌧️ Ambient Sound Player
- 6 different ambient sounds (Rain, Forest, Ocean, Cafe, Fire, Thunder)
- Mix multiple sounds simultaneously
- Individual volume controls for each sound
- Visual indicators for playing sounds
- Stop all sounds function

### 🎨 Desktop Interface
- Real-time clock and date display
- App launcher in bottom taskbar
- Profile section
- Wallpaper selector in top-right corner
- Minimized window taskbar
- Backdrop blur effects for modern UI

### 🔐 Authentication (Optional)
- User registration and login with Supabase
- Google and GitHub OAuth support
- Session persistence across devices
- Graceful degradation when not configured
- User progress saving (when database is set up)

## Technology Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Supabase** - Optional authentication and database
- **React Draggable** - Draggable window functionality
- **Lucide React** - Beautiful icon library

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

4. (Optional) Set up authentication:
   - See [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) for detailed instructions
   - The app works perfectly without authentication setup

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   └── Desktop.tsx       # Main desktop component
└── data/
    └── backgrounds.js    # Background video data
```

## Usage

1. **Change Background**: Click the wallpaper icon in the top-right corner to select a new video background
2. **Open Apps**: Click any app icon in the bottom taskbar to open it
3. **Manage Windows**: 
   - Drag windows by their title bar
   - Minimize/maximize using window controls
   - Close windows with the X button
4. **Multiple Windows**: Open multiple instances of the same app or different apps
5. **Study Environment**: Use the Pomodoro timer with ambient sounds and background videos for the perfect study atmosphere

## Customization

### Adding New Backgrounds
Edit `src/data/backgrounds.js` to add new video backgrounds:

```javascript
{ 
  id: 23, 
  src: "path/to/video.mp4", 
  alt: "Video Name", 
  note: "Description", 
  createdby: "Creator", 
  priority: false, 
  category: "category" 
}
```

### Adding New Apps
Create new app components in `Desktop.tsx` and add them to the `apps` array.

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

Video playback requires modern browser support for HTML5 video.

## Performance Notes

- Videos are streamed, not downloaded entirely
- Multiple ambient sounds can be played simultaneously
- Draggable windows use GPU acceleration
- Optimized for 1080p and higher resolutions

## License

This project is for educational and personal use. Video content belongs to their respective creators (Lo-Fi.study, Bethesda, Mojang).
