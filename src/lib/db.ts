// IndexedDB deck store — tiny promise wrapper, one object store keyed by deck id.
import type { Deck } from './srs'

const DB = 'oriz-quiz'
const STORE = 'decks'
const VERSION = 1

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION)
    req.onupgradeneeded = () => {
      const idb = req.result
      if (!idb.objectStoreNames.contains(STORE)) idb.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (idb) =>
      new Promise<T>((resolve, reject) => {
        const store = idb.transaction(STORE, mode).objectStore(STORE)
        const req = run(store)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      }),
  )
}

export const saveDeck = (deck: Deck): Promise<IDBValidKey> =>
  tx('readwrite', (s) => s.put(deck))

export const getDeck = (id: string): Promise<Deck | undefined> =>
  tx<Deck | undefined>('readonly', (s) => s.get(id) as IDBRequest<Deck | undefined>)

export const allDecks = (): Promise<Deck[]> =>
  tx<Deck[]>('readonly', (s) => s.getAll() as IDBRequest<Deck[]>)

export const deleteDeck = (id: string): Promise<undefined> =>
  tx<undefined>('readwrite', (s) => s.delete(id) as unknown as IDBRequest<undefined>)
