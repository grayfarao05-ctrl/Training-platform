import { 
  db, 
  storage, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  handleFirestoreError,
  OperationType
} from './firebase';
import { ObjectivePdf, CourseId } from './types';

export const OBJECTIVE_PDFS_COLLECTION = 'objective_pdfs';

/**
 * Generates a unique, course-isolated Firestore document ID for an objective's PDF metadata.
 * E.g. "a-plus_1.1" or "network-plus_1.1".
 */
export function getObjectivePdfDocId(course: CourseId | string = 'a-plus', objectiveId: string): string {
  const cleanCourse = (course || 'a-plus').trim();
  const cleanObjId = (objectiveId || '').trim();
  return `${cleanCourse}_${cleanObjId}`;
}

/**
 * Helper to retrieve a PDF from the pdfMap using course isolation,
 * with graceful fallback for legacy CompTIA A+ records.
 */
export function getPdfForObjective(
  pdfMap: Record<string, ObjectivePdf>,
  course: CourseId | string = 'a-plus',
  objectiveId: string
): ObjectivePdf | null {
  if (!objectiveId) return null;
  const compositeKey = getObjectivePdfDocId(course, objectiveId);
  if (pdfMap[compositeKey]) {
    return pdfMap[compositeKey];
  }
  // Fallback for legacy A+ uploads saved under just objectiveId
  if (course === 'a-plus' && pdfMap[objectiveId]) {
    const legacy = pdfMap[objectiveId];
    if (!legacy.course || legacy.course === 'a-plus') {
      return legacy;
    }
  }
  return null;
}

/**
 * Sanitizes an objective ID for safe storage path creation (e.g. "1.1" -> "1_1").
 */
export function sanitizeObjectiveId(objectiveId: string): string {
  return objectiveId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function generateRandomToken(length = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      token += chars[bytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return token;
}

/**
 * Uploads a PDF to Firebase Storage and writes/updates the course-isolated objective_pdfs document.
 * If oldStoragePath is provided, deletes the old Storage file after uploading the new one.
 */
export async function uploadObjectivePdf(
  file: File,
  objectiveId: string,
  course: CourseId,
  adminUid: string,
  onProgress?: (percent: number) => void,
  oldStoragePath?: string
): Promise<ObjectivePdf> {
  // Validate file type
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    throw new Error('Only PDF files are allowed.');
  }

  // Validate 30 MB limit
  if (file.size > 30 * 1024 * 1024) {
    throw new Error('File size exceeds the 30 MB limit.');
  }

  const cleanObjId = sanitizeObjectiveId(objectiveId);
  const token = generateRandomToken(32);
  const storagePath = `course_content/${adminUid}/${course}_${cleanObjId}_${token}.pdf`;
  const storageRef = ref(storage, storagePath);

  // Upload to Storage
  const downloadURL = await new Promise<string>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: 'application/pdf'
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error('Storage upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });

  const docId = getObjectivePdfDocId(course, objectiveId);

  // Write to Firestore objective_pdfs/{course}_{objectiveId}
  const pdfData: ObjectivePdf = {
    id: docId,
    course,
    objectiveId,
    storagePath,
    downloadURL,
    fileName: file.name,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedBy: adminUid
  };

  try {
    const docRef = doc(db, OBJECTIVE_PDFS_COLLECTION, docId);
    await setDoc(docRef, pdfData);

    // If uploading for A+ and an old un-prefixed legacy document existed (e.g. "1.1"), remove it to prevent duplicates
    if (course === 'a-plus' && docId !== objectiveId) {
      try {
        const legacyRef = doc(db, OBJECTIVE_PDFS_COLLECTION, objectiveId);
        const legacySnap = await getDoc(legacyRef);
        if (legacySnap.exists()) {
          await deleteDoc(legacyRef);
        }
      } catch (cleanErr) {
        console.warn('Could not clean up legacy un-prefixed PDF document:', cleanErr);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${OBJECTIVE_PDFS_COLLECTION}/${docId}`);
    throw error;
  }

  // If replacing an old file, delete the previous storage file
  if (oldStoragePath && oldStoragePath !== storagePath) {
    try {
      const oldRef = ref(storage, oldStoragePath);
      await deleteObject(oldRef);
    } catch (e: any) {
      // Ignore if file doesn't exist
      if (e?.code !== 'storage/object-not-found') {
        console.warn('Could not delete old storage file:', oldStoragePath, e);
      }
    }
  }

  return pdfData;
}

/**
 * Removes an objective PDF from Storage and deletes the course-isolated objective_pdfs document.
 */
export async function removeObjectivePdf(
  objectiveId: string, 
  course: CourseId | string = 'a-plus',
  storagePath?: string
): Promise<void> {
  // Delete storage file if provided
  if (storagePath) {
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch (e: any) {
      if (e?.code !== 'storage/object-not-found') {
        console.warn('Could not delete storage file:', storagePath, e);
      }
    }
  }

  const docId = getObjectivePdfDocId(course, objectiveId);

  // Delete primary Firestore document
  try {
    const docRef = doc(db, OBJECTIVE_PDFS_COLLECTION, docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${OBJECTIVE_PDFS_COLLECTION}/${docId}`);
    throw error;
  }

  // Also clean up legacy document if course is a-plus
  if (course === 'a-plus') {
    try {
      const legacyRef = doc(db, OBJECTIVE_PDFS_COLLECTION, objectiveId);
      await deleteDoc(legacyRef);
    } catch {
      // Ignore if legacy document did not exist
    }
  }
}

/**
 * Subscribes to a single objective's PDF metadata with course isolation.
 */
export function subscribeObjectivePdf(
  objectiveId: string,
  course: CourseId | string = 'a-plus',
  callback: (pdf: ObjectivePdf | null) => void
) {
  const docId = getObjectivePdfDocId(course, objectiveId);
  const docRef = doc(db, OBJECTIVE_PDFS_COLLECTION, docId);
  
  let legacyUnsubscribe: (() => void) | null = null;

  const unsub = onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      if (legacyUnsubscribe) {
        legacyUnsubscribe();
        legacyUnsubscribe = null;
      }
      callback({ ...snap.data(), id: snap.id } as ObjectivePdf);
    } else if (course === 'a-plus') {
      // Fallback check for legacy documents uploaded under just objectiveId
      if (!legacyUnsubscribe) {
        const legacyDocRef = doc(db, OBJECTIVE_PDFS_COLLECTION, objectiveId);
        legacyUnsubscribe = onSnapshot(legacyDocRef, (legacySnap) => {
          if (legacySnap.exists()) {
            const data = legacySnap.data() as ObjectivePdf;
            if (!data.course || data.course === 'a-plus') {
              callback({ ...data, id: legacySnap.id, course: 'a-plus' } as ObjectivePdf);
              return;
            }
          }
          callback(null);
        }, () => {
          callback(null);
        });
      }
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `${OBJECTIVE_PDFS_COLLECTION}/${docId}`);
  });

  return () => {
    unsub();
    if (legacyUnsubscribe) {
      legacyUnsubscribe();
    }
  };
}

/**
 * Subscribes to all objective PDFs (for mapping badges in the Content list).
 * Populates map with both course-prefixed keys (e.g. "a-plus_1.1") and raw doc IDs.
 */
export function subscribeAllObjectivePdfs(
  callback: (pdfs: Record<string, ObjectivePdf>) => void
) {
  const colRef = collection(db, OBJECTIVE_PDFS_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    const map: Record<string, ObjectivePdf> = {};
    snapshot.docs.forEach(d => {
      const data = d.data() as ObjectivePdf;
      const course = data.course || (d.id.includes('_') ? d.id.split('_')[0] : 'a-plus');
      const objId = data.objectiveId || (d.id.includes('_') ? d.id.slice(course.length + 1) : d.id);
      
      const pdfItem: ObjectivePdf = { 
        ...data, 
        id: d.id, 
        course: course as CourseId, 
        objectiveId: objId 
      };

      // 1. Index by course-isolated composite key (e.g. "a-plus_1.1", "network-plus_1.1")
      const compositeKey = `${course}_${objId}`;
      map[compositeKey] = pdfItem;

      // 2. Also keep raw doc id (e.g. "a-plus_1.1" or legacy "1.1")
      map[d.id] = pdfItem;
    });
    callback(map);
  }, (error) => {
    console.warn('Could not load objective PDFs metadata:', error);
  });
}
