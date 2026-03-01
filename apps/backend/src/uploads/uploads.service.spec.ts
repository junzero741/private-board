import { AppError } from '../lib/errors';
import { uploadImage } from './uploads.service';

jest.mock('../lib/storage', () => ({
  getStorage: jest.fn(),
}));

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-nanoid1'),
}));

import { getStorage } from '../lib/storage';

const mockGetStorage = getStorage as jest.MockedFunction<typeof getStorage>;

describe('uploads.service', () => {
  let mockStorage: { save: jest.Mock; delete: jest.Mock };
  const buffer = Buffer.from('fake-image-data');

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = {
      save: jest.fn().mockResolvedValue('http://localhost:4000/uploads/mock-nanoid1.jpg'),
      delete: jest.fn(),
    };
    mockGetStorage.mockReturnValue(mockStorage);
  });

  describe('allowed MIME types', () => {
    it.each([
      ['image/jpeg', 'jpg'],
      ['image/png', 'png'],
      ['image/gif', 'gif'],
      ['image/webp', 'webp'],
    ])('should accept %s and use .%s extension', async (mimeType, ext) => {
      mockStorage.save.mockResolvedValue(`http://localhost:4000/uploads/mock-nanoid1.${ext}`);

      const result = await uploadImage(buffer, mimeType);

      expect(result.url).toContain(`mock-nanoid1.${ext}`);
      expect(mockStorage.save).toHaveBeenCalledWith(buffer, `mock-nanoid1.${ext}`, mimeType);
    });
  });

  describe('rejected MIME types', () => {
    it.each(['application/pdf', 'text/html', 'image/svg+xml', 'text/plain'])(
      'should reject %s with INVALID_MIME_TYPE',
      async (mimeType) => {
        await expect(uploadImage(buffer, mimeType)).rejects.toThrow(AppError);
        await expect(uploadImage(buffer, mimeType)).rejects.toMatchObject({
          statusCode: 400,
          code: 'INVALID_MIME_TYPE',
        });
        expect(mockStorage.save).not.toHaveBeenCalled();
      }
    );
  });

  it('should generate a nanoid-based filename', async () => {
    await uploadImage(buffer, 'image/png');

    expect(mockStorage.save).toHaveBeenCalledWith(
      buffer,
      'mock-nanoid1.png',
      'image/png'
    );
  });

  it('should return the URL from storage.save', async () => {
    const expectedUrl = 'https://bucket.r2.dev/mock-nanoid1.jpg';
    mockStorage.save.mockResolvedValue(expectedUrl);

    const result = await uploadImage(buffer, 'image/jpeg');

    expect(result).toEqual({ url: expectedUrl });
  });
});
