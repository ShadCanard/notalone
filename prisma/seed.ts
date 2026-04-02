import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const email = 'admin@notalone.local';
  const password = 'admin123!';

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log('Admin user already exists:', username);
  } else {
    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashed,
        firstName: 'Admin',
        lastName: 'NotAlone',
        role: Role.ADMIN,
      },
    });

    console.log('Created admin user:', user.username);
  }

  // Add second admin account admin2
  const username2 = 'admin2';
  const email2 = 'admin2@notalone.local';
  const password2 = 'admin123!';

  const existing2 = await prisma.user.findUnique({ where: { username: username2 } });
  if (existing2) {
    console.log('Admin user already exists:', username2);
  } else {
    const hashed2 = await bcrypt.hash(password2, 12);

    const user2 = await prisma.user.create({
      data: {
        email: email2,
        username: username2,
        password: hashed2,
        firstName: 'Admin2',
        lastName: 'NotAlone',
        role: Role.ADMIN,
      },
    });

    console.log('Created admin user:', user2.username);
  }

  // Create 5 sample users (skip if they exist)
  const seedUsers: Array<{ username: string; email: string; firstName: string; lastName?: string }> = [];
  for (let i = 1; i <= 5; i++) {
    seedUsers.push({ username: `seeduser${i}`, email: `seeduser${i}@notalone.local`, firstName: `User${i}` });
  }

  const createdUsers: any[] = [];
  for (const su of seedUsers) {
    const found = await prisma.user.findUnique({ where: { username: su.username } });
    if (found) {
      createdUsers.push(found);
      continue;
    }
    const hashedUserPass = await bcrypt.hash('password123', 12);
    const u = await prisma.user.create({ data: { username: su.username, email: su.email, password: hashedUserPass, firstName: su.firstName } });
    createdUsers.push(u);
    console.log('Created seed user:', u.username);
  }

  // If there are already many posts, skip creating sample posts to avoid duplication
  const existingPosts = await prisma.post.count();
  if (existingPosts >= 40) {
    console.log('Already have', existingPosts, 'posts — skipping sample posts creation.');
    return;
  }

  // Helper functions
  const moods = ['happy', 'grateful', 'hopeful', 'calm', 'loved', 'strong', 'anxious', 'sad', 'lonely', 'struggling'];
  function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Create 40 posts distributed among seed users
  const POSTS = 40;
  const lorem = 'Ceci est un message d\'exemple pour NotAlone — partage tes pensées et rappelle-toi que tu n\'es pas seul.';

  for (let i = 0; i < POSTS; i++) {
    const author = pick(createdUsers);
    const mood = Math.random() < 0.7 ? pick(moods) : null;
    const content = `${lorem} (post #${i + 1})`;
    const createdAt = new Date(Date.now() - randInt(0, 60) * 24 * 60 * 60 * 1000 - randInt(0, 1440) * 60 * 1000);

    const post = await prisma.post.create({
      data: {
        content,
        mood: mood ?? undefined,
        isPublic: true,
        createdAt,
        author: { connect: { id: author.id } },
      },
    });

    // Add comments (1-5)
    const commentsCount = randInt(1, 5);
    for (let c = 0; c < commentsCount; c++) {
      const commenter = pick(createdUsers);
      await prisma.comment.create({ data: { content: `Commentaire d'exemple ${c + 1} sur le post ${i + 1}`, post: { connect: { id: post.id } }, author: { connect: { id: commenter.id } }, createdAt: new Date(post.createdAt.getTime() + randInt(1, 60) * 60000) } });
    }

    // Add likes (0 - up to all users)
    const likesCount = randInt(0, createdUsers.length);
    const shuffled = createdUsers.sort(() => 0.5 - Math.random());
    for (let l = 0; l < likesCount; l++) {
      const liker = shuffled[l];
      try {
        await prisma.like.create({ data: { post: { connect: { id: post.id } }, user: { connect: { id: liker.id } } } });
      } catch (e) {
        // ignore duplicate unique constraint
      }
    }
  }

  console.log('Seed: created', POSTS, 'posts with comments and likes.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
