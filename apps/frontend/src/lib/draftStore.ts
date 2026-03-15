import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'private-board-draft-db';
const STORE = 'drafts';
const DB_VERSION = 1;

export interface DraftData {
  id: 'current';
  title: string;
  content: string; // HTML — img src는 idb://img-xxx 형태
  expiresIn: string;
  savedAt: string;
  images: Record<string, Blob>; // { 'img-abc': Blob, ... }
}

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: 'id' });
    },
  });
}

export async function saveDraft(
  draft: Omit<DraftData, 'id'>
): Promise<void> {
  const db = await getDB();
  await db.put(STORE, { id: 'current', ...draft });
}

export async function loadDraft(): Promise<DraftData | null> {
  const db = await getDB();
  const record = await db.get(STORE, 'current');
  return record ?? null;
}

export async function clearDraft(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, 'current');
}
