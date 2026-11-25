import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  handleFirestoreError,
  OperationType
} from './firebase';

export interface ReviewItem {
  id: string;
  name: string;
  school: string;
  course: string;
  quote: string;
  rating: number; // 1-5
  avatar?: string;
  createdAt?: string;
}

export interface TopStudentReportCard {
  examReadiness: number;
  domainScores: { domain: string; score: number }[];
  testsCompleted: number;
  avgScore: number;
  topStrengths?: string[];
}

export interface TopStudentItem {
  id: string;
  firstName: string;
  surnameInitial: string; // e.g. "M."
  lastName?: string;
  schoolOrArea: string;
  location?: string;
  track: string; // 'CompTIA A+' | 'CompTIA Network+' | 'Matric to Money'
  score: number; // Readiness / score %
  examReadiness?: number;
  mocksPassed?: number;
  streakDays?: number;
  tags: string[];
  rank: number; // 1-5
  consentGiven: boolean;
  cvUrl?: string; // storage URL or local sample
  reportCardData?: TopStudentReportCard;
  createdAt?: string;
}

export interface InterviewInvite {
  id?: string;
  studentId: string;
  studentName: string;
  companyName: string;
  contactPerson: string;
  emailOrPhone: string;
  role: string;
  message: string;
  createdAt?: string;
  status?: 'pending' | 'contacted' | 'archived';
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  message: string;
  createdAt?: string;
  status?: 'unread' | 'read' | 'replied';
}

export interface LandingSettings {
  storySubtitle: string;
  storyLead: string;
  storyParagraph1: string;
  storyParagraph2: string;
  storyImage: string;
  stats: {
    studentsTrained: number;
    courses: number;
    years: number;
  };
}

// -------------------------------------------------------------
// Default Fallback Data (Warm, authentic Western Cape context)
// -------------------------------------------------------------

export const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Thabo M.',
    school: 'Atlantis Secondary School',
    course: 'CompTIA A+',
    quote: 'The 3D motherboard models changed everything. In school we only memorized diagrams, but here I actually learned how components talk to each other.',
    rating: 5
  },
  {
    id: 'rev-2',
    name: 'Anele K.',
    school: 'Malmesbury High',
    course: 'CompTIA Network+',
    quote: 'Subnet Speed-Run made IPv4 CIDR notation click in 3 days. I went from failing mock subnet questions to completing /27 calculations in under 20 seconds.',
    rating: 5
  },
  {
    id: 'rev-3',
    name: 'Keanu D.',
    school: 'Moorreesburg',
    course: 'Matric to Money',
    quote: 'The Contract Red Flags minigame saved me from a scam R1,500/month "learnership". Two months later, I used the ITreal CV template to land a verified ISP tech role.',
    rating: 5
  },
  {
    id: 'rev-4',
    name: 'Zukiswa S.',
    school: 'Vredenburg High',
    course: 'CompTIA A+',
    quote: 'Being able to practice terminal commands and test diagnostics directly in the browser without needing a R15,000 gaming rig is why ITreal is so powerful.',
    rating: 5
  }
];

export const DEFAULT_TOP_STUDENTS: TopStudentItem[] = [
  {
    id: 'student-1',
    firstName: 'Thando',
    surnameInitial: 'M.',
    schoolOrArea: 'Moorreesburg / Swartland',
    track: 'CompTIA A+',
    score: 94,
    tags: ['Hardware Diagnostics', 'Linux CLI', 'Troubleshooting'],
    rank: 1,
    consentGiven: true,
    cvUrl: '/assets/sample-student-cv.pdf',
    reportCardData: {
      examReadiness: 94,
      testsCompleted: 38,
      avgScore: 92,
      domainScores: [
        { domain: 'Mobile Devices', score: 96 },
        { domain: 'Networking', score: 91 },
        { domain: 'Hardware', score: 98 },
        { domain: 'Virtualization & Cloud', score: 90 },
        { domain: 'Hardware & Network Troubleshooting', score: 95 }
      ],
      topStrengths: ['Hardware component isolation', 'BIOS/UEFI configuration', 'RJ-45 termination']
    }
  },
  {
    id: 'student-2',
    firstName: 'Caitlin',
    surnameInitial: 'V.',
    schoolOrArea: 'Malmesbury',
    track: 'CompTIA Network+',
    score: 91,
    tags: ['IPv4/IPv6 Subnetting', 'VLAN Segmentation', 'Wireshark'],
    rank: 2,
    consentGiven: true,
    cvUrl: '/assets/sample-student-cv.pdf',
    reportCardData: {
      examReadiness: 91,
      testsCompleted: 34,
      avgScore: 89,
      domainScores: [
        { domain: 'Networking Fundamentals', score: 95 },
        { domain: 'Network Implementations', score: 92 },
        { domain: 'Network Operations', score: 88 },
        { domain: 'Network Security', score: 90 },
        { domain: 'Network Troubleshooting', score: 90 }
      ],
      topStrengths: ['Subnet calculation', 'Switch port security', 'Static route tables']
    }
  },
  {
    id: 'student-3',
    firstName: 'Lwandle',
    surnameInitial: 'P.',
    schoolOrArea: 'Atlantis',
    track: 'CompTIA A+',
    score: 89,
    tags: ['Windows OS', 'RAM Configuration', 'Printer Ops'],
    rank: 3,
    consentGiven: true,
    cvUrl: '/assets/sample-student-cv.pdf',
    reportCardData: {
      examReadiness: 89,
      testsCompleted: 29,
      avgScore: 87,
      domainScores: [
        { domain: 'Mobile Devices', score: 92 },
        { domain: 'Networking', score: 85 },
        { domain: 'Hardware', score: 94 },
        { domain: 'Virtualization & Cloud', score: 86 },
        { domain: 'Troubleshooting', score: 89 }
      ],
      topStrengths: ['M.2 storage setup', 'SODIMM seating', 'OS driver recovery']
    }
  },
  {
    id: 'student-4',
    firstName: 'Jaden',
    surnameInitial: 'A.',
    schoolOrArea: 'Piketberg',
    track: 'CompTIA Network+',
    score: 87,
    tags: ['TCP/IP Ports', 'Fiber Optics', 'Firewall Rules'],
    rank: 4,
    consentGiven: true,
    cvUrl: '/assets/sample-student-cv.pdf',
    reportCardData: {
      examReadiness: 87,
      testsCompleted: 27,
      avgScore: 86,
      domainScores: [
        { domain: 'Networking Fundamentals', score: 90 },
        { domain: 'Network Implementations', score: 87 },
        { domain: 'Network Operations', score: 84 },
        { domain: 'Network Security', score: 89 },
        { domain: 'Troubleshooting', score: 85 }
      ],
      topStrengths: ['Patch panel crimping', '802.11 standards', 'VLAN tagging']
    }
  },
  {
    id: 'student-5',
    firstName: 'Sipho',
    surnameInitial: 'N.',
    schoolOrArea: 'Riebeek-Kasteel',
    track: 'Matric to Money',
    score: 95,
    tags: ['ATS Resume', 'Interview Prep', 'Helpdesk Basics'],
    rank: 5,
    consentGiven: true,
    cvUrl: '/assets/sample-student-cv.pdf',
    reportCardData: {
      examReadiness: 95,
      testsCompleted: 22,
      avgScore: 94,
      domainScores: [
        { domain: 'South African Labour Rights', score: 98 },
        { domain: 'Contract Scams Detection', score: 96 },
        { domain: 'Technical CV Structuring', score: 94 },
        { domain: 'Phone Screening & Etiquette', score: 92 }
      ],
      topStrengths: ['POPIA compliance', 'BCEA minimum wage laws', 'Technical portfolio presentation']
    }
  }
];

export const DEFAULT_LANDING_SETTINGS: LandingSettings = {
  storySubtitle: 'From a Western Cape Matric to Senior Network Engineer',
  storyLead: 'Gray started right here in the Western Cape with a standard matric certificate, no wealthy connections, and zero capital for R80,000/year private tech bootcamps.',
  storyParagraph1: 'Through hard-won hours drilling CompTIA A+ and Network+ fundamentals, building hands-on physical labs, and refusing empty motivational talks, Gray earned verified credentials that opened enterprise doors at a leading South African ISP.',
  storyParagraph2: 'ITreal Tech Solutions was founded so local young adults, matriculants, and school leavers can skip the guesswork. We deliver real technical rigor, South African labour market reality, and genuine pathways into the formal economy.',
  storyImage: '/assets/itreal-logo.png',
  stats: {
    studentsTrained: 240,
    courses: 3,
    years: 2
  }
};

// -------------------------------------------------------------
// Firestore Listeners & Operations
// -------------------------------------------------------------

export function subscribeReviews(onUpdate: (reviews: ReviewItem[]) => void): () => void {
  try {
    const q = collection(db, 'reviews');
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        onUpdate(DEFAULT_REVIEWS);
      } else {
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as ReviewItem));
        onUpdate(items);
      }
    }, (err) => {
      console.warn("Reviews snapshot fallback:", err);
      onUpdate(DEFAULT_REVIEWS);
    });
  } catch (err) {
    onUpdate(DEFAULT_REVIEWS);
    return () => {};
  }
}

export function subscribeTopStudents(onUpdate: (students: TopStudentItem[]) => void): () => void {
  try {
    const q = collection(db, 'topStudents');
    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        onUpdate(DEFAULT_TOP_STUDENTS.filter(s => s.consentGiven));
      } else {
        const items = snapshot.docs
          .map(doc => ({ ...doc.data(), id: doc.id } as TopStudentItem))
          .filter(s => s.consentGiven)
          .sort((a, b) => a.rank - b.rank);
        onUpdate(items);
      }
    }, (err) => {
      console.warn("Top students snapshot fallback:", err);
      onUpdate(DEFAULT_TOP_STUDENTS.filter(s => s.consentGiven));
    });
  } catch (err) {
    onUpdate(DEFAULT_TOP_STUDENTS.filter(s => s.consentGiven));
    return () => {};
  }
}

export function subscribeLandingSettings(onUpdate: (settings: LandingSettings) => void): () => void {
  try {
    const docRef = doc(db, 'landingSettings', 'general');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onUpdate({ ...DEFAULT_LANDING_SETTINGS, ...(snap.data() as Partial<LandingSettings>) });
      } else {
        onUpdate(DEFAULT_LANDING_SETTINGS);
      }
    }, (err) => {
      console.warn("Landing settings fallback:", err);
      onUpdate(DEFAULT_LANDING_SETTINGS);
    });
  } catch (err) {
    onUpdate(DEFAULT_LANDING_SETTINGS);
    return () => {};
  }
}

export async function submitInterviewInvite(invite: Omit<InterviewInvite, 'id' | 'createdAt' | 'status'>): Promise<void> {
  const collectionName = 'interviewInvites';
  try {
    await addDoc(collection(db, collectionName), {
      ...invite,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
}

export async function submitContactMessage(msg: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>): Promise<void> {
  const collectionName = 'contactMessages';
  try {
    await addDoc(collection(db, collectionName), {
      ...msg,
      status: 'unread',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
}

// Admin Hub Landing Management API
export async function saveReview(review: Partial<ReviewItem> & { id?: string }): Promise<void> {
  const collectionName = 'reviews';
  try {
    if (review.id) {
      await setDoc(doc(db, collectionName, review.id), review, { merge: true });
    } else {
      await addDoc(collection(db, collectionName), {
        ...review,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}

export async function deleteReview(id: string): Promise<void> {
  const path = `reviews/${id}`;
  try {
    await deleteDoc(doc(db, 'reviews', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveTopStudent(student: Partial<TopStudentItem> & { id?: string }): Promise<void> {
  const collectionName = 'topStudents';
  try {
    if (student.id) {
      await setDoc(doc(db, collectionName, student.id), student, { merge: true });
    } else {
      await addDoc(collection(db, collectionName), {
        ...student,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}

export async function deleteTopStudent(id: string): Promise<void> {
  const path = `topStudents/${id}`;
  try {
    await deleteDoc(doc(db, 'topStudents', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveLandingSettings(settings: Partial<LandingSettings>): Promise<void> {
  const path = 'landingSettings/general';
  try {
    await setDoc(doc(db, 'landingSettings', 'general'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
