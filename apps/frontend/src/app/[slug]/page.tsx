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
      <section className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-text-primary">{post.title}</h1>
        <hr className="mt-4 mb-8 border-border" />
        <article
          className="prose prose-slate max-w-none prose-headings:text-text-primary prose-p:text-text-primary prose-a:text-brand-600 prose-strong:text-text-primary prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-xl border border-border bg-surface-card p-8 shadow-md text-center">
        {/* Lock icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-brand-600">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="text-lg font-semibold text-text-primary">보호된 문서</h1>
        <p className="mt-1 text-sm text-text-secondary">
          이 문서는 비밀번호로 보호되어 있습니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-center text-sm shadow-sm transition-colors focus:border-border-focus focus:outline-none"
          />

          {error && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-error-bg px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-error">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? '확인 중...' : '열람하기'}
          </button>
        </form>
      </div>
    </section>
  );
}
