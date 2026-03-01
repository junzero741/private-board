import { extractImageFilenames, cleanupExpiredPosts } from './cleanup';

jest.mock('./prisma', () => ({
  __esModule: true,
  default: {
    post: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('./storage', () => ({
  getStorage: jest.fn(),
}));

import prisma from './prisma';
import { getStorage } from './storage';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetStorage = getStorage as jest.MockedFunction<typeof getStorage>;

describe('extractImageFilenames', () => {
  it('should extract filename from /uploads/ URL', () => {
    const html = '<img src="http://localhost:4000/uploads/abc123.jpg">';
    expect(extractImageFilenames(html)).toEqual(['abc123.jpg']);
  });

  it('should extract filename from .r2.dev/ URL', () => {
    const html = '<img src="https://my-bucket.r2.dev/img_456.png">';
    expect(extractImageFilenames(html)).toEqual(['img_456.png']);
  });

  it('should extract filename from .cloudflare.com/ URL', () => {
    const html = '<img src="https://pub-xyz.r2.dev/file-name.webp">';
    expect(extractImageFilenames(html)).toEqual(['file-name.webp']);
  });

  it('should extract multiple filenames from HTML with mixed URLs', () => {
    const html = `
      <p>Hello</p>
      <img src="http://localhost:4000/uploads/aaa.jpg">
      <img src="https://bucket.r2.dev/bbb.png">
      <p>World</p>
    `;
    expect(extractImageFilenames(html)).toEqual(['aaa.jpg', 'bbb.png']);
  });

  it('should return empty array when no images found', () => {
    const html = '<p>No images here</p>';
    expect(extractImageFilenames(html)).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(extractImageFilenames('')).toEqual([]);
  });
});

describe('cleanupExpiredPosts', () => {
  let mockStorage: { delete: jest.Mock; save: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = { delete: jest.fn().mockResolvedValue(undefined), save: jest.fn() };
    mockGetStorage.mockReturnValue(mockStorage);
  });

  it('should do nothing when no expired posts exist', async () => {
    (mockPrisma.post.findMany as jest.Mock).mockResolvedValue([]);

    await cleanupExpiredPosts();

    expect(mockPrisma.post.deleteMany).not.toHaveBeenCalled();
  });

  it('should delete images and posts for expired posts', async () => {
    const expiredPosts = [
      {
        id: 1,
        content: '<img src="http://localhost:4000/uploads/img1.jpg">',
        expiresAt: new Date(Date.now() - 1000),
      },
    ];
    (mockPrisma.post.findMany as jest.Mock).mockResolvedValue(expiredPosts);
    (mockPrisma.post.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await cleanupExpiredPosts();

    expect(mockStorage.delete).toHaveBeenCalledWith('img1.jpg');
    expect(mockPrisma.post.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [1] } },
    });
  });

  it('should continue deleting other images if one fails', async () => {
    const expiredPosts = [
      {
        id: 1,
        content:
          '<img src="http://localhost:4000/uploads/a.jpg"><img src="http://localhost:4000/uploads/b.png">',
        expiresAt: new Date(Date.now() - 1000),
      },
    ];
    (mockPrisma.post.findMany as jest.Mock).mockResolvedValue(expiredPosts);
    (mockPrisma.post.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    mockStorage.delete
      .mockRejectedValueOnce(new Error('file not found'))
      .mockResolvedValueOnce(undefined);

    await cleanupExpiredPosts();

    expect(mockStorage.delete).toHaveBeenCalledTimes(2);
    expect(mockPrisma.post.deleteMany).toHaveBeenCalled();
  });

  it('should handle posts with no images', async () => {
    const expiredPosts = [
      { id: 1, content: '<p>text only</p>', expiresAt: new Date(Date.now() - 1000) },
    ];
    (mockPrisma.post.findMany as jest.Mock).mockResolvedValue(expiredPosts);
    (mockPrisma.post.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await cleanupExpiredPosts();

    expect(mockStorage.delete).not.toHaveBeenCalled();
    expect(mockPrisma.post.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [1] } },
    });
  });
});
