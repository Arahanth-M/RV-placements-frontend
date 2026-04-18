/**
 * IndexedDB layer for RV Placements app.
 * Company list: still cache-first for fast list views.
 * Company details: network-first in api.js; IndexedDB is offline / failed-request fallback.
 */

const DB_NAME = "RVPlacementsDB";
// Bump version when adding new stores (e.g., year stats)
const DB_VERSION = 2;
const STORE_LIST = "companiesList";
const STORE_DETAILS = "companyDetails";
const STORE_YEAR_STATS = "yearStats";
const LIST_KEY = "list";

/**
 * Open the app IndexedDB. Creates DB and object stores if they don't exist.
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_LIST)) {
        db.createObjectStore(STORE_LIST, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_DETAILS)) {
        db.createObjectStore(STORE_DETAILS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_YEAR_STATS)) {
        db.createObjectStore(STORE_YEAR_STATS, { keyPath: "year" });
      }
    };
  });
}

/**
 * Get the cached companies list from IndexedDB.
 * @param {number} [maxAgeMs] If provided, return null when cache is older than this many ms (TTL).
 * @returns {Promise<Array|null>} Companies array or null if not cached or expired
 */
export function getCachedCompaniesList(maxAgeMs) {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_LIST, "readonly");
        const store = tx.objectStore(STORE_LIST);
        const req = store.get(LIST_KEY);
        req.onsuccess = () => {
          db.close();
          const record = req.result;
          if (!record || !Array.isArray(record.companies)) {
            resolve(null);
            return;
          }
          if (typeof maxAgeMs === 'number' && record.updatedAt != null) {
            if (Date.now() - record.updatedAt > maxAgeMs) {
              resolve(null); // expired
              return;
            }
          }
          resolve(record.companies);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      })
      .catch(reject);
  });
}

/**
 * Store the companies list in IndexedDB.
 * @param {Array} companies
 * @returns {Promise<void>}
 */
export function setCachedCompaniesList(companies) {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_LIST, "readwrite");
        const store = tx.objectStore(STORE_LIST);
        store.put({ key: LIST_KEY, companies, updatedAt: Date.now() });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
      .catch(reject);
  });
}

/**
 * Get cached company details by id.
 * @param {string} id Company _id
 * @param {number} [maxAgeMs] If provided, return null when cache is older than this many ms (TTL).
 * @returns {Promise<object|null>} Company object or null if not cached or expired
 */
export function getCachedCompanyDetails(id, maxAgeMs) {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_DETAILS, "readonly");
        const store = tx.objectStore(STORE_DETAILS);
        const req = store.get(id);
        req.onsuccess = () => {
          db.close();
          const record = req.result;
          if (!record || !record.data) {
            resolve(null);
            return;
          }
          if (typeof maxAgeMs === 'number' && record.updatedAt != null) {
            if (Date.now() - record.updatedAt > maxAgeMs) {
              resolve(null); // expired
              return;
            }
          }
          resolve(record.data);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      })
      .catch(reject);
  });
}

/**
 * Store company details in IndexedDB.
 * @param {string} id Company _id
 * @param {object} data Company object
 * @returns {Promise<void>}
 */
export function setCachedCompanyDetails(id, data) {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_DETAILS, "readwrite");
        const store = tx.objectStore(STORE_DETAILS);
        store.put({ id, data, updatedAt: Date.now() });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
      .catch(reject);
  });
}

/** @param {string} id Company _id @param {object} data Company payload */
export function saveToIndexedDB(id, data) {
  return setCachedCompanyDetails(id, data);
}

/** Returns cached company data or null (no TTL — for explicit offline reads). */
export function getFromIndexedDB(id) {
  return getCachedCompanyDetails(id, undefined);
}

/**
 * Read company details record for offline fallback (includes updatedAt for staleness).
 * @param {string} id Company _id
 * @returns {Promise<{ data: object, updatedAt: number } | null>}
 */
export function getCompanyDetailsOfflineEntry(id) {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_DETAILS, "readonly");
        const store = tx.objectStore(STORE_DETAILS);
        const req = store.get(id);
        req.onsuccess = () => {
          db.close();
          const record = req.result;
          if (!record || !record.data) {
            resolve(null);
            return;
          }
          resolve({ data: record.data, updatedAt: record.updatedAt });
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      })
      .catch(reject);
  });
}

/**
 * Get cached year stats by year (no TTL; stats are effectively static).
 * @param {number|string} year
 * @returns {Promise<object|null>} Stats object or null if not cached
 */
export function getCachedYearStats(year) {
  const key = String(year);
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_YEAR_STATS, "readonly");
        const store = tx.objectStore(STORE_YEAR_STATS);
        const req = store.get(key);
        req.onsuccess = () => {
          db.close();
          const record = req.result;
          if (!record || record.data == null) {
            resolve(null);
            return;
          }
          resolve(record.data);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      })
      .catch(reject);
  });
}

/**
 * Store year stats in IndexedDB (no TTL).
 * @param {number|string} year
 * @param {object|Array} data
 * @returns {Promise<void>}
 */
export function setCachedYearStats(year, data) {
  const key = String(year);
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_YEAR_STATS, "readwrite");
        const store = tx.objectStore(STORE_YEAR_STATS);
        store.put({ year: key, data });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
      .catch(reject);
  });
}

/**
 * Update helpfulCount for a company in both list and details caches (after upvote).
 * @param {string} companyId
 * @param {number} newHelpfulCount
 */
export function updateCachedHelpfulCount(companyId, newHelpfulCount) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_LIST, STORE_DETAILS], "readwrite");
      const listStore = tx.objectStore(STORE_LIST);
      const detailsStore = tx.objectStore(STORE_DETAILS);

      const listReq = listStore.get(LIST_KEY);
      listReq.onsuccess = () => {
        const listRecord = listReq.result;
        if (listRecord && Array.isArray(listRecord.companies)) {
          const idx = listRecord.companies.findIndex((c) => c._id === companyId);
          if (idx !== -1) {
            listRecord.companies[idx] = { ...listRecord.companies[idx], helpfulCount: newHelpfulCount };
            listRecord.updatedAt = Date.now();
            listStore.put(listRecord);
          }
        }

        const detailsReq = detailsStore.get(companyId);
        detailsReq.onsuccess = () => {
          const detailRecord = detailsReq.result;
          if (detailRecord && detailRecord.data) {
            detailRecord.data.helpfulCount = newHelpfulCount;
            detailRecord.updatedAt = Date.now();
            detailsStore.put(detailRecord);
          }
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
        detailsReq.onerror = () => {
          db.close();
          reject(detailsReq.error);
        };
      };
      listReq.onerror = () => {
        db.close();
        reject(listReq.error);
      };
    });
  });
}

/**
 * Update totalGotIn for a company in both list and details caches.
 * @param {string} companyId
 * @param {number} newTotalGotIn
 */
export function updateCachedCompanyTotalGotIn(companyId, newTotalGotIn) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_LIST, STORE_DETAILS], "readwrite");
      const listStore = tx.objectStore(STORE_LIST);
      const detailsStore = tx.objectStore(STORE_DETAILS);

      const listReq = listStore.get(LIST_KEY);
      listReq.onsuccess = () => {
        const listRecord = listReq.result;
        if (listRecord && Array.isArray(listRecord.companies)) {
          const idx = listRecord.companies.findIndex((c) => c._id === companyId);
          if (idx !== -1) {
            listRecord.companies[idx] = {
              ...listRecord.companies[idx],
              totalGotIn: newTotalGotIn,
            };
            listRecord.updatedAt = Date.now();
            listStore.put(listRecord);
          }
        }

        const detailsReq = detailsStore.get(companyId);
        detailsReq.onsuccess = () => {
          const detailRecord = detailsReq.result;
          if (detailRecord && detailRecord.data) {
            detailRecord.data.totalGotIn = newTotalGotIn;
            detailRecord.updatedAt = Date.now();
            detailsStore.put(detailRecord);
          }
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
        detailsReq.onerror = () => {
          db.close();
          reject(detailsReq.error);
        };
      };
      listReq.onerror = () => {
        db.close();
        reject(listReq.error);
      };
    });
  });
}

/**
 * Invalidate companies list cache (e.g. after a new company is created).
 * @returns {Promise<void>}
 */
export function clearCompaniesListCache() {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_LIST, "readwrite");
        tx.objectStore(STORE_LIST).delete(LIST_KEY);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
      .catch(reject);
  });
}

/**
 * Invalidate a single company's details cache.
 * @param {string} id Company _id
 * @returns {Promise<void>}
 */
export function clearCompanyDetailsCache(id) {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE_DETAILS, "readwrite");
        tx.objectStore(STORE_DETAILS).delete(id);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
      .catch(reject);
  });
}

// Explicit default so default import is always resolved (avoids "default cannot be resolved by star export" in some bundlers)
export default {
  openDB,
  getCachedCompaniesList,
  setCachedCompaniesList,
  getCachedCompanyDetails,
  setCachedCompanyDetails,
  saveToIndexedDB,
  getFromIndexedDB,
  getCompanyDetailsOfflineEntry,
  getCachedYearStats,
  setCachedYearStats,
  updateCachedHelpfulCount,
  updateCachedCompanyTotalGotIn,
  clearCompaniesListCache,
  clearCompanyDetailsCache,
};
