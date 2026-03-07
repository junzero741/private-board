import { Router, Request, Response, NextFunction } from 'express';
import { ROUTE_PATTERNS } from '@private-board/shared';
import { AppError } from '../lib/errors';
import { getReports, deletePost, dismissReport } from './admin.service';

const router = Router();

function requireAdminSecret(req: Request, _res: Response, next: NextFunction) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return next(new AppError(503, 'Admin not configured', 'ADMIN_NOT_CONFIGURED'));
  }
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${secret}`) {
    return next(new AppError(401, 'Unauthorized', 'UNAUTHORIZED'));
  }
  next();
}

router.use(requireAdminSecret);

router.get(ROUTE_PATTERNS.admin.reports, async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reports = await getReports();
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

router.delete(ROUTE_PATTERNS.admin.deletePost, async (
  req: Request<{ slug: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    await deletePost(req.params.slug);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post(ROUTE_PATTERNS.admin.dismissReport, async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    await dismissReport(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
