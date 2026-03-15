import { Router, Request, Response, NextFunction } from 'express';
import {
  ROUTE_PATTERNS,
  FEATURE_FLAGS,
  MAX_EXPIRES_HOURS,
  CreatePostRequest,
  CreatePostResponse,
  GetPostMetadataResponse,
  UnlockPostRequest,
  UnlockPostResponse,
} from '@private-board/shared';
import { AppError } from '../lib/errors';
import { createPost, getPostMetadata, unlockPost } from './posts.service';

const router = Router();

router.post(ROUTE_PATTERNS.posts.create, async (
  req: Request<Record<string, never>, CreatePostResponse, CreatePostRequest>,
  res: Response<CreatePostResponse | { error: string }>,
  next: NextFunction
) => {
  try {
    const { title, content, password, expiresIn } = req.body;

    if (!title || !content || !password) {
      throw new AppError(400, 'title, content, password are required', 'VALIDATION_ERROR');
    }

    let finalExpiresIn = expiresIn;
    if (!FEATURE_FLAGS.allowUnlimitedExpiry) {
      finalExpiresIn = (finalExpiresIn != null && finalExpiresIn > 0)
        ? Math.min(finalExpiresIn, MAX_EXPIRES_HOURS)
        : MAX_EXPIRES_HOURS;
    }

    const result = await createPost(title, content, password, finalExpiresIn);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.get(ROUTE_PATTERNS.posts.metadata, async (
  req: Request<{ slug: string }>,
  res: Response<GetPostMetadataResponse | { error: string }>,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const meta = await getPostMetadata(slug);
    if (!meta) {
      throw new AppError(404, 'Post not found', 'NOT_FOUND');
    }
    res.json({
      title: meta.title,
      expiresAt: meta.expiresAt ? meta.expiresAt.toISOString() : null,
      isExpired: meta.isExpired,
    });
  } catch (err) {
    next(err);
  }
});

router.post(ROUTE_PATTERNS.posts.unlock, async (
  req: Request<{ slug: string }, UnlockPostResponse, UnlockPostRequest>,
  res: Response<UnlockPostResponse | { error: string }>,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const { password } = req.body;

    if (!password) {
      throw new AppError(400, 'password is required', 'VALIDATION_ERROR');
    }

    const post = await unlockPost(slug, password);
    if (!post) {
      throw new AppError(404, 'Post not found', 'NOT_FOUND');
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
});

export default router;
