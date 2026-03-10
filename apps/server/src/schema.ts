import { createSchema } from 'graphql-yoga';
import bcrypt from 'bcryptjs';
import prisma from './prisma.js';
import { generateToken, type TokenPayload } from './auth.js';

export interface Context {
  user: (TokenPayload & { role?: string }) | null;
}

const ROLE_ORDER: Record<string, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
};

function hasRole(context: Context, role: 'USER' | 'MODERATOR' | 'ADMIN') {
  if (!context.user) return false;
  const r = (context.user.role as string) || 'USER';
  return (ROLE_ORDER[r] ?? 0) >= (ROLE_ORDER[role] ?? 0);
}

function requireAuth(context: Context) {
  if (!context.user) throw new Error('Non authentifié');
}

function requireRole(context: Context, role: 'MODERATOR' | 'ADMIN') {
  if (!hasRole(context, role)) throw new Error('Permission refusée');
}

function sanitizeUserForPublic(user: Record<string, unknown> | null | undefined, context: Context) {
  if (!user) return null;
  // allow full data for admins/moderators or the owner themselves
  if (context.user && (hasRole(context, 'MODERATOR') || context.user.userId === (user as Record<string, unknown>)['id'])) return convertDates(user);
  // otherwise expose only non-personal public fields, but include public posts if present
  const u = user as Record<string, unknown>;
  const createdVal = u['createdAt'];
  const createdAtStr = createdVal instanceof Date ? (createdVal as Date).toISOString() : String(createdVal);
  const base: Record<string, unknown> & { posts?: unknown[] } = { id: u['id'], username: u['username'], createdAt: createdAtStr };
  if (u.posts) {
    base.posts = (u.posts as unknown as Array<Record<string, unknown>>)
      .filter((p) => (p as Record<string, unknown>)['isPublic'] !== false)
      .map((p) => sanitizePostForPublic(p as Record<string, unknown>, context));
  }
  return base;
}

function sanitizePostForPublic(post: Record<string, unknown> | null | undefined, context: Context) {
  if (!post) return post;
  const p = convertDates({ ...(post as Record<string, unknown>) }) as Record<string, unknown>;

  // Ensure author is never null: if missing, provide a deleted-user fallback using authorId
  if (!p['author']) {
    p['author'] = { id: p['authorId'] ?? null, username: 'deleted', createdAt: p['createdAt'] ?? new Date().toISOString() };
  }
  p['author'] = sanitizeUserForPublic(p['author'] as Record<string, unknown>, context) || { id: (p['author'] as Record<string, unknown>)['id'], username: 'deleted', createdAt: String((p['author'] as Record<string, unknown>)['createdAt'] ?? p['createdAt']) };

  if (p['comments']) {
    p['comments'] = (p['comments'] as unknown as Array<Record<string, unknown>>).map((c) => {
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

  return p;
}

function convertDates(obj: any): any {
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

export const schema = createSchema<Context>({
  typeDefs: /* GraphQL */ `
    type User {
      id: ID!
      email: String
      username: String!
      firstName: String
      lastName: String
      bio: String
      role: String
      avatar: String
      createdAt: String!
      posts: [Post!]!
    }

    type Post {
      id: ID!
      content: String!
      mood: String
      isPublic: Boolean!
      createdAt: String!
      author: User!
      comments: [Comment!]!
      likes: [Like!]!
      likesCount: Int!
      commentsCount: Int!
      isLikedByMe: Boolean!
    }

    type Comment {
      id: ID!
      content: String!
      createdAt: String!
      author: User!
      post: Post!
    }

    type Like {
      id: ID!
      user: User!
      post: Post!
      createdAt: String!
    }

    type Message {
      id: ID!
      content: String!
      read: Boolean!
      createdAt: String!
      sender: User!
      receiver: User!
    }

    type AuthPayload {
      token: String!
      user: User!
    }

    type Query {
      me: User
      user(id: ID!): User
      users: [User!]!
      posts(limit: Int, offset: Int): [Post!]!
      post(id: ID!): Post
      myPosts: [Post!]!
      messages(userId: ID!): [Message!]!
    }

    type Mutation {
      register(email: String!, username: String!, password: String!, firstName: String, lastName: String): AuthPayload!
      login(identifier: String!, password: String!): AuthPayload!
      createPost(content: String!, mood: String, isPublic: Boolean): Post!
      deletePost(id: ID!): Boolean!
      createComment(postId: ID!, content: String!): Comment!
      toggleLike(postId: ID!): Boolean!
      sendMessage(receiverId: ID!, content: String!): Message!
      markMessageRead(id: ID!): Message!
      updateProfile(firstName: String, lastName: String, bio: String, avatar: String, userId: ID): User!
      updateUserRole(userId: ID!, role: String!): User!
      deleteUser(id: ID!): Boolean!
    }
  `,
  resolvers: {
    Query: {
      me: async (_parent, _args, context) => {
        if (!context.user) return null;
        const u = await prisma.user.findUnique({
          where: { id: context.user.userId },
          include: {
            posts: { include: { author: true, comments: { include: { author: true } }, likes: { include: { user: true } } } },
          },
        });
        return convertDates(u);
      },

      user: async (_parent, args: { id: string }, context) => {
        const u = await prisma.user.findUnique({
          where: { id: args.id },
          include: {
            posts: { include: { author: true, comments: { include: { author: true } }, likes: { include: { user: true } } } },
          },
        });
        return sanitizeUserForPublic(u, context);
      },

      users: async (_parent, _args, context) => {
        // only moderators and admins can list full users
        requireRole(context, 'MODERATOR');
        const list = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
        return list.map(convertDates);
      },

      posts: async (_parent, args: { limit?: number; offset?: number }, context) => {
        const posts = await prisma.post.findMany({
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
          take: args.limit ?? 20,
          skip: args.offset ?? 0,
          include: {
            author: true,
            comments: { include: { author: true } },
            likes: { include: { user: true } },
          },
        });
        return posts.map((p) => sanitizePostForPublic(p, context));
      },

      post: async (_parent, args: { id: string }, context) => {
        const p = await prisma.post.findUnique({
          where: { id: args.id },
          include: {
            author: true,
            comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
            likes: { include: { user: true } },
          },
        });
        return sanitizePostForPublic(p, context);
      },

      myPosts: async (_parent, _args, context) => {
        if (!context.user) throw new Error('Non authentifié');
        const posts = await prisma.post.findMany({
          where: { authorId: context.user.userId },
          orderBy: { createdAt: 'desc' },
          include: {
            author: true,
            comments: { include: { author: true } },
            likes: { include: { user: true } },
          },
        });
        return posts.map((p) => sanitizePostForPublic(p, context));
      },

      messages: async (_parent, args: { userId: string }, context) => {
        if (!context.user) throw new Error('Non authentifié');
        const msgs = await prisma.message.findMany({
          where: {
            OR: [
              { senderId: context.user.userId, receiverId: args.userId },
              { senderId: args.userId, receiverId: context.user.userId },
            ],
          },
          orderBy: { createdAt: 'asc' },
          include: { sender: true, receiver: true },
        });
        return msgs.map((m) => {
          const mm = convertDates({ ...m });
          return {
            ...mm,
            sender: sanitizeUserForPublic(m.sender, context),
            receiver: sanitizeUserForPublic(m.receiver, context),
          };
        });
      },
    },

    Mutation: {
      register: async (_parent, args: { email: string; username: string; password: string; firstName?: string; lastName?: string }) => {
        const existing = await prisma.user.findFirst({
          where: { OR: [{ email: args.email }, { username: args.username }] },
        });
        if (existing) {
          throw new Error('Un utilisateur avec cet email ou ce nom existe déjà');
        }

        const hashedPassword = await bcrypt.hash(args.password, 12);
        const user = await prisma.user.create({
          data: {
            email: args.email,
            username: args.username,
            password: hashedPassword,
            firstName: args.firstName,
            lastName: args.lastName,
          },
        });

        const token = generateToken({ userId: user.id, email: user.email });
        return { token, user: convertDates(user) };
      },

      login: async (_parent, args: { identifier: string; password: string }) => {
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: args.identifier }, { username: args.identifier }],
          },
        });
        if (!user) {
          throw new Error('Identifiants invalides');
        }

        const valid = await bcrypt.compare(args.password, user.password);
        if (!valid) {
          throw new Error('Identifiants invalides');
        }

        const token = generateToken({ userId: user.id, email: user.email });
        return { token, user: convertDates(user) };
      },

      createPost: async (_parent, args: { content: string; mood?: string; isPublic?: boolean }, context) => {
        if (!context.user) throw new Error('Non authentifié');
        const created = await prisma.post.create({
          data: {
            content: args.content,
            mood: args.mood,
            isPublic: args.isPublic ?? true,
            authorId: context.user.userId,
          },
          include: {
            author: true,
            comments: { include: { author: true } },
            likes: { include: { user: true } },
          },
        });
        return sanitizePostForPublic(created, context);
      },

      deletePost: async (_parent, args: { id: string }, context) => {
        requireAuth(context);
        const post = await prisma.post.findUnique({ where: { id: args.id } });
        if (!post) throw new Error('Post introuvable');
        // allow if author or moderator/admin
        if (post.authorId !== context.user!.userId && !hasRole(context, 'MODERATOR') && !hasRole(context, 'ADMIN')) {
          throw new Error('Non autorisé');
        }
        await prisma.post.delete({ where: { id: args.id } });
        return true;
      },

      createComment: async (_parent, args: { postId: string; content: string }, context) => {
        if (!context.user) throw new Error('Non authentifié');
        const created = await prisma.comment.create({
          data: {
            content: args.content,
            authorId: context.user.userId,
            postId: args.postId,
          },
          include: { author: true, post: true },
        });
        const c = convertDates(created);
        return { ...c, author: sanitizeUserForPublic(created.author, context) };
      },

      toggleLike: async (_parent, args: { postId: string }, context) => {
        if (!context.user) throw new Error('Non authentifié');
        const existing = await prisma.like.findUnique({
          where: {
            userId_postId: {
              userId: context.user.userId,
              postId: args.postId,
            },
          },
        });
        if (existing) {
          await prisma.like.delete({ where: { id: existing.id } });
          return false;
        }
        await prisma.like.create({
          data: { userId: context.user.userId, postId: args.postId },
        });
        return true;
      },

      sendMessage: async (_parent, args: { receiverId: string; content: string }, context) => {
        if (!context.user) throw new Error('Non authentifié');
        const created = await prisma.message.create({
          data: {
            content: args.content,
            senderId: context.user.userId,
            receiverId: args.receiverId,
          },
          include: { sender: true, receiver: true },
        });
        const m = convertDates(created);
        return { ...m, sender: sanitizeUserForPublic(created.sender, context), receiver: sanitizeUserForPublic(created.receiver, context) };
      },

      markMessageRead: async (_parent, args: { id: string }, context) => {
        requireAuth(context);
        const message = await prisma.message.findUnique({ where: { id: args.id } });
        if (!message) throw new Error('Message introuvable');
        // only receiver, moderator or admin can mark as read
        if (message.receiverId !== context.user!.userId && !hasRole(context, 'MODERATOR') && !hasRole(context, 'ADMIN')) {
          throw new Error('Non autorisé');
        }
        const updated = await prisma.message.update({
          where: { id: args.id },
          data: { read: true },
          include: { sender: true, receiver: true },
        });
        const mu = convertDates(updated);
        return { ...mu, sender: sanitizeUserForPublic(updated.sender, context), receiver: sanitizeUserForPublic(updated.receiver, context) };
      },

      updateProfile: async (_parent, args: { firstName?: string; lastName?: string; bio?: string; avatar?: string; userId?: string }, context) => {
        requireAuth(context);
        // allow admin to update any profile by passing userId
        let targetId = context.user!.userId;
        if (args.userId && args.userId !== context.user!.userId) {
          if (!hasRole(context, 'ADMIN')) throw new Error('Non autorisé');
          targetId = args.userId;
        }
        const u = await prisma.user.update({ where: { id: targetId }, data: { firstName: args.firstName, lastName: args.lastName, bio: args.bio, avatar: args.avatar } });
        return convertDates(u);
      },
      updateUserRole: async (_parent, args: { userId: string; role: string }, context) => {
        // only admin can change roles
        requireAuth(context);
        if (!hasRole(context, 'ADMIN')) throw new Error('Non autorisé');
        const allowed = ['USER', 'MODERATOR', 'ADMIN'];
        if (!allowed.includes(args.role)) throw new Error('Role invalide');
        const u = await prisma.user.update({ where: { id: args.userId }, data: { role: args.role as any } });
        return convertDates(u);
      },

      deleteUser: async (_parent, args: { id: string }, context) => {
        requireAuth(context);
        if (!hasRole(context, 'ADMIN')) throw new Error('Non autorisé');
        // delete user cascade will remove related content per Prisma schema
        await prisma.user.delete({ where: { id: args.id } });
        return true;
      },
    },

    Post: {
      likesCount: (parent: { likes?: unknown[] }) => parent.likes?.length ?? 0,
      commentsCount: (parent: { comments?: unknown[] }) => parent.comments?.length ?? 0,
      isLikedByMe: (parent: { likes?: Array<{ user: { id: string } }> }, _args: unknown, context: Context) => {
        if (!context.user) return false;
        return parent.likes?.some((like) => like.user.id === context.user!.userId) ?? false;
      },
    },

    User: {
      posts: async (parent: Record<string, unknown>, _args: unknown, context: Context) => {
        // if posts were already loaded on the parent (e.g., included), use them (sanitized)
        if (parent['posts']) {
          return (parent['posts'] as unknown as Array<Record<string, unknown>>).map((p) => sanitizePostForPublic(p as Record<string, unknown>, context));
        }
        const posts = await prisma.post.findMany({
          where: { authorId: parent['id'] as string },
          orderBy: { createdAt: 'desc' },
          include: { author: true, comments: { include: { author: true } }, likes: { include: { user: true } } },
        });
        return posts.map((p) => sanitizePostForPublic(p, context));
      },
    },
  },
});
