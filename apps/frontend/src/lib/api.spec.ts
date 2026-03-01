import { createPost, viewPost } from './api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('api client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should return slug on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ slug: 'abc123' }),
      });

      const result = await createPost({
        title: 'Test',
        content: '<p>hello</p>',
        password: 'pass',
      });

      expect(result).toEqual({ slug: 'abc123' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/posts');
      expect(options.method).toBe('POST');
    });

    it('should send expiresIn when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ slug: 'xyz' }),
      });

      await createPost({
        title: 'Test',
        content: '<p>hi</p>',
        password: 'pass',
        expiresIn: 24,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.expiresIn).toBe(24);
    });

    it('should throw Korean error on failure', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(
        createPost({ title: 'T', content: 'C', password: 'P' })
      ).rejects.toThrow('게시글 저장에 실패했습니다.');
    });
  });

  describe('viewPost', () => {
    it('should return title and content on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ title: 'Secret', content: '<p>hidden</p>' }),
      });

      const result = await viewPost('abc', { password: 'pass' });

      expect(result).toEqual({ title: 'Secret', content: '<p>hidden</p>' });
    });

    it('should throw on 401 (wrong password)', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401 });

      await expect(viewPost('abc', { password: 'wrong' })).rejects.toThrow(
        '비밀번호가 올바르지 않습니다.'
      );
    });

    it('should throw on 404 (not found)', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });

      await expect(viewPost('nope', { password: 'p' })).rejects.toThrow(
        '존재하지 않는 게시글입니다.'
      );
    });

    it('should throw on 410 (expired)', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 410 });

      await expect(viewPost('old', { password: 'p' })).rejects.toThrow(
        '만료된 게시글입니다.'
      );
    });

    it('should throw generic error on 500', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(viewPost('err', { password: 'p' })).rejects.toThrow(
        '오류가 발생했습니다.'
      );
    });

    it('should call the correct URL with slug', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ title: 'T', content: 'C' }),
      });

      await viewPost('my-slug', { password: 'p' });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('/posts/my-slug/unlock');
    });
  });
});
