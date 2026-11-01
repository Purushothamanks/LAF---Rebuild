/**
 * LAF IndexedDB High-Capacity Storage Vault
 * Provides virtually unlimited, non-blocking asynchronous storage for conversations,
 * code artifacts, and multi-turn message histories without localStorage quota limits.
 */

const DB_NAME = 'LAF_Storage_Cluster';
const DB_VERSION = 1;
const STORE_NAME = 'conversations';

let dbInstance = null;

function getIndexedDB() {
  if (typeof window === 'undefined') return null;
  return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
}

export function openDb() {
  return new Promise((resolve) => {
    const idb = getIndexedDB();
    if (!idb) {
      resolve(null);
      return;
    }

    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    try {
      const request = idb.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('username', 'username', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = (e) => {
        dbInstance = e.target.result;
        resolve(dbInstance);
      };

      request.onerror = (e) => {
        console.warn('[LAF IDB] Failed to open IndexedDB:', e.target.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('[LAF IDB] Open exception:', err);
      resolve(null);
    }
  });
}

export async function idbSaveConversation(username, conv) {
  if (!username || !conv || !conv.id) return;
  try {
    const db = await openDb();
    if (!db) return;

    const u = username.toLowerCase().trim();
    const key = `${u}:${conv.id}`;
    const record = {
      key,
      username: u,
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt || new Date().toISOString(),
      messages: conv.messages || []
    };

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  } catch (err) {
    console.warn('[LAF IDB] Save error:', err);
  }
}

export async function idbGetConversation(username, convId) {
  if (!username || !convId) return null;
  try {
    const db = await openDb();
    if (!db) return null;

    const u = username.toLowerCase().trim();
    const key = `${u}:${convId}`;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = (e) => resolve(e.target.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  } catch (err) {
    return null;
  }
}

export async function idbGetAllConversations(username) {
  if (!username) return [];
  try {
    const db = await openDb();
    if (!db) return [];

    const u = username.toLowerCase().trim();

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('username');
        const req = index.getAll(u);
        req.onsuccess = (e) => {
          const list = e.target.result || [];
          list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
          resolve(list);
        };
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  } catch (err) {
    return [];
  }
}

export async function idbDeleteConversation(username, convId) {
  if (!username || !convId) return;
  try {
    const db = await openDb();
    if (!db) return;

    const u = username.toLowerCase().trim();
    const key = `${u}:${convId}`;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  } catch (err) {
    console.warn('[LAF IDB] Delete error:', err);
  }
}
