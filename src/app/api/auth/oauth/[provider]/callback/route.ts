import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { collections } from '@/lib/server/mongo';
import { createSession, getCurrentUser } from '@/lib/server/auth';
import { getProvider, isProvider, redirectUri, appUrl, OAUTH_STATE_COOKIE, type OAuthProfile } from '@/lib/server/oauth';
import { cookies } from 'next/headers';
import { route } from '@/lib/server/http';

export const runtime = 'nodejs';

export const GET = route<{ params: Promise<{ provider: string }> }>(async (request, { params }) => {
  const { provider } = await params;
  const base = appUrl(request);
  const jar = await cookies();
  const expectedState = jar.get(OAUTH_STATE_COOKIE)?.value;
  jar.delete({ name: OAUTH_STATE_COOKIE, path: '/api/auth/oauth' });
  const fail = (message: string) => NextResponse.redirect(`${base}/?auth_error=${encodeURIComponent(message)}`);

  if (!isProvider(provider)) return fail('Unknown sign-in provider');
  const config = getProvider(provider);
  if (!config) return fail('This sign-in method is not available');

  const url = new URL(request.url);
  if (url.searchParams.get('error')) return fail('Sign-in was cancelled');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return fail('Sign-in response was incomplete');
  if (!expectedState || expectedState !== state) return fail('Sign-in link expired, please try again');

  const states = await collections.oauthStates();
  const saved = await states.findOneAndDelete({ _id: state });
  if (!saved || saved.provider !== provider) return fail('Sign-in link expired, please try again');

  const tokenRes = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: config.clientId!,
      client_secret: config.clientSecret!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(request, provider),
      code_verifier: saved.codeVerifier,
    }),
    cache: 'no-store',
  });
  const tokenJson = (await tokenRes.json().catch(() => ({}))) as { access_token?: string };
  if (!tokenRes.ok || !tokenJson.access_token) {
    console.error(`[oauth:${provider}] token exchange failed`, tokenRes.status);
    return fail('Could not complete sign-in');
  }

  let profile: OAuthProfile;
  try {
    profile = await config.fetchProfile(tokenJson.access_token);
  } catch (err) {
    console.error(`[oauth:${provider}] profile request failed`, err);
    return fail('Could not complete sign-in');
  }
  const users = await collections.users();
  const now = new Date();

  // 1. Already linked?  2. Signed in already -> link.  3. Same verified email on an account without a
  // password -> link.  4. New account. Email+password accounts are never linked by email alone: their
  // email isn't verified, so someone could have registered a victim's address in advance.
  let user = await users.findOne({ providers: { $elemMatch: { provider, providerId: profile.providerId } } });
  if (!user) {
    const current = await getCurrentUser();
    const byEmail = profile.email ? await users.findOne({ email: profile.email.toLowerCase() }) : null;
    if (!current && byEmail?.passwordHash) {
      return fail('An account with this email already exists. Sign in with your password first, then try again to connect it.');
    }
    const target = current ?? byEmail;
    if (target) {
      await users.updateOne(
        { _id: target._id },
        {
          $push: { providers: { provider, providerId: profile.providerId } },
          $set: { updatedAt: now, ...(target.avatarUrl ? {} : { avatarUrl: profile.avatarUrl }) },
        }
      );
      user = await users.findOne({ _id: target._id });
    } else {
      if (!profile.email) return fail(`Your ${provider} account has no verified email address`);
      const doc = {
        _id: new ObjectId(),
        email: profile.email.toLowerCase(),
        fullName: profile.name.slice(0, 40),
        avatarUrl: profile.avatarUrl,
        providers: [{ provider, providerId: profile.providerId }],
        settings: {},
        createdAt: now,
        updatedAt: now,
      };
      try {
        await users.insertOne(doc);
      } catch {
        // A parallel first sign-in with the same email won the race.
        return fail('Could not complete sign-in, please try again');
      }
      user = doc;
    }
  }
  if (!user) return fail('Could not complete sign-in');

  await createSession(user._id, request.headers.get('user-agent'));
  return NextResponse.redirect(`${base}/?signed_in=1`);
});
