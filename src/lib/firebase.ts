import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Firebase config — personal app, secured via Firestore rules.
// Env vars take precedence; hardcoded values are the production fallback.
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyBg9AVmUdCSkLjQ-4xIlv4qVia5DN5Zz2U",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "middleware-staging-499008.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "middleware-staging-499008",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "middleware-staging-499008.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "972058724268",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:972058724268:web:84fa65ba5b122085425c09",
};

let db: ReturnType<typeof getFirestore> | null = null;

try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const dbId = metaEnv.VITE_FIREBASE_DATABASE_ID || "ai-studio-9321e51b-c822-4920-8883-37f9813df320";
  db = getFirestore(app, dbId);
} catch (error) {
  console.warn("Firebase initialization failed. App will run in offline mode.", error);
}

export { db };

export interface CloudPayload {
  chapters: any[];
  settings: any;
}

/** Save tracker state to Firestore. Returns true on success. */
export async function saveTrackerStateToCloud(
  userId: string,
  data: CloudPayload
): Promise<boolean> {
  if (!db) return false;
  try {
    const ref = doc(db, "acca_trackers", userId);
    await setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.error("Firestore save failed:", error);
    return false;
  }
}

/** Fetch tracker state from Firestore. Returns null if not found or on error. */
export async function fetchTrackerStateFromCloud(userId: string): Promise<CloudPayload | null> {
  if (!db) return null;
  try {
    const ref = doc(db, "acca_trackers", userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as CloudPayload;
    }
  } catch (error) {
    console.error("Firestore fetch failed:", error);
  }
  return null;
}
