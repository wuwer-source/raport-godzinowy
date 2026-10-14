import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  runTransaction,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { NumberingSettings } from '../types';
import {
  DEFAULT_NUMBERING,
  formatReportNumber,
  getDefaultYear,
  getNumberingSettings as getLocalNumberingSettings,
  saveNumberingSettings as saveLocalNumberingSettings,
  generateNextReportNumber as generateLocalNextReportNumber,
} from './storage';

export const firebaseConfig = {
  apiKey: "AIzaSyBhQ4Nbjg4LABtwfmSGLDeYyIoncqmijic",
  authDomain: "raport-godzinowy-2519a.firebaseapp.com",
  projectId: "raport-godzinowy-2519a",
  storageBucket: "raport-godzinowy-2519a.firebasestorage.app",
  messagingSenderId: "27548331707",
  appId: "1:27548331707:web:ebeb183a473a54488e439e",
  measurementId: "G-FMNZ3Y71LG"
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence if supported in browser environment
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch(() => {
      // Ignore if multiple tabs or unsupported
    });
  } catch {
    // Ignore persistence errors
  }
}

const SETTINGS_COLLECTION = 'settings';
const NUMBERING_DOC = 'numbering';

/**
 * Normalizes numbering settings object
 */
export function normalizeNumbering(data: any): NumberingSettings {
  const curYear = getDefaultYear();
  const rawPrefix = data?.prefix ? String(data.prefix).trim() : 'KG';
  const prefix = rawPrefix === 'RDL' ? 'KG' : rawPrefix || 'KG';
  const year = data?.year ? String(data.year).trim() : curYear;
  const nextSeq = typeof data?.nextSeq === 'number' && data.nextSeq > 0 ? Math.floor(data.nextSeq) : 1;
  return { prefix, year, nextSeq };
}

/**
 * Fetch current global numbering settings from Firestore
 */
export async function getGlobalNumberingSettings(): Promise<{ settings: NumberingSettings; isCloud: boolean }> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, NUMBERING_DOC);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const settings = normalizeNumbering(snap.data());
      saveLocalNumberingSettings(settings);
      return { settings, isCloud: true };
    } else {
      // Initialize default in Firestore
      const initial = { ...DEFAULT_NUMBERING, year: getDefaultYear() };
      await setDoc(docRef, initial, { merge: true });
      saveLocalNumberingSettings(initial);
      return { settings: initial, isCloud: true };
    }
  } catch (err) {
    console.warn('[Firebase] Nie udało się pobrać numeracji z chmury, używam pamięci lokalnej:', err);
    return { settings: getLocalNumberingSettings(), isCloud: false };
  }
}

/**
 * Subscribe in real-time to changes in Firestore numbering
 * Whenever another employee generates a report, other open tabs receive the updated nextSeq immediately
 */
export function subscribeGlobalNumbering(
  onUpdate: (settings: NumberingSettings, isCloud: boolean) => void
): () => void {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, NUMBERING_DOC);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const settings = normalizeNumbering(snap.data());
          saveLocalNumberingSettings(settings);
          onUpdate(settings, true);
        } else {
          // Document does not exist yet, push initial
          const initial = { ...DEFAULT_NUMBERING, year: getDefaultYear() };
          setDoc(docRef, initial, { merge: true }).catch(() => {});
          onUpdate(initial, true);
        }
      },
      (err) => {
        console.warn('[Firebase] Błąd nasłuchiwania w czasie rzeczywistym:', err);
        onUpdate(getLocalNumberingSettings(), false);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[Firebase] Nie można zainicjalizować subskrypcji:', err);
    onUpdate(getLocalNumberingSettings(), false);
    return () => {};
  }
}

/**
 * Atomically generates the next report number.
 * Uses Firestore transactions so that simultaneous clicks by multiple employees
 * are strictly serialized and guaranteed to never produce duplicate numbers!
 */
export async function generateGlobalNextReportNumber(increment = true): Promise<{
  reportNumber: string;
  settings: NumberingSettings;
  isCloud: boolean;
}> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, NUMBERING_DOC);

    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      let current: NumberingSettings;

      if (!snap.exists()) {
        current = { ...DEFAULT_NUMBERING, year: getDefaultYear() };
      } else {
        current = normalizeNumbering(snap.data());
      }

      const allocatedNumber = formatReportNumber(current.prefix, current.year, current.nextSeq);

      let nextSettings: NumberingSettings = { ...current };

      if (increment) {
        nextSettings = {
          ...current,
          nextSeq: current.nextSeq + 1,
        };
        transaction.set(docRef, nextSettings, { merge: true });
      }

      return {
        allocatedNumber,
        settings: nextSettings,
      };
    });

    saveLocalNumberingSettings(result.settings);
    return {
      reportNumber: result.allocatedNumber,
      settings: result.settings,
      isCloud: true,
    };
  } catch (err) {
    console.error('[Firebase] Błąd transakcji Firestore, używam zapasowej numeracji lokalnej:', err);
    const fallbackNumber = generateLocalNextReportNumber(increment);
    const localSettings = getLocalNumberingSettings();
    return {
      reportNumber: fallbackNumber,
      settings: localSettings,
      isCloud: false,
    };
  }
}

/**
 * Save new numbering settings (e.g. from Settings modal) both to Firestore and locally
 */
export async function updateGlobalNumberingSettings(settings: NumberingSettings): Promise<boolean> {
  saveLocalNumberingSettings(settings);
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, NUMBERING_DOC);
    await setDoc(docRef, settings, { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Błąd zapisu ustawień do Firestore:', err);
    return false;
  }
}
