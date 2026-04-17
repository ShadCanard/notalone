import { createSchema } from 'graphql-yoga';
import { createPubSub } from '@graphql-yoga/subscription';
import { typeDefs } from './typeDefs.js';
import { resolvers } from './resolvers.js';
import { type TokenPayload } from './auth.js';

export interface Context {
  user: (TokenPayload & { role?: string }) | null;
  pubsub: ReturnType<typeof createPubSub>;
}

export const schema = createSchema<Context>({
  typeDefs: typeDefs,
  resolvers: resolvers,
});
