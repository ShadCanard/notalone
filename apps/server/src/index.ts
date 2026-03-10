import 'dotenv/config';
import express from 'express';
import { createYoga } from 'graphql-yoga';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { schema, type Context } from './schema.js';
import prisma from './prisma.js';
import { verifyToken } from './auth.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());

const yoga = createYoga<Context>({
  schema,
  graphiql: true,
  context: async ({ request }) => {
    const authHeader = request.headers.get('authorization');
    let user = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyToken(token);
      if (payload) {
        // enrich user with role from DB (userId is now UUID string)
        const dbUser = await prisma.user.findUnique({ where: { id: payload.userId } });
        user = { userId: payload.userId, email: payload.email, role: dbUser?.role };
      }
    }
    return { user };
  },
});

app.use('/graphql', yoga as unknown as express.RequestHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📊 GraphiQL available at http://localhost:${PORT}/graphql`);
});
