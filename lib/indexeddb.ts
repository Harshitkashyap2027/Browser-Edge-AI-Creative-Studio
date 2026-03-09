import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ModelCacheDB extends DBSchema {
  models: {
    key: string;
    value: {
      name: string;
      data: ArrayBuffer;
      timestamp: number;
    };
  };
}

let db: IDBPDatabase<ModelCacheDB> | null = null;

async function getDB(): Promise<IDBPDatabase<ModelCacheDB>> {
  if (!db) {
    db = await openDB<ModelCacheDB>('ai-studio-models', 1, {
      upgrade(database) {
        database.createObjectStore('models', { keyPath: 'name' });
      },
    });
  }
  return db;
}

export async function saveModel(name: string, data: ArrayBuffer): Promise<void> {
  const database = await getDB();
  await database.put('models', { name, data, timestamp: Date.now() });
}

export async function loadModel(name: string): Promise<ArrayBuffer | null> {
  const database = await getDB();
  const entry = await database.get('models', name);
  return entry?.data ?? null;
}

export async function hasModel(name: string): Promise<boolean> {
  const database = await getDB();
  const entry = await database.get('models', name);
  return !!entry;
}

export async function clearModels(): Promise<void> {
  const database = await getDB();
  await database.clear('models');
}
