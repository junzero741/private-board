import 'dotenv/config';
import * as path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { AppError } from './lib/errors';
import postsRouter from './posts/posts.router';
import uploadsRouter from './uploads/uploads.router';

const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

const app = express();
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
app.use(express.json());

// 글로벌 rate limit: IP당 분당 100회
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// unlock 전용 rate limit: IP당 분당 10회 (brute-force 방어)
const unlockLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/posts/:slug/unlock', unlockLimiter);

// 정적 파일 서빙 (라우터보다 먼저 등록 — 파일 없으면 next()로 통과)
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

app.use('/posts', postsRouter);
app.use('/uploads', uploadsRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
