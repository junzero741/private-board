import { nanoid } from 'nanoid';
import { getStorage } from '../lib/storage';
import { AppError } from '../lib/errors';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export async function uploadImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ url: string }> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new AppError(400, 'Only jpeg, png, gif, webp images are allowed', 'INVALID_MIME_TYPE');
  }

  const ext = MIME_TO_EXT[mimeType];
  const filename = `${nanoid(12)}.${ext}`;
  const url = await getStorage().save(buffer, filename, mimeType);

  return { url };
}
