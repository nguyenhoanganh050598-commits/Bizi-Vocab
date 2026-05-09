import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Word, Level, UserProgress, UserProfile } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const d = await getDoc(doc(db, path));
    return d.exists() ? d.data() as UserProfile : null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile) {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, path), profile, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
}

export async function getUserProgress(uid: string): Promise<UserProgress[]> {
  const path = `users/${uid}/progress`;
  try {
    const q = query(collection(db, path));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as UserProgress);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, path);
    return [];
  }
}

export async function updateWordProgress(uid: string, progress: UserProgress) {
  const path = `users/${uid}/progress/${progress.wordId}`;
  try {
    await setDoc(doc(db, path), progress, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
}

export async function getWordsByLevel(level: Level): Promise<Word[]> {
  const path = 'words';
  try {
    const q = query(collection(db, path), where('level', '==', level));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Word));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, path);
    return [];
  }
}

export async function getWordsByIds(ids: string[]): Promise<Word[]> {
  const path = 'words';
  try {
    const words: Word[] = [];
    const collectionRef = collection(db, path);
    
    // Firestore doesn't support 'in' with more than 30 elements, but for now we'll assume a reasonable amount or fetch normally
    // For a real app we might need to batch this.
    if (ids.length === 0) return [];
    
    const snapshots = await getDocs(query(collectionRef));
    return snapshots.docs
      .filter(d => ids.includes(d.id))
      .map(d => ({ id: d.id, ...d.data() } as Word));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, path);
    return [];
  }
}

export async function saveWordsBatch(words: Word[]) {
  const path = 'words';
  try {
    for (const word of words) {
       // Check if word exists first or just add
       await addDoc(collection(db, path), word);
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
}
