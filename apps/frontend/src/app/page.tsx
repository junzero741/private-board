'use client';

import { useState } from 'react';
import Editor from '../components/Editor';
import { createPost } from '../lib/api';
import { replaceBlobsWithUrls } from '../lib/image';

type Step = 'write' | 'done';

export default function Page() {
  const [step, setStep] = useState<Step>('write');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('제목을 입력해주세요.');
    if (!content || content === '<p></p>') return setError('내용을 입력해주세요.');
    if (!password) return setError('비밀번호를 입력해주세요.');

    setLoading(true);
    try {
      const finalContent = await replaceBlobsWithUrls(content);
      const { slug } = await createPost({ title, content: finalContent, password });
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
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-xl font-semibold mb-6">링크가 생성되었습니다</h1>
        <div className="flex gap-2 items-center">
          <input
            readOnly
            value={generatedUrl}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 border border-gray-300 rounded text-sm"
          >
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
        <button
          onClick={() => {
            setStep('write');
            setTitle('');
            setContent('');
            setPassword('');
            setGeneratedUrl('');
          }}
          className="mt-6 text-sm text-gray-500 underline"
        >
          새 글 작성
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-xl font-semibold mb-6">새 글 작성</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <Editor onChange={setContent} />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="border border-gray-900 rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </form>
    </main>
  );
}
