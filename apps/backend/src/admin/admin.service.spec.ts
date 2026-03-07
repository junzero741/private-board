import { AppError } from '../lib/errors';
import { getReports, deletePost, dismissReport } from './admin.service';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    post: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    report: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import prisma from '../lib/prisma';

const mockPost = prisma.post as jest.Mocked<typeof prisma.post>;
const mockReport = prisma.report as jest.Mocked<typeof prisma.report>;

const PENDING_REPORT = {
  id: 'report-id-1',
  postId: 'post-id-1',
  reason: 'ILLEGAL_CONTENT',
  description: null,
  reporterIp: '1.2.3.4',
  status: 'PENDING',
  createdAt: new Date(),
  post: {
    slug: 'abc123',
    title: '신고 게시글',
    content: '<p>내용</p>',
  },
};

describe('admin.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReports', () => {
    it('PENDING 상태의 신고 목록을 최신순으로 반환한다', async () => {
      (mockReport.findMany as jest.Mock).mockResolvedValue([PENDING_REPORT]);

      const result = await getReports();

      expect(result).toEqual([PENDING_REPORT]);
      expect(mockReport.findMany).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
        include: { post: { select: { slug: true, title: true, content: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('신고가 없으면 빈 배열을 반환한다', async () => {
      (mockReport.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getReports();

      expect(result).toEqual([]);
    });
  });

  describe('deletePost', () => {
    it('존재하는 게시글을 삭제한다', async () => {
      (mockPost.findUnique as jest.Mock).mockResolvedValue({ id: 'post-id-1', slug: 'abc123' });
      (mockPost.delete as jest.Mock).mockResolvedValue({});

      await expect(deletePost('abc123')).resolves.toBeUndefined();

      expect(mockPost.delete).toHaveBeenCalledWith({ where: { slug: 'abc123' } });
    });

    it('존재하지 않는 게시글이면 NOT_FOUND를 던진다', async () => {
      (mockPost.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(deletePost('no-exist')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });

      expect(mockPost.delete).not.toHaveBeenCalled();
    });
  });

  describe('dismissReport', () => {
    it('신고를 DISMISSED 상태로 변경한다', async () => {
      (mockReport.findUnique as jest.Mock).mockResolvedValue({ id: 'report-id-1', status: 'PENDING' });
      (mockReport.update as jest.Mock).mockResolvedValue({});

      await expect(dismissReport('report-id-1')).resolves.toBeUndefined();

      expect(mockReport.update).toHaveBeenCalledWith({
        where: { id: 'report-id-1' },
        data: { status: 'DISMISSED' },
      });
    });

    it('존재하지 않는 신고이면 NOT_FOUND를 던진다', async () => {
      (mockReport.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(dismissReport('no-exist')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });

      expect(mockReport.update).not.toHaveBeenCalled();
    });
  });
});
