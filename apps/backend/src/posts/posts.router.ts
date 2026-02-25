import { Router, Request, Response } from 'express';
import { createPost, unlockPost } from './posts.service';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { title, content, password } = req.body;

  if (!title || !content || !password) {
    res.status(400).json({ error: 'title, content, password are required' });
    return;
  }

  const result = await createPost(title, content, password);
  res.status(201).json(result);
});

router.post('/:slug/unlock', async (req: Request, res: Response) => {
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
    if (err instanceof Error && err.message === 'WRONG_PASSWORD') {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }
    throw err;
  }
});

export default router;
