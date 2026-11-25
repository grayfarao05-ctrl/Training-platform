import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { 
  getFirestore, initializeFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot, 
  getDocFromServer, Timestamp, addDoc, serverTimestamp, orderBy, deleteDoc, increment, arrayUnion, writeBatch, 
  deleteField, terminate, clearIndexedDbPersistence 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, getBytes } from 'firebase/storage';
import firebaseAppletConfig from './firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseAppletConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseAppletConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseAppletConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseAppletConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseAppletConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID,
};

const databaseId = firebaseAppletConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID;

// Initialize Firebase (HMR-safe)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
const firestoreSettings = {
  experimentalForceLongPolling: true,
};
let dbInstance;
try {
  dbInstance = databaseId
    ? initializeFirestore(app, firestoreSettings, databaseId)
    : initializeFirestore(app, firestoreSettings);
} catch {
  dbInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}
export const db = dbInstance;
export const storage = getStorage(app);
storage.maxOperationRetryTime = 6000; // 6s timeout instead of 120s default to prevent hanging
export const googleProvider = new GoogleAuthProvider();

// In-memory access token cache (strictly in memory, cleared on signout)
let cachedAccessToken: string | null = null;

export const getCachedAccessToken = () => cachedAccessToken;
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Re-export Auth functions
export { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification };

// Clear token on auth state change to logged out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

// Re-export Firestore functions
export { 
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot, 
  getDocFromServer, Timestamp, addDoc, serverTimestamp, orderBy, deleteDoc, increment, arrayUnion,
  writeBatch, deleteField, terminate, clearIndexedDbPersistence
};

// Re-export Storage functions
export { ref, uploadBytesResumable, getDownloadURL, deleteObject, getBytes };

// Clear all per-user storage, preserving only the theme preference
export function clearUserStorage() {
  try {
    cachedAccessToken = null;
    const theme = localStorage.getItem('itreal-theme');
    localStorage.clear();
    if (theme) {
      localStorage.setItem('itreal-theme', theme);
    }
    sessionStorage.clear();
  } catch (e) {
    console.warn('Failed to clear storage:', e);
  }
}

// Auth Helpers
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  cachedAccessToken = null;
  await signOut(auth);
};

// Firestore Error Handler
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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Note: Avoid running an unauthenticated getDocFromServer() on module load,
// as it races with Firestore watch streams during auth transitions (SDK ID: ca9/b815).
