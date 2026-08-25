import { LogEntry, LogSink } from './types';

const DB_NAME = 'app-flight-recorder';
const DB_VERSION = 1;
const STORE = 'logs';

/**
 * Raw-IndexedDB sink. Every operation swallows its own failures upstream (the logger
 * wraps calls in try/catch): a broken log store must never take the app down with it.
 */
class IndexedDbSink implements LogSink {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    this.dbPromise ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('ts', 'ts');
        }
      };
      req.onsuccess = () => {
        // If another tab upgrades the schema, close so it isn't blocked forever.
        req.result.onversionchange = () => {
          req.result.close();
          this.dbPromise = null;
        };
        resolve(req.result);
      };
      req.onerror = () => {
        this.dbPromise = null;
        reject(req.error ?? new Error('indexedDB.open failed'));
      };
    });
    return this.dbPromise;
  }

  async addBatch(entries: LogEntry[]): Promise<void> {
    if (entries.length === 0) {
      return;
    }
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      for (const entry of entries) {
        store.add(entry);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('addBatch failed'));
      tx.onabort = () => reject(tx.error ?? new Error('addBatch aborted'));
    });
  }

  async getSince(fromTs: number, maxCount: number, maxBytes: number): Promise<LogEntry[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const out: LogEntry[] = [];
      let bytes = 0;
      const tx = db.transaction(STORE, 'readonly');
      const cursorReq = tx
        .objectStore(STORE)
        .index('ts')
        .openCursor(IDBKeyRange.lowerBound(fromTs));
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) {
          resolve(out);
          return;
        }
        const entry = cursor.value as LogEntry;
        bytes += entry.message.length + (entry.data?.length ?? 0) + 64;
        if (out.length >= maxCount || bytes > maxBytes) {
          resolve(out);
          return;
        }
        out.push(entry);
        cursor.continue();
      };
      cursorReq.onerror = () => reject(cursorReq.error ?? new Error('getSince failed'));
    });
  }

  async purge(beforeTs: number, maxRows: number): Promise<void> {
    const db = await this.open();

    // Deletions go through a cursor on the ts index: primary keys are insertion-ordered
    // but not queryable by time, so the index cursor is the correct deletion path.
    const deleteOldest = (limit: number, upperTs: number | null): Promise<void> =>
      new Promise((resolve, reject) => {
        let removed = 0;
        const tx = db.transaction(STORE, 'readwrite');
        const range = upperTs === null ? null : IDBKeyRange.upperBound(upperTs, true);
        const cursorReq = tx.objectStore(STORE).index('ts').openCursor(range);
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (!cursor || removed >= limit) {
            resolve();
            return;
          }
          cursor.delete();
          removed += 1;
          cursor.continue();
        };
        cursorReq.onerror = () => reject(cursorReq.error ?? new Error('purge failed'));
      });

    // TTL pass: everything older than beforeTs goes, however much there is.
    await deleteOldest(Number.MAX_SAFE_INTEGER, beforeTs);

    // Size pass: a runaway log loop can blow the row cap long before the TTL does.
    const count = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('count failed'));
    });
    if (count > maxRows) {
      await deleteOldest(count - maxRows, null);
    }
  }
}

/** Fallback for environments without IndexedDB (some test setups, ancient webviews). */
class NoopSink implements LogSink {
  async addBatch(): Promise<void> {}
  async getSince(): Promise<LogEntry[]> {
    return [];
  }
  async purge(): Promise<void> {}
}

export function createLogSink(): LogSink {
  return typeof indexedDB === 'undefined' ? new NoopSink() : new IndexedDbSink();
}
