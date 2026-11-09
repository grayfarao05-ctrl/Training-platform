
export type CourseId = string;

export type CourseStatus = 'draft' | 'published' | 'archived';

export interface CourseDomainItem {
  id: string;
  name: string;
}

export interface CourseDoc {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  accentColor: string; // hex e.g. #dc2626
  domains: CourseDomainItem[];
  requiresCode: boolean;
  status: CourseStatus;
  order: number;
  createdAt: any;
  createdBy: string;
}

export type ExamPart = 'Core 1' | 'Core 2' | 'N10-008' | string;

export interface CourseProgress {
  examReadiness: number;
  completedObjectives: string[];
}

export interface CourseGame {
  id: ViewState;
  title: string;
  description: string;
  icon: 'Layers' | 'Zap' | 'Terminal' | 'Gamepad2' | 'Network' | 'FileText' | 'FileCheck' | 'FileWarning' | 'ShieldAlert';
  badge?: string;
  badgeType?: 'gold' | 'green' | 'red' | 'blue' | 'orange';
  xpReward: string;
  statsKey: 'trio' | 'speedrun' | 'cli' | 'puzzle' | 'pathFinder' | 'acronym' | 'cvClinic' | 'contractRedFlags';
}


export interface CourseConfig {
  id: CourseId;
  name: string;
  shortLabel: string;
  badgeLabel: string;
  accentColor: string; // e.g. 'red-600' | 'blue-600'
  accentHex: string;   // e.g. '#dc2626' | '#2563eb'
  bgGlow: string;      // e.g. 'rgba(220,38,38,0.3)' | 'rgba(37,99,235,0.3)'
  textColor: string;   // e.g. 'text-red-600' | 'text-blue-500'
  description: string;
  tagline: string;
  domains: Domain[];
  games: CourseGame[];
}

export interface Objective {
  id: string;
  title: string;
  domain: string;
  description: string;
  exam: ExamPart;
  thumbnail?: string;
  content?: string;
  components?: PhysicalComponent[];
  questions?: PracticeQuestion[];
  lastUpdated?: string;
  course?: CourseId;
  docId?: string;
  interactiveLesson?: LessonData;
}


export interface Domain {
  id: string;
  title: string;
  name?: string; // For backward compatibility with some components
  exam: ExamPart;
  objectives: Objective[];
  color?: string;
  objectivesCount?: number;
  course?: CourseId;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

export interface Rank {
  title: string;
  minXp: number;
  reward: string;
  color: string;
}

export interface ActivityDay {
  date: string;
  count: number; // XP earned on this day
  studyHours?: number;
}

export interface UserStats {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  xp: number;
  level: number;
  streak: number;
  completedObjectives: string[]; // Kept for A+ backwards compatibility
  lastStudyDate: string;
  examReadiness: number; // Kept for A+ backwards compatibility
  mockExamScores: number[];
  badges: string[];
  activityHistory: ActivityDay[];
  role: 'student' | 'admin';
  status?: 'active' | 'suspended';
  domainMastery?: { domainId: string; name: string; score: number; color: string; }[];
  unlockedCourses?: CourseId[] | string[];
  courseProgress?: {
    [key in CourseId]?: CourseProgress;
  };
  redeemedCode?: string;
  materialsRead?: string[];
  arcadeCompleted?: { [gameKey: string]: string[] };
  lastOpenedCourse?: CourseId | null;
  lastOpenedObjectiveId?: string | null;
  lastOpenedObjectiveTitle?: string | null;
  avatarArchetype?: string;
  activeCardId?: string;
  unlockedCardIds?: string[];
}

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface CardStats {
  dedication: number;     // 1 to 10
  focus: number;          // 1 to 10
  problemSolving: number; // 1 to 10
  teamPlayer: number;     // 1 to 10
}

export interface GalleryCard {
  id: string;
  title: string;
  subtitle: string;
  archetypeId: string;
  level: number;          // 1 to 6 (0 for special challenges)
  rankTitle: string;      // 'TRAINEE' | 'SPECIALIST' | 'ANALYST' | 'ENGINEER' | 'COMMANDER' | 'TITAN'
  rarity: CardRarity;
  quote: string;
  lore: string;
  stats: CardStats;
  artUrl: string;
  accentColor: string;    // HEX string e.g. '#22c55e'
  requiredXp: number;
  isSpecial?: boolean;
  specialChallengeId?: string;
  unlockedAt?: string;
}

export interface SpecialChallenge {
  id: string;
  title: string;
  description: string;
  rewardCardTitle: string;
  rewardCardSubtitle: string;
  rarity: CardRarity;
  accentColor: string;
  quote: string;
  lore: string;
  stats: CardStats;
  artUrl?: string;
  requiredXp?: number;
  conditionType: 'manual_grant' | 'xp_threshold' | 'labs_completed' | 'game_master';
  createdAt: any;
  createdBy?: string;
}

export interface AvatarArchetype {
  id: string;
  name: string;
  codename: string;
  gender: 'female' | 'male';
  role: string;
  bio: string;
  tagline: string;
  accentColor: string;
  thumbnailUrl: string;
  defaultCardId: string;
  cardArtTiers?: Record<number, string>;
}

export interface Announcement {
  id: string;
  title: string;       // max 100
  body: string;        // max 600, plain text
  audience: string;    // 'all' or course ID
  pinned: boolean;
  createdAt: any;
  createdBy: string;
  expiresAt?: string | null;
}

export type VacancyType = 'learnership' | 'internship' | 'junior-role' | 'contract' | 'other';

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  type: VacancyType;
  closingDate: string; // ISO date string (YYYY-MM-DD or full timestamp)
  applyUrl?: string;   // must start with https://
  applyInfo?: string;  // max 200, plain text
  status: 'open' | 'closed';
  createdAt: any;
}

export interface NewsItem {
  id: string;
  title: string;
  sourceName: string;
  url: string;         // https:// only
  note?: string;       // max 200, plain text
  publishedAt: string;
  createdAt: any;
}

export type QuestionType = 'choice' | 'image' | 'multi' | 'fill' | 'match' | 'order' | 'terminal';

export interface MatchPair {
  left: string;
  right: string;
}

export interface TestQuestion {
  id: string;
  text: string;
  type?: QuestionType; // default 'choice' when missing
  explanation: string;
  domain: string;
  course?: CourseId;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  objectiveId?: string;

  // Choice & Image:
  options?: string[];
  correctAnswer?: number;

  // Image question fields:
  imageUrl?: string;
  imagePath?: string;
  imageAlt?: string;

  // Multi-choice fields:
  correctAnswers?: number[];

  // Fill in the blank fields:
  acceptedAnswers?: string[];
  caseSensitive?: boolean;

  // Match fields:
  pairs?: MatchPair[];

  // Order fields:
  steps?: string[];

  // Terminal fields:
  prompt?: string;
  acceptedCommands?: string[];
  simulatedOutput?: string;
  hint?: string;

  // AI Draft provenance & metadata
  aiDrafted?: boolean;
  imageIdea?: string;
}

export type AiDraftQuestionType = QuestionType | 'cli';

export interface BaseAiDraft {
  type: QuestionType;
  question: string;
  explanation: string;
  course?: CourseId;
  domain?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  objectiveTitle?: string;
  aiDrafted?: boolean;
}

export interface ChoiceAiDraft extends BaseAiDraft {
  type: 'choice';
  options: string[];
  correctAnswer: number;
}

export interface MultiAiDraft extends BaseAiDraft {
  type: 'multi';
  options: string[];
  correctAnswers: number[];
}

export interface FillAiDraft extends BaseAiDraft {
  type: 'fill';
  acceptedAnswers: string[];
}

export interface MatchAiDraft extends BaseAiDraft {
  type: 'match';
  pairs: MatchPair[];
}

export interface OrderAiDraft extends BaseAiDraft {
  type: 'order';
  steps: string[];
}

export interface ImageAiDraft extends BaseAiDraft {
  type: 'image';
  options: string[];
  correctAnswer: number;
  altText: string;
  imageIdea: string;
}

export interface CliAiDraft extends BaseAiDraft {
  type: 'terminal';
  acceptedCommands: string[];
  simulatedOutput: string;
  hint: string;
}

export type AiQuestionDraft = 
  | ChoiceAiDraft 
  | MultiAiDraft 
  | FillAiDraft 
  | MatchAiDraft 
  | OrderAiDraft 
  | ImageAiDraft 
  | CliAiDraft;

export interface AiDraftResponse {
  drafts: AiQuestionDraft[];
  droppedCount: number;
  requestedType: QuestionType;
}

export interface ExternalLink {
  id: string;
  label: string;
  url: string;
  description?: string;
  createdAt: any;
  course?: CourseId;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  objectiveId: string;
  course?: CourseId;
}

// Physical component definition for hardware objectives
export interface PhysicalComponent {
  name: string;
  description: string;
  visualTags?: string;
}

// CV Clinic Types
export type MistakeCategory = 'contact' | 'privacy' | 'honesty' | 'format' | 'spelling' | 'content';

export interface CVClinicMistake {
  category: MistakeCategory;
  reason: string; // max 160 characters
}

export interface CVClinicLine {
  id: string;
  text: string; // max 200 characters
  mistake?: CVClinicMistake;
}

export interface CVClinicSection {
  heading: string; // e.g., "File", "Personal Details", "Education", "Experience"
  lines: CVClinicLine[];
}

export interface CVClinicCase {
  id?: string;
  course: CourseId;
  title: string; // max 80
  brief: string; // max 200, plain text
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimitSeconds: number; // default 60, allowed 30 to 180
  sections: CVClinicSection[];
  status: 'draft' | 'published';
  createdAt: any;
  createdBy: string;
}

export interface CVClinicLeaderboard {
  id?: string;
  uid: string;
  username: string;
  score: number;
  caseId: string;
  caseTitle: string;
  stars: number;
  mistakesFound: number;
  totalMistakes: number;
  wrongTaps: number;
  timeRemaining: number;
  course: CourseId;
  timestamp: string;
}

// ==========================================
// Contract Red Flags Types
// ==========================================
export type ContractRequiredItemKey = 
  | 'duties' 
  | 'pay' 
  | 'hours' 
  | 'probation' 
  | 'leave' 
  | 'notice' 
  | 'uif';

export type ContractFlagCategory = 
  | ContractRequiredItemKey 
  | 'blank' 
  | 'verbal';

export interface ContractClause {
  id: string;
  heading?: string; // max 60 chars
  text: string;    // max 300 chars
  flag?: {
    category: ContractFlagCategory;
    reason: string; // max 200 chars
  };
}

export type ContractVerdict = 'sign' | 'ask-first' | 'dont-sign';

export interface ContractCase {
  id?: string;
  course: CourseId;
  title: string; // max 80
  brief: string; // max 200, plain text
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimitSeconds: number; // scan step only: default 90, allowed 45 to 240
  clauses: ContractClause[];
  missingItems: ContractRequiredItemKey[];
  correctVerdict: ContractVerdict;
  status: 'draft' | 'published';
  createdAt: any;
  createdBy: string;
}

export interface ReferenceFigures {
  minimumWageHourly: number;
  minimumWageFrom: string;
  uifRatePercent: number;
  checkedOn: string;
  source: string;
}

export interface ContractLeaderboard {
  id?: string;
  uid: string;
  username: string;
  score: number;
  caseId: string;
  caseTitle: string;
  stars: number;
  flagsFound: number;
  totalFlags: number;
  missingItemsCorrect: number;
  totalMissingItems: number;
  wrongTaps: number;
  wrongTicks: number;
  hintsUsed: number;
  verdictCorrect: boolean;
  timeRemaining: number;
  course: CourseId;
  timestamp: any;
}

export type ViewState = 'landing' | 'home' | 'dashboard' | 'my-courses' | 'objectives' | 'test-center' | 'performance' | 'leaderboard' | 'gallery' | 'goals' | 'settings' | 'profile' | 'admin' | 'subnet-speed-run' | 'match-the-trio' | 'cli-challenge' | 'motherboard-puzzle' | 'path-finder' | 'acronym-attack' | 'cv-clinic' | 'contract-red-flags' | 'privacy-policy' | 'terms-of-use';


export interface AcronymAttackLeaderboard {
  id?: string;
  uid: string;
  username: string;
  score: number;
  mode: string;
  timestamp: string;
  course?: CourseId;
}

export interface PathFinderLeaderboard {
  id?: string;
  uid: string;
  username: string;
  score: number;
  timestamp: string;
  course?: CourseId;
}

export interface MinigameLeaderboard {
  id?: string;
  gameId: 'subnet-speed-run' | 'path-finder' | 'acronym-attack';
  uid: string;
  username: string;
  score: number;
  time: number;
  timestamp: string;
  course?: CourseId;
}

export interface MatchMakerHighscore {
  id?: string;
  uid: string;
  username: string;
  time: number;
  turns: number;
  timestamp: string;
  course?: CourseId;
}

export interface CliLeaderboard {
  id?: string;
  uid: string;
  username: string;
  streak: number;
  timestamp: string;
  course?: CourseId;
}

export interface SharedResource {
  id?: string;
  title: string;
  category: 'Networking' | 'Hardware' | 'Troubleshooting' | 'Other';
  url: string;
  uploaderName: string;
  uploaderUid: string;
  timestamp: string;
  verified: boolean;
  fileType: string;
  course?: CourseId;
}

export interface WeeklyBossChallenge {
  id?: string;
  question: string;
  maxXP: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  active: boolean;
  createdAt: string;
  course?: CourseId;
}

export interface WeeklyBossSubmission {
  id?: string;
  challengeId: string;
  uid: string;
  username: string;
  answer: string;
  status: 'pending' | 'graded';
  isCorrect?: boolean;
  xpAwarded?: number;
  feedback?: string;
  timestamp: string;
  course?: CourseId;
}

export interface BossChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  xpReward: number;
  rewardXp?: number; // Some components use this
  objectives: string[];
  course?: CourseId;
}

export interface BossResponse {
  id?: string;
  challengeId: string;
  challengeTitle?: string;
  userId?: string;
  uid?: string; // Some components use this
  email?: string; // Some components use this
  content?: string;
  answer?: string; // Some components use this
  status: 'pending' | 'graded';
  grade?: number;
  feedback?: string;
  createdAt?: any;
  submittedAt?: any;
  course?: CourseId;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  xp: number;
  level: number;
  rank: string;
  rankTitle?: string;
  rankColor?: string;
  updatedAt?: any;
  course?: CourseId;
}

export interface TestResult {
  id: string;
  userId: string;
  objectiveId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage?: number;
  answers?: Record<string, any>;
  timestamp: any;
  date?: string;
  type?: string;
  subject?: string;
  xpEarned?: number;
  passed?: boolean;
  course?: CourseId;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  objectiveId: string;
  createdAt?: any;
  status?: string;
  answer?: number;
  answeredAt?: any;
  course?: CourseId;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any;
  priority?: 'low' | 'medium' | 'high';
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
}

export interface ObjectivePdf {
  id: string; // Document ID: ${course}_${objectiveId} (e.g. "a-plus_1.1", "network-plus_1.1")
  course: CourseId;
  objectiveId: string;
  storagePath: string;
  downloadURL: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
}

// ==========================================
// Student Report Generation Types
// ==========================================

export type ReportType = 'progress' | 'employer';
export type ReportStatus = 'valid' | 'revoked';

export interface ReportConsent {
  confirmed: boolean;
  confirmedBy: string;
  date: string;
}

export interface ReportSnapshot {
  testAverage: number | null;
  totalTests: number;
  bestScore: number | null;
  objectivesCompleted: number;
  objectivesTotal: number;
  studyHours: number;
  examReadiness: number;
  streak: number;
  xp: number;
  level: number;
}

export interface ReportDoc {
  id: string; // 16 unguessable random chars
  type: ReportType;
  studentUid: string;
  courseId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  issuedAt: string;    // ISO timestamp
  issuedBy: string;    // Admin UID / email
  tutorComment: string;
  consent: ReportConsent;
  snapshot: ReportSnapshot;
  status?: ReportStatus;
}

export interface ReportVerificationDoc {
  id: string; // matches reportId
  type: ReportType;
  studentDisplayName: string; // First name and surname initial only (e.g. "John D.")
  courseName: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  testAverage: number | null; // rounded integer
  objectivesCompleted: number;
  objectivesTotal: number;
  status: ReportStatus;
}

export interface ReportDateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  preset?: '30days' | 'custom' | 'all';
  isAllTime?: boolean;
}

export interface DomainProgressSummary {
  domainId: string;
  domainTitle: string;
  exam: string;
  totalObjectives: number;
  completedObjectives: number;
  completedObjectiveTitles: string[];
  hasMaterialsOpenedCount: number;
}

export interface TestSummaryItem {
  id: string;
  date: string;
  score: number;
  type: string;
  subject: string;
  passed: boolean;
  durationMinutes: number | null;
}

export interface BossSubmissionSummary {
  id: string;
  challengeQuestion?: string;
  timestamp: string;
  status: 'pending' | 'graded';
  isCorrect?: boolean;
  xpAwarded?: number;
}

export interface WeeklyActivitySummary {
  weekLabel: string;
  daysActive: number;
  xpEarned: number;
  studyHours: number;
}

export interface ReportData {
  student: {
    uid: string;
    fullName: string;
    maskedName: string;
    email: string;
  };
  course: {
    id: string;
    name: string;
    shortLabel: string;
    accentHex: string;
    accentColor: string;
  };
  period: {
    start: string;
    end: string;
    isAllTime: boolean;
  };
  issuedAt: string;
  tutorComment: string;
  summarySentence: string;
  examReadiness: {
    percentage: number;
    explanation: string;
  };
  domains: DomainProgressSummary[];
  objectives: {
    completedCount: number;
    totalCount: number;
    completedTitles: string[];
  };
  tests: {
    items: TestSummaryItem[];
    totalCount: number;
    averageScore: number | null;
    bestScore: number | null;
    trend: 'improving' | 'steady' | 'declining' | 'insufficient_data';
    weakestTopics: string | null;
  };
  bossChallenges: {
    submissions: BossSubmissionSummary[];
    totalSubmitted: number;
    gradedCount: number;
    passedCount: number;
  };
  effort: {
    recordedStudyHours: number;
    daysActiveInPeriod: number;
    currentStreak: number;
    weeklyActivity: WeeklyActivitySummary[];
  };
  engagement: {
    xp: number;
    level: number;
    arcadeGamesPlayed: number;
  };
}

// ==========================================
// INTERACTIVE LEARNING ENGINE TYPES
// ==========================================

export type LessonSectionType = 
  | 'text' 
  | 'diagram' 
  | '3d-model' 
  | 'animation' 
  | 'lab' 
  | 'terminal'
  | 'matcher'
  | 'finance-sim'
  | 'prompt-lab'
  | 'scenario' 
  | 'quiz';

export interface BaseLessonSection {
  id: string;
  type: LessonSectionType;
  title: string;
  subtitle?: string;
  estimatedMinutes?: number;
}

export interface TextLessonSection extends BaseLessonSection {
  type: 'text';
  content: {
    lead: string;
    sections: {
      heading: string;
      body: string[];
      bulletPoints?: string[];
      callout?: {
        type: 'exam-tip' | 'warning' | 'pro-tip' | 'definition';
        title: string;
        content: string;
      };
      expandedDetails?: {
        summary: string;
        details: string;
      };
    }[];
    keyTakeaways: string[];
    technicalTerms?: { term: string; definition: string }[];
  };
}

export interface DiagramHotspot {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  name: string;
  category?: string;
  shortDescription: string;
  fullSpecs: string;
  troubleshootingNote?: string;
  examRelevance?: string;
}

export interface DiagramLessonSection extends BaseLessonSection {
  type: 'diagram';
  diagramId: string;
  diagramTitle: string;
  description: string;
  hotspots: DiagramHotspot[];
  quizQuestions?: {
    prompt: string;
    targetHotspotId: string;
    hint: string;
  }[];
}

export interface Hardware3DPart {
  id: string;
  name: string;
  category: string;
  color: string;
  wireframeColor?: string;
  shape: 'box' | 'cylinder' | 'heatpipe' | 'board' | 'fan' | 'chip';
  dimensions: [number, number, number];
  defaultPosition: [number, number, number];
  explodedPosition: [number, number, number];
  rotation?: [number, number, number];
  description: string;
  specs: string;
  failureSymptoms: string;
  examTip?: string;
}

export interface ThreeDViewerSection extends BaseLessonSection {
  type: '3d-model';
  modelId: string;
  modelTitle: string;
  description: string;
  parts: Hardware3DPart[];
  explodedViewAvailable: boolean;
}

export interface AnimationStep {
  stepNumber: number;
  label: string;
  description: string;
  highlightedElement: string;
  metrics?: { label: string; value: string };
}

export interface AnimationLessonSection extends BaseLessonSection {
  type: 'animation';
  animationType: string;
  title: string;
  description: string;
  steps: AnimationStep[];
}

export interface LabStep {
  id: string;
  instruction: string;
  detail: string;
  safetyWarning?: string;
  toolRequired?: string;
  actionType: string;
  feedbackOnSuccess: string;
  targetX?: number; // percentage 0-100 on workbench canvas
  targetY?: number; // percentage 0-100 on workbench canvas
  targetZoneLabel?: string;
}


export interface VirtualLabSection extends BaseLessonSection {
  type: 'lab';
  labTitle: string;
  goal: string;
  hardwareSubject: string;
  prerequisites: string[];
  steps: LabStep[];
  successMessage: string;
  xpReward: number;
  blueprintType?: 'laptop' | 'motherboard' | 'network-rack' | 'workstation';
}

export interface TerminalTask {
  id: string;
  promptInstruction: string;
  expectedCommands: string[]; // e.g., ["ipconfig /all", "ipconfig"]
  commandOutput: string;
  explanation: string;
  hint: string;
}

export interface TerminalLessonSection extends BaseLessonSection {
  type: 'terminal';
  terminalTitle: string;
  environmentLabel: string; // e.g., "Windows 11 Admin PowerShell" | "Ubuntu 24.04 LTS Bash" | "Cisco IOS Switch CLI"
  promptPrefix: string; // e.g., "C:\\Windows\\System32>" | "tech@itreal-srv:~$"
  briefing: string;
  tasks: TerminalTask[];
  xpReward: number;
}

export interface MatcherPair {
  id: string;
  sourceLabel: string;
  sourceCategory?: string;
  targetLabel: string;
  targetSpec: string;
  explanation: string;
}

export interface MatcherLessonSection extends BaseLessonSection {
  type: 'matcher';
  matcherTitle: string;
  description: string;
  mode?: 'port-cable' | 'step-sequence' | 'concept-match';
  pairs: MatcherPair[];
  xpReward: number;
}

export interface PayslipHotspotItem {
  id: string;
  label: string;
  amountZar: number;
  category: 'earnings' | 'deduction' | 'employer' | 'net';
  explanation: string;
  bceaOrSarsRule: string;
}

export interface FinanceSimLessonSection extends BaseLessonSection {
  type: 'finance-sim';
  simTitle: string;
  employeeName: string;
  roleTitle: string;
  grossMonthlyZar: number;
  payslipItems: PayslipHotspotItem[];
  auditQuestion: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
  budgetTargetPercent: {
    needsMax: number; // e.g. 50
    wantsMax: number; // e.g. 30
    savingsMin: number; // e.g. 20
  };
  xpReward: number;
}

export interface PromptGuardrailToggle {
  id: string;
  category: 'role' | 'context' | 'constraints' | 'popia-safety';
  label: string;
  promptSnippet: string;
  qualityBoost: number;
  isOptimal: boolean;
  feedback: string;
}

export interface HallucinationSegment {
  id: string;
  text: string;
  isRedFlag: boolean;
  flagType?: 'hallucination' | 'popia-breach' | 'bias';
  explanation?: string;
}

export interface PromptLabLessonSection extends BaseLessonSection {
  type: 'prompt-lab';
  labTitle: string;
  scenarioBrief: string;
  baseWeakPrompt: string;
  weakOutputPreview: string;
  optimalOutputPreview: string;
  toggles: PromptGuardrailToggle[];
  outputAuditSegments: HallucinationSegment[];
  xpReward: number;
}

export interface ScenarioChoice {
  id: string;
  label: string;
  actionDescription: string;
  nextStepId?: string;
  isResolved?: boolean;
  isFatal?: boolean;
  feedback: string;
  xpDelta?: number;
}

export interface ScenarioStep {
  id: string;
  title: string;
  scenarioText: string;
  customerStatement?: string;
  systemState: {
    power: 'on' | 'off' | 'post-error' | 'thermal-throttling';
    screen: 'blank' | 'dim' | 'flickering' | 'normal';
    fan: 'silent' | 'max-rpm' | 'grinding' | 'normal';
    tempReading?: string;
    beepCodes?: string;
  };
  diagnosticOptions: ScenarioChoice[];
}

export interface ScenarioLessonSection extends BaseLessonSection {
  type: 'scenario';
  caseTitle: string;
  clientName: string;
  deviceModel: string;
  initialProblemDescription: string;
  startStepId: string;
  steps: Record<string, ScenarioStep>;
}

export interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  examObjectiveRef: string;
}

export interface QuizLessonSection extends BaseLessonSection {
  type: 'quiz';
  quizTitle: string;
  passThresholdPercent: number;
  questions: QuizQuestionItem[];
  xpReward: number;
}

export type LessonSection = 
  | TextLessonSection 
  | DiagramLessonSection 
  | ThreeDViewerSection 
  | AnimationLessonSection 
  | VirtualLabSection 
  | TerminalLessonSection
  | MatcherLessonSection
  | FinanceSimLessonSection
  | PromptLabLessonSection
  | ScenarioLessonSection 
  | QuizLessonSection;

export interface LessonData {
  objectiveId: string;
  courseId: CourseId;
  title: string;
  domainName: string;
  badgeLabel: string;
  summary: string;
  sections: LessonSection[];
}


