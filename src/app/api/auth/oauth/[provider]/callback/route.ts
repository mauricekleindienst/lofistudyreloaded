import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { collections } from '@/lib/server/mongo';
import { createSession, getCurrentUser } from '@/lib/server/auth';
import { getProvider, isProvider, redirectUri, appUrl } from '@/lib/server/oauth';
import { route } from '@/lib/server/http';

export const runtime = 'nodejs';

export const GET = route<{ params: Promise<{ provider: string }> }>(async (request, { params }) => {
  const { provider } = await params;
  const base = appUrl(request);
  const fail = (message: string) => NextResponse.redirect(`${base}/?auth_error=${encodeURIComponent(message)}`);

  if (!isProvider(provider)) return fail('Unknown sign-in provider');
  const config = getProvider(provider);
  if (!config) return fail('This sign-in method is not available');

  const url = new URL(request.url);
  if (url.searchParams.get('error')) return fail('Sign-in was cancelled');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return fail('Sign-in response was incomplete');

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

  const profile = await config.fetchProfile(tokenJson.access_token);
  const users = await collections.users();
  const now = new Date();

  // 1. Already linked?  2. Signed in already -> link.  3. Same verified email -> link.  4. New account.
  let user = await users.findOne({ providers: { $elemMatch: { provider, providerId: profile.providerId } } });
  if (!user) {
    const current = await getCurrentUser();
    const byEmail = profile.email ? await users.findOne({ email: profile.email.toLowerCase() }) : null;
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
      await users.insertOne(doc);
      user = doc;
    }
  }
  if (!user) return fail('Could not complete sign-in');

  await createSession(user._id, request.headers.get('user-agent'));
  return NextResponse.redirect(`${base}/?signed_in=1`);
});
