import { Router, Request, Response, NextFunction } from 'express';
import { ROUTE_PATTERNS, CreateReportRequest } from '@private-board/shared';
import { AppError } from '../lib/errors';
import { createReport } from './reports.service';

const router = Router();

router.post(ROUTE_PATTERNS.posts.report, async (
  req: Request<{ slug: string }, void, Omit<CreateReportRequest, 'slug'>>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const { reason, description } = req.body;
    const ip = req.ip ?? '0.0.0.0';

    if (!reason) {
      throw new AppError(400, 'reason is required', 'VALIDATION_ERROR');
    }

    await createReport(slug, reason, description, ip);
    res.status(201).end();
  } catch (err) {
    next(err);
  }
});

export default router;
