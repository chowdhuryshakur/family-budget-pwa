"use client";

const DB_NAME = "FamilyBudgetPWA_DB";
const DB_VERSION = 1;
const STORE_NAME = "pending_expenses";

/**
 * Initializes IndexedDB object store
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not supported"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "offlineId" });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Saves a new expense offline into IndexedDB when internet is disconnected
 */
export async function saveOfflineExpense(expenseData) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const offlineItem = {
      ...expenseData,
      offlineId: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    await new Promise((resolve, reject) => {
      const req = store.put(offlineItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return offlineItem;
  } catch (err) {
    console.error("Failed to save expense offline:", err);
    throw err;
  }
}

/**
 * Fetches all pending offline expenses
 */
export async function getPendingExpenses() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Failed to read pending offline expenses:", err);
    return [];
  }
}

/**
 * Removes synced offline items from IndexedDB
 */
export async function clearPendingExpenses() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error("Failed to clear offline store:", err);
  }
}

/**
 * Syncs pending offline expenses with Google Sheets API when internet connection is restored
 */
export async function syncPendingExpenses(onSyncSuccess) {
  if (typeof window === "undefined" || !navigator.onLine) return;

  const pending = await getPendingExpenses();
  if (!pending || pending.length === 0) return;

  console.log(`Syncing ${pending.length} pending offline expense(s) to Google Sheets...`);
  let syncedCount = 0;

  for (const item of pending) {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: item.date,
          category: item.category,
          note: item.note || item.itemName,
          amount: item.amount,
        }),
      });

      if (res.ok) {
        syncedCount++;
      }
    } catch (err) {
      console.error("Failed to sync offline item:", item, err);
    }
  }

  if (syncedCount > 0) {
    await clearPendingExpenses();
    if (onSyncSuccess) {
      onSyncSuccess(syncedCount);
    }
  }
}

/**
 * Sets up online event listener to trigger auto-sync
 */
export function setupOnlineListener(onSyncSuccess) {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    syncPendingExpenses(onSyncSuccess);
  };

  window.addEventListener("online", handleOnline);

  // Run initial check
  if (navigator.onLine) {
    syncPendingExpenses(onSyncSuccess);
  }

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}
