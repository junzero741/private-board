// 프론트엔드용: 실제 요청 URL
export const API_ROUTES = {
  posts: {
    create: '/posts',
    unlock: (slug: string) => `/posts/${slug}/unlock`,
  },
} as const;

// 백엔드용: Express 라우터 패턴
export const ROUTE_PATTERNS = {
  posts: {
    create: '/',
    unlock: '/:slug/unlock',
  },
} as const;

// 게시글 생성
export interface CreatePostRequest {
  title: string;
  content: string;
  password: string;
}

export interface CreatePostResponse {
  slug: string;
}

// 게시글 조회
export interface UnlockPostRequest {
  password: string;
}

export interface UnlockPostResponse {
  title: string;
  content: string;
}
