import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot 
} from "firebase/firestore";

// Safe, fallback configuration placeholder
// If user has set up real environment variables, they will propagate immediately
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyBg9AVmUdCSkLjQ-4xIlv4qVia5DN5Zz2U",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "middleware-staging-499008.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "middleware-staging-499008",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "middleware-staging-499008.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "972058724268",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:972058724268:web:84fa65ba5b122085425c09"
};

// Lazy initialization wrapper to prevent crash on incorrect startup environments
let db: any = null;
let isRealConfig = true;

try {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const dbId = metaEnv.VITE_FIREBASE_DATABASE_ID || "ai-studio-9321e51b-c822-4920-8883-37f9813df320";
  db = getFirestore(app, dbId);
} catch (error) {
  console.warn("Firebase was not initialized with a live production cluster. Falling back to robust offline state engine.", error);
}

export { db, isRealConfig, firebaseConfig };

// Helper to save state cleanly
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  const jsonString = JSON.stringify(errInfo);
  console.error("Firestore Error: ", jsonString);
  throw new Error(jsonString);
}

export async function saveTrackerStateToCloud(userId: string, data: { chapters: any[]; settings: any; todayStr: string }) {
  if (!db) return false;
  const pathStr = `acca_trackers/${userId}`;
  try {
    const userDocRef = doc(db, "acca_trackers", userId);
    await setDoc(userDocRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error: any) {
    console.error("Error storing student progress to Firebase Cloud:", error);
    // Throw standard schema conformant error for diagnosis
    handleFirestoreError(error, OperationType.WRITE, pathStr);
    return false;
  }
}

// Helper to fetch progress state
export async function fetchTrackerStateFromCloud(userId: string) {
  if (!db) return null;
  const pathStr = `acca_trackers/${userId}`;
  try {
    const userDocRef = doc(db, "acca_trackers", userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error: any) {
    console.error("Error downloading student progress from Firebase Cloud:", error);
    // Throw standard schema conformant error for diagnosis
    handleFirestoreError(error, OperationType.GET, pathStr);
  }
  return null;
}
