import { createSchema } from 'graphql-yoga';
import bcrypt from 'bcryptjs';
import prisma from './prisma.js';
import { generateToken, type TokenPayload } from './auth.js';
import { resolvers } from './resolvers.js';
import { typeDefs } from './typeDefs.js';

export interface Context {
  user: (TokenPayload & { role?: string }) | null;
  pubsub: any;
}

export const schema = createSchema<Context>({
  typeDefs: typeDefs,
  resolvers: resolvers,
});
