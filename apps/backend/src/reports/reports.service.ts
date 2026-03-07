import prisma from '../lib/prisma';
import { AppError } from '../lib/errors';
import { ReportReason } from '@private-board/shared';

export async function createReport(
  slug: string,
  reason: ReportReason,
  description: string | undefined,
  ip: string
): Promise<void> {
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) throw new AppError(404, 'Post not found', 'NOT_FOUND');
  if (post.expiresAt && post.expiresAt < new Date()) {
    throw new AppError(410, 'Post has expired', 'EXPIRED');
  }

  const existing = await prisma.report.findFirst({
    where: { postId: post.id, reporterIp: ip, reason, status: 'PENDING' },
  });
  if (existing) throw new AppError(409, 'Already reported', 'ALREADY_REPORTED');

  await prisma.report.create({
    data: { postId: post.id, reason, description, reporterIp: ip },
  });
}
