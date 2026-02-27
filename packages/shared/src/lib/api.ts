// 프론트엔드용: 실제 요청 URL
export const API_ROUTES = {
  posts: {
    create: '/posts',
    unlock: (slug: string) => `/posts/${slug}/unlock`,
  },
  uploads: {
    image: '/uploads/image',
  },
} as const;

// 백엔드용: Express 라우터 패턴
export const ROUTE_PATTERNS = {
  posts: {
    create: '/',
    unlock: '/:slug/unlock',
  },
  uploads: {
    image: '/image',
  },
} as const;

// 게시글 생성
export interface CreatePostRequest {
  title: string;
  content: string;
  password: string;
  expiresIn?: number; // 만료 시간 (시간 단위, null이면 무제한)
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

// 이미지 업로드
export interface UploadImageResponse {
  url: string;
}
