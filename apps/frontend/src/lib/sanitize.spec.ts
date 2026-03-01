import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  describe('XSS prevention', () => {
    it('should remove <script> tags', () => {
      const result = sanitizeHtml('<p>Hello</p><script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove onclick attributes', () => {
      const result = sanitizeHtml('<p onclick="alert(1)">Click</p>');
      expect(result).not.toContain('onclick');
      expect(result).toContain('<p>Click</p>');
    });

    it('should remove onerror on img tags', () => {
      const result = sanitizeHtml(
        '<img src="x" onerror="alert(1)">'
      );
      expect(result).not.toContain('onerror');
    });

    it('should remove iframe tags', () => {
      const result = sanitizeHtml(
        '<iframe src="https://evil.com"></iframe>'
      );
      expect(result).not.toContain('<iframe');
    });

    it('should remove javascript: protocol in href', () => {
      const result = sanitizeHtml(
        '<a href="javascript:alert(1)">Click</a>'
      );
      expect(result).not.toContain('javascript:');
    });
  });

  describe('allowed tags preservation', () => {
    it('should preserve basic formatting tags', () => {
      const html =
        '<p><strong>Bold</strong> <em>Italic</em> <u>Underline</u> <s>Strike</s></p>';
      const result = sanitizeHtml(html);
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).toContain('<em>Italic</em>');
      expect(result).toContain('<u>Underline</u>');
      expect(result).toContain('<s>Strike</s>');
    });

    it('should preserve img tags with src and alt', () => {
      const html = '<img src="https://example.com/img.png" alt="photo">';
      const result = sanitizeHtml(html);
      expect(result).toContain('src="https://example.com/img.png"');
      expect(result).toContain('alt="photo"');
    });

    it('should preserve anchor tags with href', () => {
      const html = '<a href="https://example.com" target="_blank">Link</a>';
      const result = sanitizeHtml(html);
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('target="_blank"');
    });

    it('should preserve list elements', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeHtml(html);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>Item 1</li>');
    });

    it('should preserve headings', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2>';
      const result = sanitizeHtml(html);
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<h2>Subtitle</h2>');
    });
  });
});
