import {
  API_ROUTES,
  CreatePostRequest,
  CreatePostResponse,
  UnlockPostRequest,
  UnlockPostResponse,
} from '@private-board/shared';

export type { CreatePostRequest, CreatePostResponse, UnlockPostRequest, UnlockPostResponse };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function createPost(data: CreatePostRequest): Promise<CreatePostResponse> {
  const res = await fetch(`${API_BASE}${API_ROUTES.posts.create}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('게시글 저장에 실패했습니다.');
  return res.json();
}

export async function viewPost(slug: string, data: UnlockPostRequest): Promise<UnlockPostResponse> {
  const res = await fetch(`${API_BASE}${API_ROUTES.posts.unlock(slug)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (res.status === 401) throw new Error('비밀번호가 올바르지 않습니다.');
  if (res.status === 404) throw new Error('존재하지 않는 게시글입니다.');
  if (res.status === 410) throw new Error('만료된 게시글입니다.');
  if (!res.ok) throw new Error('오류가 발생했습니다.');
  return res.json();
}
