'use client';

import { useState } from 'react';
import { viewPost } from '../../lib/api';
import { sanitizeHtml } from '../../lib/sanitize';

type Step = 'auth' | 'view';

export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const [step, setStep] = useState<Step>('auth');
  const [password, setPassword] = useState('');
  const [post, setPost] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { slug } = await params;
      const data = await viewPost(slug, { password });
      setPost(data);
      setStep('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'view' && post) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-xl font-semibold mb-8">{post.title}</h1>
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-xl font-semibold mb-6">비밀번호를 입력하세요</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="border border-gray-900 rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? '확인 중...' : '확인'}
        </button>
      </form>
    </main>
  );
}
