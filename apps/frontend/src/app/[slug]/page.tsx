import type { Metadata } from 'next';
import { getPostMetadata } from '@/lib/api';
import PostUnlock from './post-unlock';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getPostMetadata(slug);
  const title = meta ? `${meta.title} - 님보` : '비밀 문서 - 님보';

  return {
    title,
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
  const meta = await getPostMetadata(slug);
  return <PostUnlock slug={slug} meta={meta} />;
}
