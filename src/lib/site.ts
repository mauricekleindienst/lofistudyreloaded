// Public base URL used for canonical links, sitemap, Open Graph and JSON-LD.
// Set NEXT_PUBLIC_SITE_URL at build time for each deployment.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://lo-fi.study').replace(/\/$/, '');

export const SITE_NAME = 'Lo-Fi.Study';
export const SITE_TITLE = 'Lo-Fi.Study — Pomodoro Timer, Lo-Fi Music & Focus Space';
export const SITE_DESCRIPTION =
  'A free online study space: Pomodoro focus timer, lo-fi music, ambient sounds, animated backgrounds, tasks, notes and focus stats. Works without an account.';
