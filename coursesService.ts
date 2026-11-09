import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { CourseDoc, CourseConfig, Domain, UserStats, CourseProgress } from './types';
import { COMPTIA_DOMAINS } from './constants';
import { A_PLUS_GAMES, MATRIC_TO_MONEY_GAMES, updateCourseConfigsCache } from './courseConfig';


export const BUILT_IN_COURSES: CourseDoc[] = [
  {
    id: 'a-plus',
    name: 'CompTIA A+',
    shortLabel: 'A+',
    description: 'Hardware, operating systems, cloud computing, virtualization, and operational procedures.',
    accentColor: '#dc2626',
    domains: [
      { id: 'c1d1', name: 'Mobile Devices' },
      { id: 'c1d2', name: 'Networking' },
      { id: 'c1d3', name: 'Hardware' },
      { id: 'c1d4', name: 'Virtualization & Cloud' },
      { id: 'c1d5', name: 'Hardware & Network Troubleshooting' },
      { id: 'c2d1', name: 'Operating Systems' },
      { id: 'c2d2', name: 'Security' },
      { id: 'c2d3', name: 'Software Troubleshooting' },
      { id: 'c2d4', name: 'Operational Procedures' }
    ],
    requiresCode: false,
    status: 'published',
    order: 1,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    createdBy: 'system'
  },
  {
    id: 'network-plus',
    name: 'CompTIA Network+',
    shortLabel: 'N+',
    description: 'Networking concepts, infrastructure, network operations, security, and network troubleshooting.',
    accentColor: '#2563eb',
    domains: [
      { id: 'np-d1', name: 'Networking Concepts' },
      { id: 'np-d2', name: 'Network Implementation' },
      { id: 'np-d3', name: 'Network Operations' },
      { id: 'np-d4', name: 'Network Security' },
      { id: 'np-d5', name: 'Network Troubleshooting' }
    ],
    requiresCode: true,
    status: 'published',
    order: 2,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    createdBy: 'system'
  },
  {
    id: 'matric-to-money',
    name: 'Matric to Money',
    shortLabel: 'Matric to Money',
    description: 'Free career acceleration and workplace skills course for matriculants and job seekers.',
    accentColor: '#10b981',
    domains: [
      { id: 'm2m-d1', name: 'Module 1: Professional CVs & Applications' },
      { id: 'm2m-d2', name: 'Module 2: Interview Mastery & Etiquette' },
      { id: 'm2m-d3', name: 'Module 3: Workplace Communications' },
      { id: 'm2m-d4', name: 'Module 4: Financial Foundations' }
    ],
    requiresCode: false,
    status: 'published',
    order: 3,
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    createdBy: 'system'
  }
,
  {
    id: 'practical-ai',
    name: 'Beyond the Chatbot: Practical AI for Work & Business',
    shortLabel: 'Practical AI',
    description: 'A hands-on, action-first guide for matriculants, job seekers, and entrepreneurs in South Africa to master practical AI for workplace productivity, structured outputs, and POPIA safety.',
    accentColor: '#7c3aed',
    domains: [
      { id: 'ai-d1', name: 'Module 1: The Engine Mindset & Prompt Frameworks' },
      { id: 'ai-d2', name: 'Module 2: Working with Your Own Documents & Specs' },
      { id: 'ai-d3', name: 'Module 3: Structured Outputs, Tables & WhatsApp Templates' },
      { id: 'ai-d4', name: 'Module 4: Multi-Step Workflows & Client Automation' },
      { id: 'ai-d5', name: 'Module 5: POPIA Compliance & Safety in South Africa' }
    ],
    requiresCode: false,
    status: 'published',
    order: 4,
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  }
];

/**
 * Transforms a CourseDoc into full runtime CourseConfig for rendering.
 */
export function courseDocToConfig(docData: CourseDoc): CourseConfig {
  const domains: Domain[] = docData.domains.map(d => ({
    id: d.id,
    title: d.name,
    name: d.name,
    exam: d.name.includes('Core 2') || ['c2d1', 'c2d2', 'c2d3', 'c2d4'].includes(d.id) ? 'Core 2' : 'Core 1',
    objectives: [],
    course: docData.id,
    objectivesCount: 0
  }));

  const games = docData.id === 'a-plus' 
    ? A_PLUS_GAMES 
    : docData.id === 'matric-to-money'
    ? MATRIC_TO_MONEY_GAMES
    : [];

  return {
    id: docData.id,
    name: docData.name,
    shortLabel: docData.shortLabel,
    badgeLabel: docData.shortLabel,
    accentColor: docData.id === 'a-plus' ? 'red-600' : docData.id === 'network-plus' ? 'blue-600' : docData.id === 'matric-to-money' ? 'emerald-600' : 'indigo-600',
    accentHex: docData.accentColor || '#6366f1',

    bgGlow: `${docData.accentColor || '#6366f1'}33`,
    textColor: 'text-[var(--text-main)]',
    description: docData.description,
    tagline: docData.name,
    domains,
    games
  };
}

// Initialize cache with built-in courses immediately
try {
  updateCourseConfigsCache(BUILT_IN_COURSES.map(courseDocToConfig));
} catch (e) {
  // ignore
}

/**
 * Subscribes to the Firestore courses collection with fallback to built-in courses.
 */
export function subscribeCourses(
  onUpdate: (courses: CourseDoc[]) => void,
  onError?: (err: any) => void
) {
  try {
    const q = query(collection(db, 'courses'), orderBy('order', 'asc'));
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        updateCourseConfigsCache(BUILT_IN_COURSES.map(courseDocToConfig));
        onUpdate(BUILT_IN_COURSES);
      } else {
        const loaded = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as CourseDoc));
        const loadedIds = new Set(loaded.map(c => c.id));
        const finalCourses = [...loaded];
        BUILT_IN_COURSES.forEach(b => {
          if (!loadedIds.has(b.id)) {
            finalCourses.push(b);
          }
        });
        updateCourseConfigsCache(finalCourses.map(courseDocToConfig));
        onUpdate(finalCourses);
      }
    }, (error) => {
      console.warn('Could not load Firestore courses, using built-in fallback:', error);
      updateCourseConfigsCache(BUILT_IN_COURSES.map(courseDocToConfig));
      onUpdate(BUILT_IN_COURSES);
      if (onError) onError(error);
    });
  } catch (err) {
    console.warn('Error setting up courses subscription, using fallback:', err);
    onUpdate(BUILT_IN_COURSES);
    return () => {};
  }
}

/**
 * Creates built-in courses A+ and N+ in Firestore only if they don't already exist.
 * Never overwrites existing documents.
 */
export async function setupBuiltInCourses(adminUid?: string): Promise<{ created: string[]; skipped: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];
  const uid = adminUid || auth.currentUser?.uid || 'system';

  for (const course of BUILT_IN_COURSES) {
    try {
      const courseRef = doc(db, 'courses', course.id);
      const snap = await getDoc(courseRef);
      if (snap.exists()) {
        skipped.push(course.id);
      } else {
        const payload: CourseDoc = {
          ...course,
          createdBy: uid,
          createdAt: new Date().toISOString()
        };
        await setDoc(courseRef, payload);
        created.push(course.id);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `courses/${course.id}`);
    }
  }

  return { created, skipped };
}

/**
 * Check if a course is unlocked for a student.
 * Open if: course == 'a-plus' (legacy exception), OR requiresCode == false, OR in user's unlockedCourses.
 * Admins always have all courses unlocked.
 */
export function isCourseAccessible(
  stats: UserStats | null | undefined,
  courseId: string,
  courseDoc?: CourseDoc | null
): boolean {
  if (courseId === 'a-plus') return true;
  if (!stats) return false;
  if (stats.role === 'admin' || (stats as any).isAdmin) return true;
  
  if (courseDoc && courseDoc.requiresCode === false) {
    return true;
  }

  const unlocked = stats.unlockedCourses ?? ['a-plus'];
  return unlocked.includes(courseId);
}
