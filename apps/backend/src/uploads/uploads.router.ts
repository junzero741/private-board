import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ROUTE_PATTERNS, UploadImageResponse } from '@private-board/shared';
import { AppError } from '../lib/errors';
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
        throw new AppError(400, 'file is required', 'VALIDATION_ERROR');
      }

      const result = await uploadImage(req.file.buffer, req.file.mimetype);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
