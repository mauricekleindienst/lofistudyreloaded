# Lo-Fi.Study

A focus space in the browser: Pomodoro timer, a self-hosted lo-fi radio,
ambient sound mixer, animated backgrounds, tasks, notes, flashcards, habits,
stopwatch/timer, guided breathing, calendar, focus stats with a leaderboard,
and a community chat. Everything works without an account (stored on the
device); signing in syncs it to the server.

**Stack:** Next.js 16 (App Router, standalone output) · React 19 · MongoDB ·
cookie sessions with scrypt password hashes · optional GitHub / Discord /
Google OAuth.

## Run locally

```bash
docker run -d --name lofi-mongo -p 127.0.0.1:27017:27017 mongo:8
cp .env.example .env.local   # set MONGODB_URI=mongodb://127.0.0.1:27017/lofistudy
npm ci
npm run dev
```

Collections and indexes are created on first request. `GET /api/health`
reports database connectivity.

## Deploy

`Dockerfile` builds a small standalone image (`node server.js`, port 3000,
built-in healthcheck). Required at runtime: `MONGODB_URI`. Set
`NEXT_PUBLIC_SITE_URL` as a **build** argument — it drives canonical URLs,
the sitemap, robots.txt and Open Graph tags. See `.env.example` for the
optional OAuth and analytics variables.

## Media

**Music** — `public/music/<station>/<track>.m4a`, listed in `src/data/music.ts`.
110 tracks in 8 stations by [HoliznaCC0](https://freemusicarchive.org/music/holiznacc0/),
all released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
(public domain), so we may host and stream them. AAC 64 kbps (48 kbps for the
long ambient pieces), loudness-normalised to -16 LUFS. Nothing is loaded from
YouTube or any other third party.

**Backgrounds** — `public/backgrounds/` as 1080p and 720p H.264 (`-1080.mp4`,
`-720.mp4`) plus a WebP poster. Phones, touch devices and data-saver
connections get the 720p file. The illustrated loops are the original
Lo-Fi.Study set; the real-footage loops come from Mixkit (Stock Video Free
License) and were turned into seamless loops with a crossfade. Add a
background by dropping the three files in and adding one line to
`src/data/backgrounds.ts`.

**Sounds** — `public/sounds/`. Birds, thunderstorm, wind, crickets and city are
Mixkit sound effects (Sound Effects Free License); white, pink and brown noise
are generated in the browser.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```
