import 'server-only';
import type { OAuthProvider } from './models';

interface ProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
  fetchProfile: (accessToken: string) => Promise<OAuthProfile>;
}

export interface OAuthProfile {
  providerId: string;
  email: string | null;
  name: string;
  avatarUrl?: string;
}

async function getJson<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'User-Agent': 'lofistudy' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}

const providers: Record<OAuthProvider, ProviderConfig> = {
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    async fetchProfile(token) {
      const user = await getJson<{ id: number; login: string; name: string | null; avatar_url: string; email: string | null }>(
        'https://api.github.com/user',
        token
      );
      let email = user.email;
      if (!email) {
        const emails = await getJson<{ email: string; primary: boolean; verified: boolean }[]>(
          'https://api.github.com/user/emails',
          token
        );
        email = emails.find((e) => e.primary && e.verified)?.email ?? emails.find((e) => e.verified)?.email ?? null;
      }
      return { providerId: String(user.id), email, name: user.name || user.login, avatarUrl: user.avatar_url };
    },
  },
  discord: {
    authorizeUrl: 'https://discord.com/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scope: 'identify email',
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    async fetchProfile(token) {
      const user = await getJson<{
        id: string;
        username: string;
        global_name: string | null;
        avatar: string | null;
        email: string | null;
        verified: boolean;
      }>('https://discord.com/api/users/@me', token);
      return {
        providerId: user.id,
        email: user.verified ? user.email : null,
        name: user.global_name || user.username,
        avatarUrl: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` : undefined,
      };
    },
  },
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    async fetchProfile(token) {
      const user = await getJson<{ sub: string; email: string; email_verified: boolean; name: string; picture?: string }>(
        'https://openidconnect.googleapis.com/v1/userinfo',
        token
      );
      return {
        providerId: user.sub,
        email: user.email_verified ? user.email : null,
        name: user.name,
        avatarUrl: user.picture,
      };
    },
  },
};

export const OAUTH_STATE_COOKIE = 'lofi_oauth_state';

export function isProvider(value: string): value is OAuthProvider {
  return value in providers;
}

export function getProvider(name: OAuthProvider): ProviderConfig | null {
  const p = providers[name];
  return p.clientId && p.clientSecret ? p : null;
}

export function enabledProviders(): OAuthProvider[] {
  return (Object.keys(providers) as OAuthProvider[]).filter((p) => getProvider(p));
}

export function appUrl(request: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const url = new URL(request.url);
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.host;
  return `${proto}://${host}`;
}

export function redirectUri(request: Request, provider: OAuthProvider) {
  return `${appUrl(request)}/api/auth/oauth/${provider}/callback`;
}
