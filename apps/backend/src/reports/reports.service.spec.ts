import { AppError } from '../lib/errors';
import { createReport } from './reports.service';

jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    post: {
      findUnique: jest.fn(),
    },
    report: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import prisma from '../lib/prisma';

const mockPost = prisma.post as jest.Mocked<typeof prisma.post>;
const mockReport = prisma.report as jest.Mocked<typeof prisma.report>;

const VALID_POST = {
  id: 'post-id-1',
  slug: 'abc123',
  title: 'Test',
  content: '<p>hello</p>',
  passwordHash: 'hash',
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('reports.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    it('정상적인 신고를 생성하고 postId, reason, ip를 저장한다', async () => {
      (mockPost.findUnique as jest.Mock).mockResolvedValue(VALID_POST);
      (mockReport.findFirst as jest.Mock).mockResolvedValue(null);
      (mockReport.create as jest.Mock).mockResolvedValue({});

      await expect(
        createReport('abc123', 'ILLEGAL_CONTENT', undefined, '1.2.3.4')
      ).resolves.toBeUndefined();

      expect(mockReport.create).toHaveBeenCalledWith({
        data: {
          postId: 'post-id-1',
          reason: 'ILLEGAL_CONTENT',
          description: undefined,
          reporterIp: '1.2.3.4',
        },
      });
    });

    it('description이 있으면 함께 저장한다', async () => {
      (mockPost.findUnique as jest.Mock).mockResolvedValue(VALID_POST);
      (mockReport.findFirst as jest.Mock).mockResolvedValue(null);
      (mockReport.create as jest.Mock).mockResolvedValue({});

      await createReport('abc123', 'OTHER', '상세 설명', '1.2.3.4');

      const createArg = (mockReport.create as jest.Mock).mock.calls[0][0];
      expect(createArg.data.description).toBe('상세 설명');
    });

    it('존재하지 않는 게시글이면 NOT_FOUND를 던진다', async () => {
      (mockPost.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        createReport('no-exist', 'PHISHING', undefined, '1.2.3.4')
      ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });

      expect(mockReport.create).not.toHaveBeenCalled();
    });

    it('만료된 게시글이면 EXPIRED를 던진다', async () => {
      (mockPost.findUnique as jest.Mock).mockResolvedValue({
        ...VALID_POST,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        createReport('abc123', 'DEFAMATION', undefined, '1.2.3.4')
      ).rejects.toMatchObject({ statusCode: 410, code: 'EXPIRED' });

      expect(mockReport.create).not.toHaveBeenCalled();
    });

    it('동일 IP가 같은 게시글을 같은 사유로 이미 신고했으면 ALREADY_REPORTED를 던진다', async () => {
      (mockPost.findUnique as jest.Mock).mockResolvedValue(VALID_POST);
      (mockReport.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-report' });

      await expect(
        createReport('abc123', 'COPYRIGHT', undefined, '1.2.3.4')
      ).rejects.toMatchObject({ statusCode: 409, code: 'ALREADY_REPORTED' });

      expect(mockReport.create).not.toHaveBeenCalled();
    });

    it('동일 IP라도 다른 사유로는 같은 게시글을 신고할 수 있다', async () => {
      (mockPost.findUnique as jest.Mock).mockResolvedValue(VALID_POST);
      (mockReport.findFirst as jest.Mock).mockResolvedValue(null);
      (mockReport.create as jest.Mock).mockResolvedValue({});

      await expect(
        createReport('abc123', 'DEFAMATION', undefined, '1.2.3.4')
      ).resolves.toBeUndefined();

      expect(mockReport.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ reason: 'DEFAMATION' }) })
      );
    });

    it('동일 IP라도 다른 게시글은 신고할 수 있다', async () => {
      (mockPost.findUnique as jest.Mock).mockResolvedValue({ ...VALID_POST, id: 'post-id-2' });
      (mockReport.findFirst as jest.Mock).mockResolvedValue(null);
      (mockReport.create as jest.Mock).mockResolvedValue({});

      await expect(
        createReport('xyz789', 'PERSONAL_INFO', undefined, '1.2.3.4')
      ).resolves.toBeUndefined();
    });
  });
});
