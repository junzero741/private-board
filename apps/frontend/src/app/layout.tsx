import './global.css';

export const metadata = {
  title: 'private-board',
  description: '비밀번호로 보호된 문서를 안전하게 공유하세요.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
