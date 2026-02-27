import './global.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: '님만보삼',
  description: '비밀번호로 보호된 문서를 안전하게 공유하세요.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-brand-600"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <a href="/" className="text-lg font-semibold text-text-primary">
              님만보삼
            </a>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-border">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <p className="text-sm text-text-muted">
              비밀번호로 보호된 문서를 안전하게 공유하세요.
            </p>
          </div>
        </footer>

        {/* Feedback floating button */}
        <a
          href="https://forms.gle/icQCbPWP2wT3HUUD9"
          target="_blank"
          rel="noopener noreferrer"
          title="피드백 보내기"
          className="fixed bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition-colors hover:bg-brand-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </a>
      </body>
    </html>
  );
}
