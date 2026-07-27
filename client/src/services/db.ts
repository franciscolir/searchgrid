const DB_NAME = 'searchgrid-db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('sectors'))
        db.createObjectStore('sectors', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('pending_ops')) {
        const store = db.createObjectStore('pending_ops', { keyPath: 'id', autoIncrement: true })
        store.createIndex('mission_device', ['mission_id', 'device_id'], { unique: false })
      }
      if (!db.objectStoreNames.contains('local_mission'))
        db.createObjectStore('local_mission', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('device_info'))
        db.createObjectStore('device_info', { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withDB<T>(mode: IDBTransactionMode, fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  const db = await openDB()
  try { return await fn(db) } finally { db.close() }
}

export async function dbPut(store: string, val: any): Promise<void> {
  await withDB('readwrite', db => new Promise<void>((res, rej) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(val)
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error)
  }))
}

export async function dbGet(store: string, key: string): Promise<any> {
  return withDB('readonly', db => new Promise((res, rej) => {
    const req = db.transaction(store).objectStore(store).get(key)
    req.onsuccess = () => res(req.result)
    req.onerror = () => rej(req.error)
  }))
}

export async function dbGetAll(store: string, idx?: { name: string; range: IDBKeyRange }): Promise<any[]> {
  return withDB('readonly', db => new Promise((res, rej) => {
    let src: IDBObjectStore | IDBIndex = db.transaction(store).objectStore(store)
    if (idx) src = src.index(idx.name)
    const req = idx ? src.getAll(idx.range) : src.getAll()
    req.onsuccess = () => res(req.result || [])
    req.onerror = () => rej(req.error)
  }))
}

export async function dbDelete(store: string, key: string | number): Promise<void> {
  await withDB('readwrite', db => new Promise<void>((res, rej) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(key)
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error)
  }))
}

export async function dbDeleteByIndex(store: string, idx: string, range: IDBKeyRange): Promise<void> {
  await withDB('readwrite', db => new Promise<void>((res, rej) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).index(idx).openCursor(range)
    req.onsuccess = () => { const c = req.result; if (c) { c.delete(); c.continue() } else res() }
    req.onerror = () => rej(req.error)
  }))
}

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export function getDeviceId(): string {
  let id = localStorage.getItem('searchgrid-device-id')
  if (!id) { id = uuidv4(); localStorage.setItem('searchgrid-device-id', id) }
  return id
}