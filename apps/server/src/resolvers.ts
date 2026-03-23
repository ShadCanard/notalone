import { Context } from "./schema";
import { GraphQLScalarType, Kind } from 'graphql';
import { generateToken } from "./auth";
import { convertDates, hasRole, sanitizeUserForPublic, requireRole, sanitizePostForPublic, requireAuth } from "./libs/tools";
import prisma from "./prisma";
import bcrypt from 'bcryptjs';

export const resolvers = {
    JSON: new GraphQLScalarType({
      name: 'JSON',
      description: 'Arbitrary JSON value',
      parseValue: (v) => v,
      serialize: (v) => v,
      parseLiteral: (ast: any) => {
        const parse = (node: any): any => {
          switch (node.kind) {
            case Kind.STRING:
            case Kind.BOOLEAN:
              return node.value;
            case Kind.INT:
            case Kind.FLOAT:
              return Number(node.value);
            case Kind.OBJECT:
              const obj: any = {};
              for (const field of node.fields) {
                obj[field.name.value] = parse(field.value);
              }
              return obj;
            case Kind.LIST:
              return node.values.map(parse);
            case Kind.NULL:
              return null;
            default:
              return null;
          }
        };
        return parse(ast);
      },
    }),
    Query: {
      me: async (_parent: any, _args: any, context: Context) => {
        if (!context.user) return null;
        const u = await prisma.user.findUnique({
          where: { id: context.user.userId },
          include: {
            posts: { orderBy: { createdAt: 'desc' }, include: { author: true, comments: { include: { author: true } }, likes: { include: { user: true } }, attachments: true } },
          },
        });
        return convertDates(u);
      },

      user: async (_parent: any, args: { id: string }, context : Context) => {
        const u = await prisma.user.findUnique({
          where: { id: args.id },
          include: {
            posts: { orderBy: { createdAt: 'desc' }, include: { author: true, comments: { include: { author: true } }, likes: { include: { user: true } }, attachments: true } },
          },
        });
        if (!u) return null;
        // If the requester is admin or the owner, return full user info (without password)
        if (context.user && (hasRole(context, 'MODERATOR') || hasRole(context, 'ADMIN') || context.user.userId === u.id)) {
          const { password, ...rest } = u as any;
          return convertDates(rest);
        }
        // Otherwise return the public projection
        return sanitizeUserForPublic(u, context);
      },

      users: async (_parent: any, _args: any, context: Context) => {
        // only moderators and admins can list full users
        requireRole(context, 'MODERATOR');
        const list = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
        return list.map(convertDates);
      },

      posts: async (_parent: any, args: { limit?: number; offset?: number }, context: Context) => {
        const posts = await prisma.post.findMany({
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
          take: args.limit ?? 20,
          skip: args.offset ?? 0,
          include: {
            author: true,
              comments: { include: { author: true }, orderBy: { createdAt: 'desc' } },
            likes: { include: { user: true } },
            attachments: true,
          },
        });
        return posts.map((p) => {
          const sanitized = sanitizePostForPublic(p, context) as Record<string, unknown>;
          const liked = context.user ? (p.likes ?? []).some((l: any) => (l.user?.id ?? l.userId) === context.user!.userId) : false;
          return { ...sanitized, isLikedByMe: liked };
        });
      },

      post: async (_parent: any, args: { id: string }, context: Context) => {
        const p = await prisma.post.findUnique({
          where: { id: args.id },
          include: {
            author: true,
              comments: { include: { author: true }, orderBy: { createdAt: 'desc' } },
            likes: { include: { user: true } },
            attachments: true,
          },
        });
        if (!p) return null;
        const sanitized = sanitizePostForPublic(p, context) as Record<string, unknown>;
        const liked = context.user ? (p.likes ?? []).some((l: any) => (l.user?.id ?? l.userId) === context.user!.userId) : false;
        return { ...sanitized, isLikedByMe: liked };
      },

      myPosts: async (_parent: any, _args: any, context: Context) => {
        if (!context.user) throw new Error('Non authentifié');
        const posts = await prisma.post.findMany({
          where: { authorId: context.user.userId },
          orderBy: { createdAt: 'desc' },
          include: {
            author: true,
              comments: { include: { author: true }, orderBy: { createdAt: 'desc' } },
            likes: { include: { user: true } },
            attachments: true,
          },
        });
        return posts.map((p) => {
          const sanitized = sanitizePostForPublic(p, context) as Record<string, unknown>;
          const liked = context.user ? (p.likes ?? []).some((l: any) => (l.user?.id ?? l.userId) === context.user!.userId) : false;
          return { ...sanitized, isLikedByMe: liked };
        });
      },

      messages: async (_parent: any, args: { userId: string }, context: Context) => {
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

      notifications: async (_parent: any, args: { limit?: number; offset?: number }, context: Context) => {
        if (!context.user) throw new Error('Non authentifié');
        const notes = await prisma.notification.findMany({
          where: { userId: context.user.userId },
          orderBy: { createdAt: 'desc' },
          take: args.limit ?? 20,
          skip: args.offset ?? 0,
          include: { author: true, user: true },
        });
        return notes.map((n) => {
          const nn = convertDates(n as any) as any;
          return {
            ...nn,
            author: sanitizeUserForPublic((n as any).author, context),
            user: sanitizeUserForPublic((n as any).user, context),
          };
        });
      },
    },

    Mutation: {
      register: async (_parent: any, args: { email: string; username: string; password: string; firstName?: string; lastName?: string }) => {
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

      login: async (_parent: any, args: { identifier: string; password: string }, context: Context) => {
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

      createPost: async (_parent: any, args: { content: string; mood?: string; isPublic?: boolean; attachmentIds?: string[] }, context: Context) => {
        if (!context.user) throw new Error('Non authentifié');
        const data: any = {
          content: args.content,
          mood: args.mood,
          isPublic: args.isPublic ?? true,
          authorId: context.user.userId,
        };
        if (args.attachmentIds && args.attachmentIds.length > 0) {
          data.attachments = { connect: args.attachmentIds.map((id: string) => ({ id })) };
        }
        const created = await prisma.post.create({
          data,
          include: {
            author: true,
              comments: { include: { author: true }, orderBy: { createdAt: 'desc' } },
            likes: { include: { user: true } },
            attachments: true,
          },
        });
        return sanitizePostForPublic(created, context);
      },

      deletePost: async (_parent: any, args: { id: string }, context: Context) => {
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

      createComment: async (_parent: any, args: { postId: string; content: string }, context: Context) => {
        if (!context.user) throw new Error('Non authentifié');
        const created = await prisma.comment.create({
          data: {
            content: args.content,
            authorId: context.user.userId,
            postId: args.postId,
          },
          include: { author: true, post: true },
        });
        // create notification for post author (if not commenting on own post)
        try {
          const postAuthorId = (created.post as any).authorId as string;
          if (postAuthorId && postAuthorId !== context.user.userId) {
            await prisma.notification.create({ data: { userId: postAuthorId, authorId: context.user.userId, type: 'NEW_COMMENT', linkId: args.postId } });
          }
        } catch (e) {
          // ignore notification creation errors
        }
        const c = convertDates(created);
        return { ...c, author: sanitizeUserForPublic(created.author, context) };
      },

      toggleLike: async (_parent: any, args: { postId: string }, context: Context) => {
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
        const createdLike = await prisma.like.create({ data: { userId: context.user.userId, postId: args.postId } });
        // create notification for post author (if not liking own post)
        try {
          const post = await prisma.post.findUnique({ where: { id: args.postId } });
          if (post && post.authorId !== context.user.userId) {
            await prisma.notification.create({ data: { userId: post.authorId, authorId: context.user.userId, type: 'NEW_LIKE', linkId: args.postId } });
          }
        } catch (e) {
          // ignore
        }
        return true;
      },

      sendMessage: async (_parent: any, args: { receiverId: string; content: string }, context: Context) => {
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

      markMessageRead: async (_parent: any, args: { id: string }, context: Context) => {
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

      markNotificationRead: async (_parent: any, args: { id: string }, context: Context) => {
        requireAuth(context);
        const note = await prisma.notification.findUnique({ where: { id: args.id } });
        if (!note) throw new Error('Notification introuvable');
        if (note.userId !== context.user!.userId && !hasRole(context, 'MODERATOR') && !hasRole(context, 'ADMIN')) {
          throw new Error('Non autorisé');
        }
        const updated = await prisma.notification.update({ where: { id: args.id }, data: { read: true }, include: { author: true, user: true } });
        const nn = convertDates(updated as any) as any;
        return { ...nn, author: sanitizeUserForPublic(updated.author, context), user: sanitizeUserForPublic(updated.user, context) };
      },

      updateProfile: async (_parent: any, args: { firstName?: string; lastName?: string; bio?: string; avatar?: string; userId?: string }, context: Context) => {
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
      updateUserRole: async (_parent: any, args: { userId: string; role: string }, context: Context) => {
        // only admin can change roles
        requireAuth(context);
        if (!hasRole(context, 'ADMIN')) throw new Error('Non autorisé');
        const allowed = ['USER', 'MODERATOR', 'ADMIN'];
        if (!allowed.includes(args.role)) throw new Error('Role invalide');
        const u = await prisma.user.update({ where: { id: args.userId }, data: { role: args.role as any } });
        return convertDates(u);
      },

      deleteUser: async (_parent: any, args: { id: string }, context: Context) => {
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
          include: { author: true, comments: { include: { author: true } }, likes: { include: { user: true } }, attachments: true },
        });
        return posts.map((p) => sanitizePostForPublic(p, context));
      },
    },
  }