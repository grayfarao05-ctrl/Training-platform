import { 
  db, 
  auth, 
  OperationType, 
  handleFirestoreError 
} from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { 
  UserStats, 
  Objective,
  TestResult, 
  WeeklyBossSubmission, 
  CourseConfig, 
  ReportData, 
  ReportDoc, 
  ReportVerificationDoc, 
  ReportDateRange, 
  DomainProgressSummary, 
  TestSummaryItem, 
  WeeklyActivitySummary, 
  BossSubmissionSummary,
  ActivityDay 
} from './types';
import { getCourseConfig, getCourseProgress, filterByCourse } from './courseConfig';

// ==========================================
// 1. Utilities: ID, Name Masking & Dates
// ==========================================

/**
 * Generates an unguessable 16-character alphanumeric report ID using crypto.
 */
export function generateReportId(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

/**
 * Formats a student's name to first name and surname initial only (e.g. "John D.").
 * Preserves privacy for public verification and employer disclosures.
 */
export function maskStudentName(displayName?: string, email?: string): string {
  const raw = (displayName && displayName !== 'Anonymous' 
    ? displayName 
    : (email ? email.split('@')[0].replace(/[._-]/g, ' ') : 'Student')).trim();
  
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Student';
  if (parts.length === 1) return parts[0];
  
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${first} ${lastInitial}.`;
}

/**
 * Formats dates according to en-ZA locale convention (e.g., "23 October 2026").
 */
export function formatDateEnZA(dateInput: string | Date | number): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' 
    ? new Date(dateInput) 
    : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  return d.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Builds standard sanitized download file name:
 * ITreal_{Surname}_{Name}_{Course}_{YYYY-MM-DD}.pdf
 */
export function getReportFileName(fullName: string, email: string, courseShortLabel: string, dateStr: string): string {
  const raw = (fullName && fullName !== 'Anonymous' ? fullName : (email ? email.split('@')[0] : 'Student')).trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  const firstName = parts[0] ? parts[0].replace(/[^A-Za-z0-9]/g, '') : 'Student';
  const surname = parts.length > 1 ? parts[parts.length - 1].replace(/[^A-Za-z0-9]/g, '') : 'Learner';
  const cleanCourse = (courseShortLabel || 'Course').replace(/[^A-Za-z0-9]/g, '');
  const cleanDate = (dateStr || new Date().toISOString()).slice(0, 10).replace(/[^0-9-]/g, '');
  return `ITreal_${surname}_${firstName}_${cleanCourse}_${cleanDate}.pdf`;
}

// ==========================================
// 2. Pure Report Data Builder
// ==========================================

export interface BuildReportDataOptions {
  userStats?: UserStats;
  courseConfig?: CourseConfig;
  testResults?: TestResult[];
  bossSubmissions?: WeeklyBossSubmission[];
  objectives?: Objective[];
}

/**
 * Pure builder function returning a typed ReportData object used by both Progress and Employer templates.
 * Fetches Firestore documents if not preloaded, respects date range filters, and never invents missing data.
 */
export async function buildReportData(
  studentUid: string,
  courseId: string,
  dateRange: ReportDateRange,
  tutorComment: string = '',
  preloaded?: BuildReportDataOptions
): Promise<ReportData> {
  // 1. Resolve Student Data
  let studentStats = preloaded?.userStats;
  if (!studentStats) {
    try {
      const userSnap = await getDoc(doc(db, 'users', studentUid));
      if (userSnap.exists()) {
        studentStats = { ...userSnap.data(), uid: userSnap.id } as UserStats;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${studentUid}`);
    }
  }

  if (!studentStats) {
    studentStats = {
      uid: studentUid,
      email: '',
      displayName: 'Student',
      xp: 0,
      level: 0,
      streak: 0,
      completedObjectives: [],
      lastStudyDate: '',
      examReadiness: 0,
      mockExamScores: [],
      badges: [],
      activityHistory: [],
      role: 'student'
    };
  }

  // 2. Resolve Course Configuration
  const courseConfig = preloaded?.courseConfig || getCourseConfig(courseId);

  // 3. Resolve Test Results for this student and course
  let allTestResults = preloaded?.testResults;
  if (!allTestResults) {
    try {
      const testsSnap = await getDocs(collection(db, 'users', studentUid, 'testResults'));
      allTestResults = testsSnap.docs.map(d => ({ ...d.data(), id: d.id } as TestResult));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${studentUid}/testResults`);
      allTestResults = [];
    }
  }

  // 4. Resolve Boss Challenge Submissions for this student and course
  let allBossSubmissions = preloaded?.bossSubmissions;
  if (!allBossSubmissions) {
    try {
      const bossSnap = await getDocs(query(
        collection(db, 'boss_submissions'),
        where('uid', '==', studentUid)
      ));
      allBossSubmissions = bossSnap.docs.map(d => ({ ...d.data(), id: d.id } as WeeklyBossSubmission));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'boss_submissions');
      allBossSubmissions = [];
    }
  }

  // Date boundary comparison (inclusive YYYY-MM-DD)
  const isAllTime = !!dateRange.isAllTime || dateRange.preset === 'all';
  const startDateStr = dateRange.start;
  const endDateStr = dateRange.end;

  const isInRange = (isoOrYmdDate?: string | null): boolean => {
    if (isAllTime || !isoOrYmdDate) return true;
    const ymd = isoOrYmdDate.slice(0, 10);
    if (startDateStr && ymd < startDateStr) return false;
    if (endDateStr && ymd > endDateStr) return false;
    return true;
  };

  // Filter test results by course and date
  const filteredTests = (allTestResults || []).filter(t => {
    const testCourse = t.course || 'a-plus';
    if (testCourse !== courseId) return false;
    const testDate = t.date || (t.timestamp?.toDate ? t.timestamp.toDate().toISOString() : '');
    return isInRange(testDate);
  }).sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    return dateB.localeCompare(dateA); // newest first
  });

  // Filter boss submissions by course and date
  const filteredBoss = (allBossSubmissions || []).filter(b => {
    if (b.course && b.course !== courseId) return false;
    return isInRange(b.timestamp);
  });

  // 5. Per-Course Progress & Objectives
  const courseProg = getCourseProgress(studentStats, courseId);
  const completedIds = courseProg.completedObjectives || [];

  // Resolve course objectives (preloaded or from Firestore)
  let courseObjectives = preloaded?.objectives;
  if (!courseObjectives) {
    try {
      const objSnap = await getDocs(collection(db, 'objectives'));
      const allObjs = objSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Objective));
      courseObjectives = filterByCourse(allObjs, courseId);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'objectives');
      courseObjectives = [];
    }
  }

  // Group objectives by domain from courseConfig, resolving domain by stable ID first or title fallback
  const domains: DomainProgressSummary[] = (courseConfig.domains || []).map(d => {
    const staticObjs = d.objectives || [];
    const dynamicObjs = (courseObjectives || []).filter(o => 
      o.domain === d.id || 
      (o.domain && d.title && o.domain.toLowerCase() === d.title.toLowerCase()) ||
      (o.domain && (d as any).name && o.domain.toLowerCase() === (d as any).name.toLowerCase())
    );

    // Deduplicate by objective id
    const objMap = new Map<string, Objective>();
    staticObjs.forEach(o => objMap.set(o.id, o));
    dynamicObjs.forEach(o => objMap.set(o.id, o));
    const domainObjs = Array.from(objMap.values());

    const completedInDomain = domainObjs.filter(o => completedIds.includes(o.id));
    return {
      domainId: d.id,
      domainTitle: d.title || (d as any).name || 'Core Domain',
      exam: d.exam || courseConfig.shortLabel,
      totalObjectives: domainObjs.length,
      completedObjectives: completedInDomain.length,
      completedObjectiveTitles: completedInDomain.map(o => o.title),
      hasMaterialsOpenedCount: completedInDomain.length // based on audit, completed represents verified read/opened material
    };
  });

  const totalCourseObjectives = domains.reduce((sum, d) => sum + d.totalObjectives, 0);
  const completedObjectiveTitles = domains.flatMap(d => d.completedObjectiveTitles);

  // 6. Test Metrics
  const testCount = filteredTests.length;
  let testAverage: number | null = null;
  let bestScore: number | null = null;

  if (testCount > 0) {
    const totalScore = filteredTests.reduce((sum, t) => sum + (t.score || 0), 0);
    testAverage = Math.round(totalScore / testCount);
    bestScore = Math.max(...filteredTests.map(t => t.score || 0));
  }

  // Determine trend by comparing oldest half vs newest half (if at least 2 tests exist)
  let trend: 'improving' | 'steady' | 'declining' | 'insufficient_data' = 'insufficient_data';
  if (testCount >= 3) {
    const chronological = [...filteredTests].reverse(); // oldest first
    const half = Math.floor(chronological.length / 2);
    const firstHalfAvg = chronological.slice(0, half).reduce((sum, t) => sum + t.score, 0) / half;
    const secondHalfAvg = chronological.slice(-half).reduce((sum, t) => sum + t.score, 0) / half;
    const diff = secondHalfAvg - firstHalfAvg;
    if (diff >= 5) trend = 'improving';
    else if (diff <= -5) trend = 'declining';
    else trend = 'steady';
  }

  const testItems: TestSummaryItem[] = filteredTests.map(t => ({
    id: t.id,
    date: t.date ? t.date.slice(0, 10) : '',
    score: t.score,
    type: t.type || 'Practice Test',
    subject: t.subject || 'Mixed',
    passed: t.passed ?? (t.score >= 75),
    durationMinutes: null // Per Phase 0 audit: duration is not recorded in Firestore
  }));

  // 7. Effort & Activity
  const activityDays: ActivityDay[] = (studentStats.activityHistory || []).filter(day => isInRange(day.date));
  const recordedStudyHours = Number((activityDays.reduce((sum, day) => sum + (day.studyHours || 0), 0)).toFixed(1));
  const daysActiveInPeriod = activityDays.filter(day => (day.count > 0 || (day.studyHours || 0) > 0)).length;

  // Build weekly chunks for visual effort bar chart (last 4 calendar weeks or weeks in period)
  const weeklyActivity: WeeklyActivitySummary[] = [];
  const sortedDays = [...activityDays].sort((a, b) => a.date.localeCompare(b.date));
  
  if (sortedDays.length > 0) {
    // Bucket by 7-day increments
    const bucketSize = 7;
    for (let i = 0; i < sortedDays.length; i += bucketSize) {
      const slice = sortedDays.slice(i, i + bucketSize);
      const weekIndex = Math.floor(i / bucketSize) + 1;
      const startDay = slice[0].date.slice(5); // MM-DD
      const endDay = slice[slice.length - 1].date.slice(5);
      weeklyActivity.push({
        weekLabel: `W${weekIndex} (${startDay} - ${endDay})`,
        daysActive: slice.filter(s => s.count > 0 || (s.studyHours || 0) > 0).length,
        xpEarned: slice.reduce((sum, s) => sum + (s.count || 0), 0),
        studyHours: Number((slice.reduce((sum, s) => sum + (s.studyHours || 0), 0)).toFixed(1))
      });
    }
  } else {
    // Provide clean empty structure for weekly chart
    weeklyActivity.push(
      { weekLabel: 'Week 1', daysActive: 0, xpEarned: 0, studyHours: 0 },
      { weekLabel: 'Week 2', daysActive: 0, xpEarned: 0, studyHours: 0 },
      { weekLabel: 'Week 3', daysActive: 0, xpEarned: 0, studyHours: 0 },
      { weekLabel: 'Week 4', daysActive: 0, xpEarned: 0, studyHours: 0 }
    );
  }

  // 8. Boss Submissions
  const bossItems: BossSubmissionSummary[] = filteredBoss.map(b => ({
    id: b.id || '',
    timestamp: b.timestamp ? b.timestamp.slice(0, 10) : '',
    status: b.status,
    isCorrect: b.isCorrect,
    xpAwarded: b.xpAwarded
  }));

  const gradedBoss = bossItems.filter(b => b.status === 'graded');
  const passedBoss = bossItems.filter(b => b.isCorrect === true);

  // 9. Summary sentence
  let summarySentence = '';
  if (testCount > 0) {
    summarySentence = `Active for ${daysActiveInPeriod} study day${daysActiveInPeriod === 1 ? '' : 's'} with an average test score of ${testAverage}%, completing ${completedIds.length} of ${totalCourseObjectives} curriculum objectives.`;
  } else if (completedIds.length > 0) {
    summarySentence = `Active for ${daysActiveInPeriod} study day${daysActiveInPeriod === 1 ? '' : 's'}, completing ${completedIds.length} of ${totalCourseObjectives} curriculum objectives.`;
  } else {
    summarySentence = `Registered learner enrolled in ${courseConfig.name} with ${totalCourseObjectives} curriculum objectives available.`;
  }

  // Full Name and Masked Name
  const fullName = (studentStats.displayName && studentStats.displayName !== 'Anonymous'
    ? studentStats.displayName
    : (studentStats.email ? studentStats.email.split('@')[0] : 'Student')).trim();
  const maskedName = maskStudentName(studentStats.displayName, studentStats.email);

  return {
    student: {
      uid: studentUid,
      fullName,
      maskedName,
      email: studentStats.email || ''
    },
    course: {
      id: courseConfig.id,
      name: courseConfig.name,
      shortLabel: courseConfig.shortLabel,
      accentHex: courseConfig.accentHex || '#dc2626',
      accentColor: courseConfig.accentColor || 'red-600'
    },
    period: {
      start: startDateStr || (activityDays[0]?.date || new Date().toISOString().slice(0, 10)),
      end: endDateStr || new Date().toISOString().slice(0, 10),
      isAllTime
    },
    issuedAt: new Date().toISOString(),
    tutorComment: tutorComment.trim(),
    summarySentence,
    examReadiness: {
      percentage: courseProg.examReadiness || 0,
      explanation: 'Calculated from core objective curriculum completion and mock exam performance.'
    },
    domains,
    objectives: {
      completedCount: completedIds.length,
      totalCount: totalCourseObjectives,
      completedTitles: completedObjectiveTitles
    },
    tests: {
      items: testItems,
      totalCount: testCount,
      averageScore: testAverage,
      bestScore,
      trend,
      weakestTopics: null // Per Phase 0 audit: individual question mistakes are not saved
    },
    bossChallenges: {
      submissions: bossItems,
      totalSubmitted: bossItems.length,
      gradedCount: gradedBoss.length,
      passedCount: passedBoss.length
    },
    effort: {
      recordedStudyHours,
      daysActiveInPeriod,
      currentStreak: studentStats.streak || 0,
      weeklyActivity: weeklyActivity.slice(-4)
    },
    engagement: {
      xp: studentStats.xp || 0,
      level: studentStats.level || 0,
      arcadeGamesPlayed: 0 // Engagement tracker
    }
  };
}

// ==========================================
// 3. Storage Operations (Firestore)
// ==========================================

/**
 * Recursively removes undefined fields from an object to ensure Firestore compatibility.
 */
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
  const result: any = Array.isArray(obj) ? [] : {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      result[key] = removeUndefinedFields(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Saves a generated report record into the admin-only reports/{reportId} collection.
 */
export async function saveReportRecord(report: ReportDoc): Promise<void> {
  const ref = doc(db, 'reports', report.id);
  const cleanData = removeUndefinedFields(report);
  await setDoc(ref, cleanData);
}

/**
 * Saves or updates a public verification record into report_verifications/{reportId}.
 */
export async function saveReportVerification(verification: ReportVerificationDoc): Promise<void> {
  const ref = doc(db, 'report_verifications', verification.id);
  const cleanData = removeUndefinedFields(verification);
  await setDoc(ref, cleanData);
}

/**
 * Revokes an existing report verification (setting status to 'revoked').
 */
export async function revokeReportVerification(reportId: string): Promise<void> {
  const ref = doc(db, 'report_verifications', reportId);
  await updateDoc(ref, {
    status: 'revoked'
  });
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      status: 'revoked'
    });
  } catch (err) {
    // Optional secondary sync; report_verifications is the authoritative record
  }
}

/**
 * Reads a public verification record by ID. Publicly readable without listing permissions.
 */
export async function getReportVerification(reportId: string): Promise<ReportVerificationDoc | null> {
  try {
    const ref = doc(db, 'report_verifications', reportId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as ReportVerificationDoc;
  } catch (err) {
    console.error('Failed to load report verification:', err);
    return null;
  }
}

/**
 * Fetches all report records issued for a given student UID (Admin only).
 */
export async function getStudentReportsHistory(studentUid: string): Promise<ReportDoc[]> {
  try {
    const q = query(
      collection(db, 'reports'),
      where('studentUid', '==', studentUid)
    );
    const snap = await getDocs(q);
    const reports = snap.docs.map(d => d.data() as ReportDoc);
    return reports.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'reports');
    return [];
  }
}
