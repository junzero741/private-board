import * as fs from 'fs/promises';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface StorageProvider {
  save(buffer: Buffer, filename: string, mimeType: string): Promise<string>;
}

export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.uploadDir = path.resolve(__dirname, '../../uploads');
    const port = process.env.PORT ?? '4000';
    const host = process.env.HOST ?? 'localhost';
    this.baseUrl = `http://${host}:${port}/uploads`;
  }

  async save(buffer: Buffer, filename: string, _mimeType: string): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    const filePath = path.join(this.uploadDir, filename);
    await fs.writeFile(filePath, buffer);
    return `${this.baseUrl}/${filename}`;
  }
}

export class R2StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    const missing = Object.entries({ R2_ACCOUNT_ID: accountId, R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey, R2_BUCKET_NAME: bucket, R2_PUBLIC_URL: publicUrl })
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length > 0) {
      throw new Error(`R2 storage missing env vars: ${missing.join(', ')}`);
    }

    this.bucket = bucket;
    this.publicUrl = publicUrl.replace(/\/$/, '');
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async save(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    return `${this.publicUrl}/${filename}`;
  }
}

let storage: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!storage) {
    const provider = process.env.STORAGE_PROVIDER ?? 'local';
    switch (provider) {
      case 'local':
        storage = new LocalStorageProvider();
        break;
      case 'r2':
        storage = new R2StorageProvider();
        break;
      default:
        throw new Error(`Unknown storage provider: ${provider}`);
    }
  }
  return storage;
}
