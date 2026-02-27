import * as fs from 'fs/promises';
import * as path from 'path';

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

let storage: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!storage) {
    const provider = process.env.STORAGE_PROVIDER ?? 'local';
    switch (provider) {
      case 'local':
        storage = new LocalStorageProvider();
        break;
      default:
        throw new Error(`Unknown storage provider: ${provider}`);
    }
  }
  return storage;
}
