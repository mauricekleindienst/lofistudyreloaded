import { ObjectId } from 'mongodb';
import { collections } from '@/lib/server/mongo';
import { getCurrentUser } from '@/lib/server/auth';
import { route, json, readJson, requireUser, str, rateLimit, HttpError } from '@/lib/server/http';
import type { ChatMessageDoc } from '@/lib/server/models';

export const runtime = 'nodejs';

const serialize = (m: ChatMessageDoc) => ({
  id: m._id.toHexString(),
  user_id: m.userId.toHexString(),
  username: m.username,
  message: m.message,
  created_at: m.createdAt.toISOString(),
});

const ONLINE_WINDOW_MS = 45_000;

/**
 * Polled by the client every few seconds. ?after=<message id> returns only newer
 * messages; without it the latest 50. Also refreshes the caller's presence.
 */
export const GET = route(async (request) => {
  const user = await getCurrentUser();
  const after = new URL(request.url).searchParams.get('after');
  const col = await collections.chatMessages();

  let messages: ChatMessageDoc[];
  if (after && ObjectId.isValid(after) && after.length === 24) {
    // Ids are made before the insert, so a slow write can land "behind" the cursor.
    // Re-sending the last few seconds lets the client pick those up (it de-duplicates).
    const overlap = ObjectId.createFromTime(Math.floor((Date.now() - 10_000) / 1000));
    messages = await col
      .find({ $or: [{ _id: { $gt: new ObjectId(after) } }, { _id: { $gte: overlap } }] })
      .sort({ _id: 1 })
      .limit(100)
      .toArray();
  } else {
    messages = (await col.find().sort({ _id: -1 }).limit(50).toArray()).reverse();
  }

  const presence = await collections.presence();
  const now = new Date();
  if (user) {
    await presence.updateOne({ _id: user._id.toHexString() }, { $set: { lastSeen: now } }, { upsert: true });
  }
  const online = await presence.countDocuments({ lastSeen: { $gte: new Date(now.getTime() - ONLINE_WINDOW_MS) } });

  return json({ messages: messages.map(serialize), online });
});

export const POST = route(async (request) => {
  const user = await requireUser();
  await rateLimit(`chat:${user._id.toHexString()}`, 8, 10);
  await rateLimit(`chat-hour:${user._id.toHexString()}`, 300, 3600);
  const body = await readJson(request);
  const message = str(body.message, 'Message', { max: 500, min: 1 })!;
  if (/^\s*$/.test(message)) throw new HttpError(400, 'Message is empty');

  const doc: ChatMessageDoc = {
    _id: new ObjectId(),
    userId: user._id,
    username: user.fullName,
    message,
    createdAt: new Date(),
  };
  const col = await collections.chatMessages();
  await col.insertOne(doc);
  return json({ message: serialize(doc) }, 201);
});
