import { randomBytes, createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { collections } from '@/lib/server/mongo';
import { getProvider, isProvider, redirectUri, appUrl } from '@/lib/server/oauth';
import { route, rateLimit, clientIp } from '@/lib/server/http';

export const runtime = 'nodejs';

export const GET = route<{ params: Promise<{ provider: string }> }>(async (request, { params }) => {
  const { provider } = await params;
  const base = appUrl(request);
  if (!isProvider(provider) || !getProvider(provider)) {
    return NextResponse.redirect(`${base}/?auth_error=${encodeURIComponent('This sign-in method is not available')}`);
  }
  await rateLimit(`oauth:${clientIp(request)}`, 30, 600);
  const config = getProvider(provider)!;

  const state = randomBytes(24).toString('base64url');
  const codeVerifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(codeVerifier).digest('base64url');
  const states = await collections.oauthStates();
  await states.insertOne({ _id: state, provider, codeVerifier, createdAt: new Date() });

  const url = new URL(config.authorizeUrl);
  url.searchParams.set('client_id', config.clientId!);
  url.searchParams.set('redirect_uri', redirectUri(request, provider));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', config.scope);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  if (provider === 'google') url.searchParams.set('prompt', 'select_account');
  return NextResponse.redirect(url.toString());
});
