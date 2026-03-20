import 'dotenv/config';
import express from 'express';
import { createYoga } from 'graphql-yoga';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { schema, type Context } from './schema.js';
import prisma from './prisma.js';
import { verifyToken } from './auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// ensure uploads folder exists
const uploadsRoot = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsRoot, { recursive: true });

// serve uploaded files
app.use('/uploads', express.static(uploadsRoot));

// helper to get authenticated DB user from Authorization header (or null)
async function getAuthUserFromReq(req: express.Request) {
  const authHeader = req.headers['authorization'] as string | undefined;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return null;
  const dbUser = await prisma.user.findUnique({ where: { id: payload.userId } }).catch(() => null);
  return dbUser ?? null;
}

// multer storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const dir = path.join(uploadsRoot, 'avatars');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req: any, file: any, cb: any) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    cb(null, safe);
  },
});

// allowed mime types and size limits
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

function avatarFileFilter(req: any, file: any, cb: any) {
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    const err: any = new Error('Invalid file type');
    err.code = 'INVALID_MIME_TYPE';
    return cb(err, false);
  }
  cb(null, true);
}

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: avatarFileFilter,
});

// upload avatar endpoint with explicit error handling
app.post('/upload/avatar', (req, res) => {
  avatarUpload.single('avatar')(req as any, res as any, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max 2MB allowed.' });
      }
      if (err.code === 'INVALID_MIME_TYPE') {
        return res.status(400).json({ error: 'Invalid file type. Allowed: jpg, png, webp, gif.' });
      }
      return res.status(500).json({ error: 'Upload error' });
    }

    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/avatars/${file.filename}`;
    res.json({ url });
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(`📊 GraphiQL available at http://localhost:${PORT}/graphql`);
});

// Public user info (sanitized) - GET /api/v1/users/:id
app.get('/api/v1/users/:id', async (req, res) => {
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: String(req.params.id) }, include: { posts: true } });
    if (!dbUser) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    // build minimal public projection
    const publicUser: any = {
      id: dbUser.id,
      username: dbUser.username,
      avatar: dbUser.avatar || null,
      createdAt: dbUser.createdAt.toISOString(),
      posts: (dbUser.posts || []).filter((p: any) => p.isPublic !== false).map((p: any) => ({ id: p.id, content: p.content, createdAt: p.createdAt.toISOString(), isPublic: p.isPublic })),
    };
    return res.json(publicUser);
  } catch (e) {
    console.error('GET /api/v1/users/:id error', e);
    return res.status(500).json({ error: 'Server error', code: 'INTERNAL_ERROR' });
  }
});

// Admin-only full user info - GET /api/v1/admin/users/:id
app.get('/api/v1/admin/users/:id', async (req, res) => {
  try {
    const authUser = await getAuthUserFromReq(req);
    if (!authUser) return res.status(401).json({ error: 'Unauthenticated', code: 'UNAUTHENTICATED' });
    if ((authUser.role || 'USER') !== 'ADMIN') return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });

    const dbUser = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
    if (!dbUser) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    // return full user (do not include password)
    const { password, ...rest } = dbUser as any;
    const out = { ...rest, createdAt: rest.createdAt instanceof Date ? rest.createdAt.toISOString() : rest.createdAt };
    return res.json(out);
  } catch (e) {
    console.error('GET /api/v1/admin/users/:id error', e);
    return res.status(500).json({ error: 'Server error', code: 'INTERNAL_ERROR' });
  }
});
 
