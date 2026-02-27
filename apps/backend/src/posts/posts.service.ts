import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';

export async function createPost(
  title: string,
  content: string,
  password: string,
  expiresIn?: number
): Promise<{ slug: string }> {
  const slug = nanoid(12);
  const passwordHash = await bcrypt.hash(password, 10);
  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
    : null;

  await prisma.post.create({
    data: { slug, title, content, passwordHash, expiresAt },
  });

  return { slug };
}

export async function unlockPost(
  slug: string,
  password: string
): Promise<{ title: string; content: string } | null> {
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return null;

  if (post.expiresAt && post.expiresAt < new Date()) {
    throw new AppError(410, 'This post has expired', 'EXPIRED');
  }

  const match = await bcrypt.compare(password, post.passwordHash);
  if (!match) throw new AppError(401, 'Invalid password', 'WRONG_PASSWORD');

  return { title: post.title, content: post.content };
}
