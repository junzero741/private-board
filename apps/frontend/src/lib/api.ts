import {
  API_ROUTES,
  CreatePostRequest,
  CreatePostResponse,
  GetPostMetadataResponse,
  UnlockPostRequest,
  UnlockPostResponse,
  ReportReason,
} from '@private-board/shared';

export type { CreatePostRequest, CreatePostResponse, GetPostMetadataResponse, UnlockPostRequest, UnlockPostResponse, ReportReason };

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

export async function getPostMetadata(slug: string): Promise<GetPostMetadataResponse | null> {
  const res = await fetch(`${API_BASE}${API_ROUTES.posts.metadata(slug)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
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

export interface AdminReport {
  id: string;
  reason: ReportReason;
  description: string | null;
  reporterIp: string;
  createdAt: string;
  post: { slug: string; title: string; content: string };
}

export async function getAdminReports(secret: string): Promise<AdminReport[]> {
  const res = await fetch(`${API_BASE}${API_ROUTES.admin.reports}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error('오류가 발생했습니다.');
  return res.json();
}

export async function adminDeletePost(secret: string, slug: string): Promise<void> {
  const res = await fetch(`${API_BASE}${API_ROUTES.admin.deletePost(slug)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error('오류가 발생했습니다.');
}

export async function adminDismissReport(secret: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}${API_ROUTES.admin.dismissReport(id)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error('오류가 발생했습니다.');
}

export async function reportPost(slug: string, reason: ReportReason, description?: string): Promise<void> {
  const res = await fetch(`${API_BASE}${API_ROUTES.posts.report(slug)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, description }),
  });

  if (res.status === 409) throw new Error('이미 신고한 게시글입니다.');
  if (res.status === 404) throw new Error('존재하지 않는 게시글입니다.');
  if (res.status === 410) throw new Error('만료된 게시글입니다.');
  if (!res.ok) throw new Error('신고 처리 중 오류가 발생했습니다.');
}
