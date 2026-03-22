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
import crypto from 'crypto';
import { spawn } from 'child_process';

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

// attachments upload (images + audio), support multiple files and dedup via checksum+size
const attachmentsStorage = multer.memoryStorage();
const ATTACHMENTS_MIMES = [...ALLOWED_MIMES, 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB
const attachmentsUpload = multer({ storage: attachmentsStorage, limits: { fileSize: MAX_ATTACHMENT_SIZE } });

app.post('/upload/attachments', (req, res) => {
  attachmentsUpload.array('files')(req as any, res as any, async (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max 10MB.' });
      return res.status(500).json({ error: 'Upload error' });
    }

    const files = (req as any).files as Array<any> | undefined;
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    try {
      const results: any[] = [];
      for (const file of files) {
        if (!ATTACHMENTS_MIMES.includes(file.mimetype)) {
          results.push({ error: 'invalid_mime', originalName: file.originalname });
          continue;
        }
        const buffer: Buffer = file.buffer;
        const size = buffer.length;
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');

        // check existing
        const existing = await prisma.attachment.findFirst({ where: { checksum: hash, size } });
        if (existing) {
          results.push({ existing: true, attachment: existing });
          continue;
        }

        // write to disk
        const dir = path.join(uploadsRoot, 'attachments');
        fs.mkdirSync(dir, { recursive: true });
        const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const outPath = path.join(dir, safe);
        fs.writeFileSync(outPath, buffer);

        const db = await prisma.attachment.create({ data: { filename: file.originalname, path: `/uploads/attachments/${safe}`, mimeType: file.mimetype, checksum: hash, size, data: {} } as any });

        // If audio file, try to extract waveform using ffmpeg (exports PCM s16le to stdout)
        if (file.mimetype && file.mimetype.startsWith('audio/')) {
          try {
            const waveform: number[] = await new Promise((resolve, reject) => {
              const outChunks: Buffer[] = [];
              const ff = spawn('ffmpeg', ['-i', 'pipe:0', '-f', 's16le', '-acodec', 'pcm_s16le', '-ac', '1', '-ar', '44100', 'pipe:1']);
              ff.stdout.on('data', (c: Buffer) => outChunks.push(c));
              // collect stderr to avoid EPIPE issues on some ffmpeg versions
              ff.stderr.on('data', () => {});
              ff.on('error', (err) => reject(err));
              ff.on('close', (code) => {
                try {
                  const raw = Buffer.concat(outChunks);
                  const sampleCount = Math.floor(raw.length / 2);
                  if (sampleCount === 0) return resolve([]);
                  const samples = new Int16Array(raw.buffer, raw.byteOffset, sampleCount);
                  const segments = 40;
                  const segSize = Math.floor(sampleCount / segments) || 1;
                  const wf: number[] = [];
                  for (let i = 0; i < segments; i++) {
                    const start = i * segSize;
                    const end = i === segments - 1 ? sampleCount : start + segSize;
                    let sum = 0;
                    for (let s = start; s < end; s++) {
                      const v = samples[s];
                      sum += v * v;
                    }
                    const rms = Math.sqrt(sum / (end - start)) / 32768;
                    wf.push(Number(rms.toFixed(4)));
                  }
                  return resolve(wf);
                } catch (e) {
                  return reject(e);
                }
              });
              // write buffer to ffmpeg stdin
              ff.stdin.write(buffer);
              ff.stdin.end();
            });

            if (waveform && waveform.length > 0) {
              await prisma.attachment.update({ where: { id: db.id }, data: { data: { waveform } } as any });
              (db as any).data = { waveform };
            }
          } catch (e) {
            // fallback: approximate waveform from raw bytes if ffmpeg isn't available
            try {
              const segments = 40;
              const wf: number[] = [];
              const bytes = buffer;
              const segSize = Math.floor(bytes.length / segments) || 1;
              for (let i = 0; i < segments; i++) {
                const start = i * segSize;
                const end = i === segments - 1 ? bytes.length : start + segSize;
                let sum = 0;
                for (let j = start; j < end; j++) {
                  const v = bytes[j] - 128;
                  sum += v * v;
                }
                const rms = Math.sqrt(sum / (end - start)) / 128;
                wf.push(Number(rms.toFixed(4)));
              }
              await prisma.attachment.update({ where: { id: db.id }, data: { data: { waveform: wf } } as any });
              (db as any).data = { waveform: wf };
            } catch (err) {
              // ignore waveform extraction errors
              console.warn('waveform extraction failed', err);
            }
          }
        }

        results.push({ existing: false, attachment: db });
      }

      return res.json({ attachments: results.map((r) => r.attachment) });
    } catch (e) {
      console.error('upload attachments error', e);
      return res.status(500).json({ error: 'Server error' });
    }
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
    const dbUser = await prisma.user.findUnique({ where: { id: String(req.params.id) }, include: { posts: { orderBy: { createdAt: 'desc' } } } });
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
 
