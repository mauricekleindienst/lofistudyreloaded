import 'server-only';
import type { Collection, Document, Sort, WithId } from 'mongodb';
import { ObjectId } from 'mongodb';
import { HttpError, json, parseObjectId, readJson, requireUser, route } from './http';

interface UserOwned extends Document {
  _id: ObjectId;
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface CrudOptions<T extends UserOwned> {
  collection: () => Promise<Collection<T>>;
  parse: (body: Record<string, unknown>, partial: boolean) => Partial<T>;
  serialize: (doc: T) => unknown;
  sort: Sort;
  /** Hard cap per user so one account can't fill the disk. */
  maxPerUser: number;
  label: string;
  /** Extra fields on insert, e.g. a position for ordering. */
  onCreate?: (col: Collection<T>, userId: ObjectId) => Promise<Partial<T>>;
}

type IdContext = { params: Promise<{ id: string }> };

/** Builds the collection (GET, POST) and item (PATCH, DELETE) handlers for a per-user resource. */
export function crud<T extends UserOwned>(opts: CrudOptions<T>) {
  const list = route(async () => {
    const user = await requireUser();
    const col = await opts.collection();
    const docs = await col.find({ userId: user._id } as never).sort(opts.sort).limit(opts.maxPerUser).toArray();
    return json({ items: docs.map((d) => opts.serialize(d as T)) });
  });

  const create = route(async (request) => {
    const user = await requireUser();
    const body = await readJson(request);
    const col = await opts.collection();
    const count = await col.countDocuments({ userId: user._id } as never);
    if (count >= opts.maxPerUser) {
      throw new HttpError(400, `You have reached the limit of ${opts.maxPerUser} ${opts.label}`);
    }
    const now = new Date();
    const doc = {
      ...(await opts.onCreate?.(col, user._id)),
      ...opts.parse(body, false),
      _id: new ObjectId(),
      userId: user._id,
      createdAt: now,
      updatedAt: now,
    } as unknown as T;
    await col.insertOne(doc as never);
    return json({ item: opts.serialize(doc) }, 201);
  });

  const update = route<IdContext>(async (request, { params }) => {
    const user = await requireUser();
    const id = parseObjectId((await params).id);
    const changes = opts.parse(await readJson(request), true);
    const col = await opts.collection();
    const updated = await col.findOneAndUpdate(
      { _id: id, userId: user._id } as never,
      { $set: { ...changes, updatedAt: new Date() } } as never,
      { returnDocument: 'after' }
    );
    if (!updated) throw new HttpError(404, 'Not found');
    return json({ item: opts.serialize(updated as WithId<T> as T) });
  });

  const remove = route<IdContext>(async (_request, { params }) => {
    const user = await requireUser();
    const id = parseObjectId((await params).id);
    const col = await opts.collection();
    const result = await col.deleteOne({ _id: id, userId: user._id } as never);
    if (result.deletedCount === 0) throw new HttpError(404, 'Not found');
    return json({ ok: true });
  });

  return { list, create, update, remove };
}
