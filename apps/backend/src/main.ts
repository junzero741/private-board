import 'dotenv/config';
import * as path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import postsRouter from './posts/posts.router';
import uploadsRouter from './uploads/uploads.router';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

const app = express();

app.use(cors());
app.use(express.json());

// 정적 파일 서빙 (라우터보다 먼저 등록 — 파일 없으면 next()로 통과)
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

app.use('/posts', postsRouter);
app.use('/uploads', uploadsRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
