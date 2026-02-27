import bcrypt from 'bcrypt';
import { AppError } from '../lib/errors';
import { createPost, unlockPost } from './posts.service';

// Mock prisma
jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock nanoid to return predictable slugs
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-slug-12'),
}));

import prisma from '../lib/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('posts.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post and return a slug', async () => {
      (mockPrisma.post.create as jest.Mock).mockResolvedValue({});

      const result = await createPost('Test Title', '<p>content</p>', 'mypass');

      expect(result).toEqual({ slug: 'test-slug-12' });
      expect(mockPrisma.post.create).toHaveBeenCalledTimes(1);

      const createArg = (mockPrisma.post.create as jest.Mock).mock.calls[0][0];
      expect(createArg.data.slug).toBe('test-slug-12');
      expect(createArg.data.title).toBe('Test Title');
      expect(createArg.data.content).toBe('<p>content</p>');
      expect(createArg.data.expiresAt).toBeNull();

      // bcrypt hash should be valid
      const match = await bcrypt.compare('mypass', createArg.data.passwordHash);
      expect(match).toBe(true);
    });

    it('should calculate expiresAt when expiresIn is provided', async () => {
      (mockPrisma.post.create as jest.Mock).mockResolvedValue({});

      const before = Date.now();
      await createPost('Title', 'content', 'pass', 24);
      const after = Date.now();

      const createArg = (mockPrisma.post.create as jest.Mock).mock.calls[0][0];
      const expiresAt = createArg.data.expiresAt as Date;

      expect(expiresAt).toBeInstanceOf(Date);
      // 24 hours = 86400000 ms
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000);
    });

    it('should set expiresAt to null when expiresIn is not provided', async () => {
      (mockPrisma.post.create as jest.Mock).mockResolvedValue({});

      await createPost('Title', 'content', 'pass');

      const createArg = (mockPrisma.post.create as jest.Mock).mock.calls[0][0];
      expect(createArg.data.expiresAt).toBeNull();
    });
  });

  describe('unlockPost', () => {
    it('should return title and content for correct password', async () => {
      const hash = await bcrypt.hash('correct', 10);
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue({
        slug: 'abc',
        title: 'Secret',
        content: '<p>hidden</p>',
        passwordHash: hash,
        expiresAt: null,
      });

      const result = await unlockPost('abc', 'correct');

      expect(result).toEqual({ title: 'Secret', content: '<p>hidden</p>' });
    });

    it('should return null for non-existent slug', async () => {
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await unlockPost('no-exist', 'pass');

      expect(result).toBeNull();
    });

    it('should throw WRONG_PASSWORD for incorrect password', async () => {
      const hash = await bcrypt.hash('correct', 10);
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue({
        slug: 'abc',
        title: 'Secret',
        content: '<p>hidden</p>',
        passwordHash: hash,
        expiresAt: null,
      });

      await expect(unlockPost('abc', 'wrong')).rejects.toThrow(AppError);
      await expect(unlockPost('abc', 'wrong')).rejects.toMatchObject({
        statusCode: 401,
        code: 'WRONG_PASSWORD',
      });
    });

    it('should throw EXPIRED for an expired post', async () => {
      const hash = await bcrypt.hash('pass', 10);
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue({
        slug: 'abc',
        title: 'Old',
        content: '<p>expired</p>',
        passwordHash: hash,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      });

      await expect(unlockPost('abc', 'pass')).rejects.toThrow(AppError);
      await expect(unlockPost('abc', 'pass')).rejects.toMatchObject({
        statusCode: 410,
        code: 'EXPIRED',
      });
    });

    it('should succeed for a post that has not expired yet', async () => {
      const hash = await bcrypt.hash('pass', 10);
      (mockPrisma.post.findUnique as jest.Mock).mockResolvedValue({
        slug: 'abc',
        title: 'Fresh',
        content: '<p>still valid</p>',
        passwordHash: hash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      });

      const result = await unlockPost('abc', 'pass');

      expect(result).toEqual({ title: 'Fresh', content: '<p>still valid</p>' });
    });
  });
});
