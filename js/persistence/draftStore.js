const DATABASE_NAME = 'eagleEye';
const STORE_NAME = 'drafts';
const DRAFT_KEY = 'current';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local draft storage.'));
  });
}

async function runTransaction(mode, operation) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not update the local draft.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
  });
}

export function saveDraft(draft) {
  return runTransaction('readwrite', store => store.put(draft, DRAFT_KEY));
}

export function getDraft() {
  return runTransaction('readonly', store => store.get(DRAFT_KEY));
}

export function clearDraft() {
  return runTransaction('readwrite', store => store.delete(DRAFT_KEY));
}
