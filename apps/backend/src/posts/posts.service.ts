import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import prisma from '../lib/prisma';

export async function createPost(
  title: string,
  content: string,
  password: string
): Promise<{ slug: string }> {
  const slug = nanoid(12);
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.post.create({
    data: { slug, title, content, passwordHash },
  });

  return { slug };
}

export async function unlockPost(
  slug: string,
  password: string
): Promise<{ title: string; content: string } | null> {
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return null;

  const match = await bcrypt.compare(password, post.passwordHash);
  if (!match) throw new Error('WRONG_PASSWORD');

  return { title: post.title, content: post.content };
}
