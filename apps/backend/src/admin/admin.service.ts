import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';

export async function getReports() {
  return prisma.report.findMany({
    where: { status: 'PENDING' },
    include: { post: { select: { slug: true, title: true, content: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deletePost(slug: string): Promise<void> {
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) throw new AppError(404, 'Post not found', 'NOT_FOUND');
  await prisma.post.delete({ where: { slug } });
}

export async function dismissReport(id: string): Promise<void> {
  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) throw new AppError(404, 'Report not found', 'NOT_FOUND');
  await prisma.report.update({ where: { id }, data: { status: 'DISMISSED' } });
}
