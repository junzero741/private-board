'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '../components/Editor';
import { createPost } from '../lib/api';
import { replaceBlobsWithUrls } from '../lib/image';

type Step = 'write' | 'done';

const DRAFT_KEY = 'private-board-draft';

interface Draft {
  title: string;
  content: string;
  expiresIn: string;
  savedAt: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Page() {
  const [step, setStep] = useState<Step>('write');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [error, setError] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('24');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [initialContent, setInitialContent] = useState<string | undefined>(undefined);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft: Draft = JSON.parse(raw);
        setTitle(draft.title);
        setContent(draft.content);
        setInitialContent(draft.content);
        setExpiresIn(draft.expiresIn);
        setSavedAt(draft.savedAt);
      } else {
        setInitialContent('');
      }
    } catch {
      setInitialContent('');
    }
    setDraftLoaded(true);
    mountedRef.current = true;
  }, []);

  // Auto-save with 1s debounce
  const saveDraft = useCallback(() => {
    if (!mountedRef.current) return;
    const draft: Draft = {
      title,
      content,
      expiresIn,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setSavedAt(draft.savedAt);
  }, [title, content, expiresIn]);

  useEffect(() => {
    if (!mountedRef.current) return;
    // Don't save empty drafts
    if (!title && (!content || content === '<p></p>')) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(saveDraft, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, content, expiresIn, saveDraft]);

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setSavedAt(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('제목을 입력해주세요.');
    if (!content || content === '<p></p>') return setError('내용을 입력해주세요.');
    if (!password) return setError('비밀번호를 입력해주세요.');

    setLoading(true);
    try {
      const finalContent = await replaceBlobsWithUrls(content);
      const { slug } = await createPost({
        title,
        content: finalContent,
        password,
        expiresIn: expiresIn === '' ? undefined : Number(expiresIn),
      });
      clearDraft();
      setGeneratedUrl(`${window.location.origin}/${slug}`);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === 'done') {
    return (
      <section className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-xl border border-border bg-surface-card p-8 shadow-md text-center">
          {/* Check icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-success">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-text-primary">
            링크가 생성되었습니다
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            아래 링크를 복사하여 공유하세요.
          </p>

          {/* URL display */}
          <div className="mt-6 flex items-center gap-2">
            <input
              readOnly
              value={generatedUrl}
              className="flex-1 rounded-lg border border-border bg-brand-50/50 px-3 py-2.5 font-mono text-sm text-text-primary"
            />
            <button
              onClick={handleCopy}
              className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                copied
                  ? 'bg-success-bg text-success'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              {copied ? '복사됨' : '복사'}
            </button>
          </div>

          <button
            onClick={() => {
              clearDraft();
              setStep('write');
              setTitle('');
              setContent('');
              setPassword('');
              setExpiresIn('24');
              setGeneratedUrl('');
              setInitialContent('');
            }}
            className="mt-6 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            새 글 작성
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-text-primary mb-8">
        새 글 작성
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-text-secondary">
            제목
          </label>
          <input
            id="title"
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-border bg-surface-card px-3 py-2.5 text-sm shadow-sm transition-colors focus:border-border-focus focus:outline-none"
          />
        </div>

        {/* Editor */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">
            내용
          </label>
          {draftLoaded && <Editor onChange={setContent} initialContent={initialContent} />}
          {savedAt && (
            <p className="text-xs text-text-muted">
              임시저장됨 {formatTime(savedAt)}
            </p>
          )}
        </div>

        {/* Password + Expiry grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-text-secondary">
              비밀번호
            </label>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                type="password"
                placeholder="비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-card py-2.5 pl-10 pr-3 text-sm shadow-sm transition-colors focus:border-border-focus focus:outline-none"
              />
            </div>
          </div>

          {/* Expiry */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="expires" className="text-sm font-medium text-text-secondary">
              만료 시간
            </label>
            <div className="relative">
              <select
                id="expires"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-surface-card px-3 py-2.5 pr-10 text-sm shadow-sm transition-colors focus:border-border-focus focus:outline-none"
              >
                <option value="1">1시간 후 만료</option>
                <option value="24">24시간 후 만료</option>
                <option value="168">7일 후 만료</option>
                <option value="720">30일 후 만료</option>
                <option value="">무제한</option>
              </select>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-error-bg px-4 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-error">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Submit */}
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
          {loading ? '생성 중...' : '링크 생성'}
        </button>
      </form>
    </section>
  );
}
