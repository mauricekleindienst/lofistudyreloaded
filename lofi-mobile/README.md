# Lofi Study Mobile

A React Native mobile application for studying with lofi beats, pomodoro timer, and stats tracking.

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Setup:**
    Ensure you have a `.env` file or environment variables set for Supabase:
    ```
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
    ```

3.  **Run Locally:**
    ```bash
    npx expo start
    ```
    - Press `a` for Android emulator
    - Press `i` for iOS simulator (macOS only)

## Production Build

### Android

To build a production APK/AAB:

1.  **Configure Build:**
    Ensure `app.json` has the correct `versionCode` and `package` name.

2.  **Build with EAS (Recommended):**
    ```bash
    npm install -g eas-cli
    eas login
    eas build --platform android --profile production
    ```

3.  **Build Locally:**
    ```bash
    npx expo prebuild
    cd android
    ./gradlew assembleRelease
    ```
    The APK will be in `android/app/build/outputs/apk/release/app-release.apk`.

### iOS (macOS only)

1.  **Build with EAS:**
    ```bash
    eas build --platform ios --profile production
    ```

2.  **Build Locally:**
    ```bash
    npx expo run:ios --configuration Release
    ```

## Features

- **Pomodoro Timer:** Focus/Break intervals with background notifications.
- **Sound Player:** Integrated Spotify playlists and ambient sounds.
- **Stats:** Track your focus time and view leaderboards (Supabase).
- **Todo List:** Manage tasks with priorities and categories.
- **Chat:** Real-time chat with other users.

## Troubleshooting

- **Build Failures:** Try running `npx expo prebuild --clean` to regenerate native directories.
- **Notifee Issues:** A custom plugin `plugins/withNotifeeMaven.js` is included to fix Android build dependencies.
