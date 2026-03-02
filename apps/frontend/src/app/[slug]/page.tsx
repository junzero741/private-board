import type { Metadata } from 'next';
import PostUnlock from './post-unlock';

export function generateMetadata(): Metadata {
  return {
    title: '비밀 문서 - 님보',
    description: '비밀번호로 보호된 문서입니다.',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: '비밀 문서 - 님보',
      description: '비밀번호로 보호된 문서입니다.',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '님보' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: '비밀 문서 - 님보',
      description: '비밀번호로 보호된 문서입니다.',
      images: ['/og-image.png'],
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PostUnlock slug={slug} />;
}
