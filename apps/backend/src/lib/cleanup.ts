import prisma from './prisma';
import { getStorage } from './storage';

const IMAGE_FILENAME_RE = /(?:\/uploads\/|\.r2\.dev\/|\.cloudflare\.com\/[^/]+\/)([a-zA-Z0-9_-]+\.\w+)/g;

function extractImageFilenames(html: string): string[] {
  const filenames: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = IMAGE_FILENAME_RE.exec(html)) !== null) {
    filenames.push(match[1]);
  }
  IMAGE_FILENAME_RE.lastIndex = 0;
  return filenames;
}

export async function cleanupExpiredPosts(): Promise<void> {
  try {
    const expiredPosts = await prisma.post.findMany({
      where: { expiresAt: { lte: new Date() } },
    });

    if (expiredPosts.length === 0) return;

    console.log(`[cleanup] Found ${expiredPosts.length} expired post(s)`);

    const storage = getStorage();

    for (const post of expiredPosts) {
      const filenames = extractImageFilenames(post.content);
      for (const filename of filenames) {
        try {
          await storage.delete(filename);
          console.log(`[cleanup] Deleted image: ${filename}`);
        } catch (err) {
          console.error(`[cleanup] Failed to delete image ${filename}:`, err);
        }
      }
    }

    const { count } = await prisma.post.deleteMany({
      where: { id: { in: expiredPosts.map((p) => p.id) } },
    });

    console.log(`[cleanup] Deleted ${count} expired post(s)`);
  } catch (err) {
    console.error('[cleanup] Cleanup job failed:', err);
  }
}
