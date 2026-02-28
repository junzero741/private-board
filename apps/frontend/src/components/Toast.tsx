'use client';

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/* ─── Types ────────────────────────────────────────────────── */

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastOptions {
  /** Auto-dismiss delay in ms (default: 4 000) */
  duration?: number;
}

interface ToastContextValue {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismiss: (id: number) => void;
}

/* ─── Constants ────────────────────────────────────────────── */

const DEFAULT_DURATION = 4_000;

/* ─── Reducer ──────────────────────────────────────────────── */

type Action =
  | { type: 'ADD'; toast: ToastItem }
  | { type: 'REMOVE'; id: number };

function toastReducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case 'ADD':
      return [...state, action.toast];
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
  }
}

/* ─── Context ──────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

/* ─── Hook ─────────────────────────────────────────────────── */

/**
 * Toast 알림을 표시하는 hook.
 *
 * @example
 * const toast = useToast();
 * toast.success('저장되었습니다');
 * toast.error('문제가 발생했습니다');
 * toast.info('링크가 복사되었습니다', { duration: 2000 });
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within <ToastProvider>');
  }
  return ctx;
}

/* ─── Provider ─────────────────────────────────────────────── */

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  // useCallback → 참조 안정성 보장. Context 소비자의 불필요한 리렌더 방지
  const dismiss = useCallback((id: number) => {
    dispatch({ type: 'REMOVE', id });
  }, []);

  const show = useCallback(
    (variant: ToastVariant, message: string, options?: ToastOptions) => {
      const id = ++nextId;
      const duration = options?.duration ?? DEFAULT_DURATION;
      dispatch({ type: 'ADD', toast: { id, message, variant, duration } });
    },
    [],
  );

  // useMemo → value 객체 참조 안정성 보장
  const value = useMemo<ToastContextValue>(
    () => ({
      success: (msg, opts) => show('success', msg, opts),
      error: (msg, opts) => show('error', msg, opts),
      info: (msg, opts) => show('info', msg, opts),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastPortal toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/* ─── Portal ───────────────────────────────────────────────── */

/**
 * createPortal로 document.body에 직접 렌더링.
 * - 부모 컴포넌트의 overflow: hidden, z-index 스택에서 자유로움
 * - SSR hydration mismatch 방지를 위해 mounted 체크
 */
function ToastPortal({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <ol
      aria-label="알림 목록"
      className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3"
    >
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </ol>,
    document.body,
  );
}

/* ─── Toast Item ───────────────────────────────────────────── */

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'bg-success-bg text-success',
  error: 'bg-error-bg text-error',
  info: 'bg-brand-50 text-brand-800',
};

const VARIANT_ICONS: Record<ToastVariant, string> = {
  success: '\u2713', // ✓
  error: '\u0021',   // !
  info: '\u2139',    // ℹ
};

/**
 * 개별 Toast 메시지.
 *
 * memo: toasts 배열이 바뀌어도 변경되지 않은 기존 항목은 리렌더하지 않음
 *
 * 각 Toast가 자신의 auto-dismiss 타이머를 관리:
 * - Provider에서 setTimeout을 관리하면 cleanup이 어렵고 메모리 누수 가능
 * - 컴포넌트 내부에서 useEffect로 관리하면 unmount 시 자동 정리
 */
const ToastMessage = memo(function ToastMessage({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  // error는 긴급 → role="alert" (assertive), 나머지는 role="status" (polite)
  const role = toast.variant === 'error' ? 'alert' : 'status';

  return (
    <li
      role={role}
      className={`
        flex items-center gap-2.5 rounded-lg border border-border
        px-4 py-3 text-sm font-medium shadow-md
        animate-toast-in
        ${VARIANT_STYLES[toast.variant]}
      `}
    >
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/60 text-xs font-bold leading-none"
      >
        {VARIANT_ICONS[toast.variant]}
      </span>

      <span className="flex-1">{toast.message}</span>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="ml-2 shrink-0 opacity-40 transition-opacity hover:opacity-100"
        aria-label="알림 닫기"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <line x1="18" x2="6" y1="6" y2="18" />
          <line x1="6" x2="18" y1="6" y2="18" />
        </svg>
      </button>
    </li>
  );
});
