import { Router, Request, Response } from 'express';
import {
  ROUTE_PATTERNS,
  CreatePostRequest,
  CreatePostResponse,
  UnlockPostRequest,
  UnlockPostResponse,
} from '@private-board/shared';
import { createPost, unlockPost } from './posts.service';

const router = Router();

router.post(ROUTE_PATTERNS.posts.create, async (
  req: Request<{}, CreatePostResponse, CreatePostRequest>,
  res: Response<CreatePostResponse | { error: string }>
) => {
  const { title, content, password, expiresIn } = req.body;

  if (!title || !content || !password) {
    res.status(400).json({ error: 'title, content, password are required' });
    return;
  }

  const result = await createPost(title, content, password, expiresIn);
  res.status(201).json(result);
});

router.post(ROUTE_PATTERNS.posts.unlock, async (
  req: Request<{ slug: string }, UnlockPostResponse, UnlockPostRequest>,
  res: Response<UnlockPostResponse | { error: string }>
) => {
  const { slug } = req.params;
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ error: 'password is required' });
    return;
  }

  try {
    const post = await unlockPost(slug, password);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(post);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'EXPIRED') {
      res.status(410).json({ error: 'This post has expired' });
      return;
    }
    if (err instanceof Error && err.message === 'WRONG_PASSWORD') {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }
    throw err;
  }
});

export default router;
