const DB_NAME = 'itta-draft-db';
const DB_VERSION = 1;
const STORE_NAME = 'draft-photos';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface DraftPhotoEntry {
  draftKey: string;
  photos: Array<{ blockId: string; originalUrl: string; file: File }>;
  savedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'draftKey' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDraftPhotos(
  draftKey: string,
  photos: Array<{ blockId: string; originalUrl: string; file: File }>,
): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ draftKey, photos, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // QuotaExceededError 등 — 사진 저장 실패는 무시 (텍스트 draft는 이미 저장됨)
  }
}

export async function loadDraftPhotos(
  draftKey: string,
): Promise<DraftPhotoEntry['photos'] | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(draftKey);
      req.onsuccess = () =>
        resolve((req.result as DraftPhotoEntry)?.photos ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearDraftPhotos(draftKey: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(draftKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

// 에디터 진입 시 TTL 초과 항목 자동 삭제
export async function cleanupStaleDraftPhotos(): Promise<void> {
  try {
    const db = await openDB();
    const entries = await new Promise<DraftPhotoEntry[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result as DraftPhotoEntry[]);
      req.onerror = () => reject(req.error);
    });

    const staleKeys = entries
      .filter((e) => Date.now() - e.savedAt > TTL_MS)
      .map((e) => e.draftKey);

    if (staleKeys.length === 0) return;

    const db2 = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db2.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      staleKeys.forEach((k) => store.delete(k));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

// File을 base64 data URL로 변환
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
