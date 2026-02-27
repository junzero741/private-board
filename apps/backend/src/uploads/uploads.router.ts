import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ROUTE_PATTERNS, UploadImageResponse } from '@private-board/shared';
import { uploadImage } from './uploads.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const router = Router();

router.post(
  ROUTE_PATTERNS.uploads.image,
  upload.single('file'),
  async (
    req: Request,
    res: Response<UploadImageResponse | { error: string }>,
    next: NextFunction
  ) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'file is required' });
        return;
      }

      const result = await uploadImage(req.file.buffer, req.file.mimetype);
      res.status(201).json(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'INVALID_MIME_TYPE') {
        res
          .status(400)
          .json({ error: 'Only jpeg, png, gif, webp images are allowed' });
        return;
      }
      next(err);
    }
  }
);

export default router;
