import { Context } from "../schema";

export const ROLE_ORDER: Record<string, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
};

export function hasRole(context: Context, role: 'USER' | 'MODERATOR' | 'ADMIN') {
  if (!context.user) return false;
  const r = (context.user.role as string) || 'USER';
  return (ROLE_ORDER[r] ?? 0) >= (ROLE_ORDER[role] ?? 0);
}

export function requireAuth(context: Context) {
  if (!context.user) throw new Error('Non authentifié');
}

export function requireRole(context: Context, role: 'MODERATOR' | 'ADMIN') {
  if (!hasRole(context, role)) throw new Error('Permission refusée');
}

export function sanitizeUserForPublic(user: Record<string, unknown> | null | undefined, context: Context) {
  // New simplified public projection. Returns only public fields and public posts.
  if (!user) return null;
  const u = user as Record<string, unknown>;
  const createdVal = u['createdAt'];
  const createdAtStr = createdVal instanceof Date ? (createdVal as Date).toISOString() : String(createdVal);
  const base: Record<string, unknown> & { posts?: unknown[] } = {
    id: u['id'],
    username: u['username'],
    avatar: u['avatar'] ?? null,
    createdAt: createdAtStr,
  };
  if (u.posts) {
    base.posts = (u.posts as unknown as Array<Record<string, unknown>>)
      .filter((p) => (p as Record<string, unknown>)['isPublic'] !== false)
      .map((p) => sanitizePostForPublic(p as Record<string, unknown>, context));
  }
  // Do NOT expose email, role, or other private fields here.
  return base;
}

export function sanitizePostForPublic(post: Record<string, unknown> | null | undefined, context: Context) {
  if (!post) return post;
  const p = convertDates({ ...(post as Record<string, unknown>) }) as Record<string, unknown>;

  // Ensure author is never null: if missing, provide a deleted-user fallback using authorId
  if (!p['author']) {
    p['author'] = { id: p['authorId'] ?? null, username: 'deleted', createdAt: p['createdAt'] ?? new Date().toISOString() };
  }
  p['author'] = sanitizeUserForPublic(p['author'] as Record<string, unknown>, context) || { id: (p['author'] as Record<string, unknown>)['id'], username: 'deleted', createdAt: String((p['author'] as Record<string, unknown>)['createdAt'] ?? p['createdAt']) };

  if (p['comments']) {
    p['comments'] = (p['comments'] as unknown as Array<Record<string, unknown>>)
      .filter((c) => !(c as any).deleted)
      .map((c) => {
        const cc = c as Record<string, unknown>;
        if (!cc['author']) {
          cc['author'] = { id: cc['authorId'] ?? null, username: 'deleted', createdAt: cc['createdAt'] ?? p['createdAt'] };
        }
        const authorSanitized = sanitizeUserForPublic(cc['author'] as Record<string, unknown>, context);
        return { ...cc, author: authorSanitized || { id: (cc['author'] as Record<string, unknown>)['id'], username: 'deleted', createdAt: String((cc['author'] as Record<string, unknown>)['createdAt'] ?? cc['createdAt'] ?? p['createdAt']) } };
      });
  }

  if (p['likes']) {
    p['likes'] = (p['likes'] as unknown as Array<Record<string, unknown>>).map((l) => {
      const ll = l as Record<string, unknown>;
      if (!ll['user']) {
        ll['user'] = { id: ll['userId'] ?? null, username: 'deleted', createdAt: ll['createdAt'] ?? p['createdAt'] };
      }
      const userSan = sanitizeUserForPublic(ll['user'] as Record<string, unknown>, context);
      return { ...ll, user: userSan || { id: (ll['user'] as Record<string, unknown>)['id'], username: 'deleted', createdAt: String((ll['user'] as Record<string, unknown>)['createdAt'] ?? ll['createdAt'] ?? p['createdAt']) } };
    });
  }

  // Ensure attachments is always an array (GraphQL non-null expectation). Map entries if present, otherwise empty array.
  if (p['attachments']) {
    p['attachments'] = (p['attachments'] as unknown as Array<Record<string, unknown>>).map((a) => {
      const aa = { id: a['id'], filename: a['filename'], path: a['path'], mimeType: a['mimeType'], checksum: a['checksum'], size: a['size'], createdAt: a['createdAt'], data: a['data'] ?? null };
      return aa;
    });
  } else {
    p['attachments'] = [];
  }

  return p;
}

export function convertDates(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  // handle Date -> ISO conversion for known fields
  const out: any = Array.isArray(obj) ? [] : { ...(obj as any) };

  if (Array.isArray(obj)) {
    return (obj as any[]).map(convertDates);
  }

  for (const key of Object.keys(out)) {
    const val = out[key];
    if (val instanceof Date) {
      out[key] = val.toISOString();
    } else if (Array.isArray(val)) {
      out[key] = (val as any[]).map(convertDates);
    } else if (val && typeof val === 'object') {
      out[key] = convertDates(val as any);
    }
  }

  return out;
}
