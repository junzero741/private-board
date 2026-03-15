import { initStorage, getStorage } from './storage';

// R2StorageProvider 생성자가 S3Client를 실제로 호출하지 않도록 mock
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

const R2_ENV = {
  R2_ACCOUNT_ID: 'test-account',
  R2_ACCESS_KEY_ID: 'test-key',
  R2_SECRET_ACCESS_KEY: 'test-secret',
  R2_BUCKET_NAME: 'test-bucket',
  R2_PUBLIC_URL: 'https://test.r2.dev',
};

describe('initStorage', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('local provider', () => {
    it('should initialize LocalStorageProvider when NODE_ENV is not production', () => {
      process.env.STORAGE_PROVIDER = 'local';
      process.env.NODE_ENV = 'development';

      expect(() => initStorage()).not.toThrow();
    });

    it('should throw when STORAGE_PROVIDER=local in production', () => {
      process.env.STORAGE_PROVIDER = 'local';
      process.env.NODE_ENV = 'production';

      expect(() => initStorage()).toThrow('LocalStorageProvider is not allowed in production');
    });

    it('should default to local provider when STORAGE_PROVIDER is not set', () => {
      delete process.env.STORAGE_PROVIDER;
      process.env.NODE_ENV = 'development';

      expect(() => initStorage()).not.toThrow();
    });
  });

  describe('r2 provider', () => {
    it('should initialize R2StorageProvider when all env vars are present', () => {
      process.env.STORAGE_PROVIDER = 'r2';
      Object.assign(process.env, R2_ENV);

      expect(() => initStorage()).not.toThrow();
    });

    it('should throw when R2 env vars are missing', () => {
      process.env.STORAGE_PROVIDER = 'r2';
      delete process.env.R2_ACCOUNT_ID;

      expect(() => initStorage()).toThrow(/R2 storage missing env vars/);
    });
  });

  describe('unknown provider', () => {
    it('should throw for unknown STORAGE_PROVIDER value', () => {
      process.env.STORAGE_PROVIDER = 'gcs';

      expect(() => initStorage()).toThrow('Unknown storage provider: gcs');
    });
  });

  describe('re-initialization', () => {
    it('should allow calling initStorage() multiple times (overwrite)', () => {
      process.env.STORAGE_PROVIDER = 'local';
      process.env.NODE_ENV = 'development';

      initStorage();
      expect(() => initStorage()).not.toThrow();
    });
  });
});

describe('getStorage', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // 각 테스트마다 fresh 모듈로 격리
    jest.resetModules();
    jest.mock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn().mockImplementation(() => ({})),
      PutObjectCommand: jest.fn(),
      DeleteObjectCommand: jest.fn(),
    }));
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw if called before initStorage', () => {
    const { getStorage: freshGetStorage } = require('./storage');

    expect(() => freshGetStorage()).toThrow('Storage not initialized. Call initStorage() first.');
  });

  it('should return the initialized storage instance after initStorage', () => {
    process.env.STORAGE_PROVIDER = 'local';
    process.env.NODE_ENV = 'development';

    const { initStorage: freshInit, getStorage: freshGetStorage } = require('./storage');
    freshInit();
    const storage = freshGetStorage();

    expect(storage).toBeDefined();
    expect(typeof storage.save).toBe('function');
    expect(typeof storage.delete).toBe('function');
  });
});
