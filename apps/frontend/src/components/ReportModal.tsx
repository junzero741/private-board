'use client';

import { useState } from 'react';
import { ReportReason } from '@private-board/shared';
import { REPORT_REASON_LABELS } from '@/lib/constants';
import { reportPost } from '@/lib/api';

const REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

export default function ReportModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason>('ILLEGAL_CONTENT');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await reportPost(slug, reason, description.trim() || undefined);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface-card p-6 shadow-lg">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-brand-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-text-primary">신고가 접수되었습니다.</p>
            <p className="text-xs text-text-secondary">검토 후 조치하겠습니다.</p>
            <button onClick={onClose} className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              닫기
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">게시글 신고</h2>
              <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-xs font-medium text-text-secondary">신고 사유</legend>
                {REASONS.map((r) => (
                  <label key={r} className="flex cursor-pointer items-center gap-2.5 text-sm text-text-primary">
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-brand-600"
                    />
                    {REPORT_REASON_LABELS[r]}
                  </label>
                ))}
              </fieldset>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-secondary">상세 설명 (선택)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="추가 설명을 입력해주세요."
                  className="resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-border-focus focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-xs text-error">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? '제출 중...' : '신고하기'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
