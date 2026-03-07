'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReportReason } from '@private-board/shared';
import { REPORT_REASON_LABELS } from '@/lib/constants';
import { AdminReport, getAdminReports, adminDeletePost, adminDismissReport } from '@/lib/api';

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [input, setInput] = useState('');
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async (s: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminReports(s);
      setReports(data);
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        setSecret('');
        sessionStorage.removeItem('adminSecret');
        setError('인증에 실패했습니다.');
      } else {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem('adminSecret');
    if (saved) {
      setSecret(saved);
      fetchReports(saved);
    }
  }, [fetchReports]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    sessionStorage.setItem('adminSecret', input);
    setSecret(input);
    await fetchReports(input);
  }

  function handleLogout() {
    sessionStorage.removeItem('adminSecret');
    setSecret('');
    setReports([]);
    setInput('');
  }

  async function handleDelete(slug: string) {
    if (!confirm(`"${slug}" 게시글을 삭제하시겠습니까?`)) return;
    try {
      await adminDeletePost(secret, slug);
      setReports((prev) => prev.filter((r) => r.post.slug !== slug));
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  }

  async function handleDismiss(id: string) {
    try {
      await adminDismissReport(secret, id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  }

  if (!secret) {
    return (
      <section className="mx-auto max-w-sm px-4 py-16">
        <div className="rounded-xl border border-border bg-surface-card p-8 shadow-md">
          <h1 className="mb-6 text-lg font-semibold text-text-primary">관리자</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="관리자 비밀키"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm shadow-sm focus:border-border-focus focus:outline-none"
            />
            {error && <p className="text-xs text-error">{error}</p>}
            <button
              type="submit"
              disabled={!input}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              로그인
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">신고 관리</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReports(secret)}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            새로고침
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            로그아웃
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-text-secondary">불러오는 중...</p>
      )}

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {!loading && reports.length === 0 && (
        <div className="rounded-xl border border-border bg-surface-card px-6 py-12 text-center">
          <p className="text-sm text-text-secondary">처리 대기 중인 신고가 없습니다.</p>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {reports.map((report) => (
          <li key={report.id} className="rounded-xl border border-border bg-surface-card p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-text-primary">{report.post.title}</p>
                <p className="mt-0.5 text-xs text-text-secondary">/{report.post.slug}</p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-600">
                {REPORT_REASON_LABELS[report.reason]}
              </span>
            </div>

            {report.description && (
              <p className="mb-3 text-sm text-text-secondary">{report.description}</p>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">
                {report.reporterIp} · {new Date(report.createdAt).toLocaleString('ko-KR')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDismiss(report.id)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-surface transition-colors"
                >
                  신고 기각
                </button>
                <button
                  onClick={() => handleDelete(report.post.slug)}
                  className="rounded-lg bg-error px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                >
                  글 삭제
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
