import './global.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import type { Metadata } from 'next';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://frontend-production-7340.up.railway.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: '님보',
  description: '비밀번호로 보호된 문서를 안전하게 공유하세요.',
  openGraph: {
    title: '님보',
    description: '비밀번호로 보호된 문서를 안전하게 공유하세요.',
    siteName: '님보',
    type: 'website',
    locale: 'ko_KR',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '님보' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '님보',
    description: '비밀번호로 보호된 문서를 안전하게 공유하세요.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={inter.variable}>
      {GTM_ID && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      )}
      <body className="flex min-h-screen flex-col font-sans">
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
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
              님보
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
