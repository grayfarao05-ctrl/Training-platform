
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LessonRenderer from './components/lessons/LessonRenderer';
import TestCenter from './components/TestCenter';
import Performance from './components/Performance';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import VerificationScreen from './components/VerificationScreen';
const SubnetSpeedRun = React.lazy(() => import('./components/minigames/SubnetSpeedRun'));
const MatchTheTrio = React.lazy(() => import('./components/minigames/MatchTheTrio'));
const CommandLineChallenge = React.lazy(() => import('./components/minigames/CommandLineChallenge'));
const MotherboardPuzzle = React.lazy(() => import('./components/minigames/MotherboardPuzzle'));
const PathFinder = React.lazy(() => import('./components/minigames/PathFinder'));
const AcronymAttack = React.lazy(() => import('./components/minigames/AcronymAttack'));
const CVClinicGame = React.lazy(() => import('./components/minigames/CVClinicGame'));
const ContractRedFlagsGame = React.lazy(() => import('./components/minigames/ContractRedFlagsGame'));
const PrivacyPolicy = React.lazy(() => import('./components/PrivacyPolicy'));
const TermsOfUse = React.lazy(() => import('./components/TermsOfUse'));
const MyGallery = React.lazy(() => import('./components/gallery/MyGallery'));
import CourseUnlockScreen from './components/CourseUnlockScreen';
import LeaderboardView from './components/LeaderboardView';
import { MyCoursesView } from './components/MyCoursesView';
import HomePage from './components/HomePage';
import { WelcomeIntro } from './components/WelcomeIntro';
import {
  fetchWelcomeInvite,
  recordInviteOpened,
  getWelcomeIntroSettings,
  WelcomeIntroSettings,
  DEFAULT_WELCOME_SETTINGS,
} from './welcomeInvitesService';
import { COMPTIA_DOMAINS, calculateLevel } from './constants';
import { ViewState, Objective, UserStats, Domain, Todo, TestResult, CourseId, ObjectivePdf, CourseDoc } from './types';
import { getCourseConfig, getCourseProgress, isCourseUnlocked, filterByCourse, withCourse, COURSE_LIST } from './courseConfig';
import { subscribeCourses, courseDocToConfig, isCourseAccessible } from './coursesService';
import { subscribeAllObjectivePdfs, getPdfForObjective } from './objectivePdfsService';
import { getInteractiveLesson } from './components/lessons/sampleLessons';
import { getObjectiveImage } from './themeAssets';
import ThemeToggle from './components/ThemeToggle';
import { User, ChevronRight, Settings, LogIn, Loader2, ShieldAlert, CheckCircle2, LayoutDashboard, BookOpen, GraduationCap, BarChart3, Lock, FileText, Menu, Sparkles } from 'lucide-react';
import { auth, db, signInWithGoogle, logout, clearUserStorage, OperationType, handleFirestoreError } from './firebase';
import { syncLeaderboard } from './statsService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { AnimatePresence, motion } from 'motion/react';
import { scrollToTop } from './scrollUtils';
import { Stagger, NetworkBackdrop, GradientDrift, RankCelebration } from './animations';

const AdminRoute = ({ children, userStats }: { children: React.ReactNode, userStats: UserStats }) => {
  if (userStats.role === 'admin' || (userStats as any).isAdmin) {
    return <>{children}</>;
  }
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-6 text-[var(--text-main)]">
      <div className="bg-[var(--bg-card)] p-10 rounded-3xl border border-rose-500/30 text-center max-w-lg w-full shadow-xl">
        <ShieldAlert className="text-rose-500 w-12 h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold tracking-tight mb-2">Access Denied</h1>
        <p className="text-[var(--text-muted)] text-sm">You do not have permission to view the Admin Hub.</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [courseDocs, setCourseDocs] = useState<CourseDoc[]>([]);
  const [activeCourse, setActiveCourse] = useState<CourseId | null>(null);
  const [unlockTargetCourse, setUnlockTargetCourse] = useState<CourseId | null>(null);
  const [authLegalModal, setAuthLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [view, setView] = useState<ViewState>('landing');
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [pdfMap, setPdfMap] = useState<Record<string, ObjectivePdf>>({});
  const [tasks, setTasks] = useState<Todo[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [publicAuthMode, setPublicAuthMode] = useState<'landing' | 'login' | 'register'>('landing');

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('intro=1');
  });
  const [resolvingInvite, setResolvingInvite] = useState(() => {
    if (typeof window === 'undefined') return false;
    const pathSlug = window.location.pathname.replace(/^\/+|\/+$/g, '');
    return /^[a-z0-9]{6}$/i.test(pathSlug);
  });
  const [welcomeStudentName, setWelcomeStudentName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return new URLSearchParams(window.location.search).get('name') || '';
    } catch {
      return '';
    }
  });
  const [welcomeConfig, setWelcomeConfig] = useState<WelcomeIntroSettings>(DEFAULT_WELCOME_SETTINGS);

  // Resolve short-link invite (/xtpkjs) & load Welcome Intro settings from Firestore
  useEffect(() => {
    let active = true;
    const initWelcome = async () => {
      try {
        const cfg = await getWelcomeIntroSettings();
        if (!active) return;
        setWelcomeConfig(cfg);

        const pathSlug =
          typeof window !== 'undefined'
            ? window.location.pathname.replace(/^\/+|\/+$/g, '')
            : '';

        if (/^[a-z0-9]{6}$/i.test(pathSlug)) {
          const invite = await fetchWelcomeInvite(pathSlug);
          if (!active) return;
          if (invite) {
            setWelcomeStudentName(invite.name);
            setShowWelcomeIntro(true);
            const openKey = `itreal_invite_opened_${invite.id}`;
            if (typeof sessionStorage === 'undefined' || !sessionStorage.getItem(openKey)) {
              if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(openKey, '1');
              recordInviteOpened(invite.id);
            }
          }
          setResolvingInvite(false);
          return;
        }

        const forced = typeof window !== 'undefined' && window.location.search.includes('intro=1');
        if (!forced && cfg.enabledOnEntry) {
          const alreadySeen =
            cfg.showOncePerSession !== false &&
            typeof sessionStorage !== 'undefined' &&
            sessionStorage.getItem('itreal_welcome_seen') === '1';
          if (!alreadySeen) {
            setShowWelcomeIntro(true);
          }
        }
      } catch (err) {
        console.warn('Could not initialize welcome intro:', err);
      } finally {
        if (active) setResolvingInvite(false);
      }
    };
    initWelcome();
    return () => { active = false; };
  }, []);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (userStats?.xp !== undefined) {
      const currentLevel = calculateLevel(userStats.xp);
      if (prevLevelRef.current !== null && currentLevel > prevLevelRef.current) {
        setShowCelebration(true);
      }
      prevLevelRef.current = currentLevel;
    }
  }, [userStats?.xp]);

  const viewRef = useRef(view);
  const objRef = useRef(selectedObjective);

  // References to active listeners for clean unsubscribes on logout
  const unsubCoursesRef = useRef<(() => void) | null>(null);
  const unsubPdfsRef = useRef<(() => void) | null>(null);
  const unsubStatsRef = useRef<(() => void) | null>(null);
  const unsubObjectivesRef = useRef<(() => void) | null>(null);
  const unsubTasksRef = useRef<(() => void) | null>(null);
  const unsubTestResultsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    viewRef.current = view;
    objRef.current = selectedObjective;
  }, [view, selectedObjective]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const currentView = viewRef.current;
      const currentObj = objRef.current;

      if (currentObj) {
        setSelectedObjective(null);
      } else if (currentView !== 'dashboard' && currentView !== 'landing') {
        setView('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Push state when navigating away from dashboard so back button works
  useEffect(() => {
    if (view !== 'landing' && view !== 'dashboard') {
      window.history.pushState({ view }, '');
    }
  }, [view]);

  useEffect(() => {
    if (selectedObjective) {
      window.history.pushState({ objective: selectedObjective.id }, '');
    }
  }, [selectedObjective]);

  // Always reset scroll to top when opening any new tab, view, course, or objective
  useEffect(() => {
    scrollToTop();
  }, [view, activeCourse, selectedObjective, unlockTargetCourse]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          // Fetch or create user stats
          const userRef = doc(db, 'users', firebaseUser.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (fetchErr) {
            console.warn("User stats initial fetch warning, retrying:", fetchErr);
            await new Promise(r => setTimeout(r, 600));
            userSnap = await getDoc(userRef).catch(() => null);
          }
          
          if (userSnap && userSnap.exists()) {
            const existingStats = userSnap.data() as UserStats;
            let loadedStats = existingStats;
            
            // Check if user is an admin account (e.g. admin@itreal.co.za or admin@...)
            const isAdminEmail = Boolean(
              firebaseUser.email && (
                firebaseUser.email.toLowerCase().startsWith('admin@') ||
                firebaseUser.email.toLowerCase().includes('admin') ||
                firebaseUser.email === 'admin@itreal.co.za' ||
                firebaseUser.email === 'admin@itreal.io'
              )
            );

            if (isAdminEmail && loadedStats.role !== 'admin') {
              loadedStats = { ...loadedStats, role: 'admin' };
              await setDoc(userRef, { role: 'admin' }, { merge: true }).catch(() => {});
            }

            // Retroactively update displayName if it's 'Anonymous' and we have an email
            if (existingStats.displayName === 'Anonymous' && firebaseUser.email) {
              const extractedName = firebaseUser.email.split('@')[0];
              const updatedStats = { ...loadedStats, displayName: extractedName };
              await setDoc(userRef, updatedStats, { merge: true }).catch(() => {});
              loadedStats = updatedStats;
            }
            setUserStats(loadedStats);
            try {
              await syncLeaderboard(loadedStats);
            } catch (err) {
              console.warn("Failed to sync leaderboard for existing user:", err);
            }
          } else {
            // Extract display name from email if not provided
            const extractedName = firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Anonymous';
            const finalDisplayName = firebaseUser.displayName || extractedName;

            const isAdminEmail = Boolean(
              firebaseUser.email && (
                firebaseUser.email.toLowerCase().startsWith('admin@') ||
                firebaseUser.email.toLowerCase().includes('admin') ||
                firebaseUser.email === 'admin@itreal.co.za' ||
                firebaseUser.email === 'admin@itreal.io'
              )
            );

            // Initialize new user
            const initialStats: UserStats = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: isAdminEmail ? 'Administrator' : finalDisplayName,
              photoURL: firebaseUser.photoURL || null,
              xp: isAdminEmail ? 50000 : 0,
              level: isAdminEmail ? 10 : 0,
              streak: 0,
              completedObjectives: [],
              lastStudyDate: new Date().toISOString(),
              examReadiness: 0,
              mockExamScores: [],
              badges: [],
              activityHistory: [],
              role: isAdminEmail ? 'admin' : 'student',
              unlockedCourses: ['a-plus', 'network-plus', 'matric-to-money'],
              courseProgress: {
                'network-plus': {
                  examReadiness: 0,
                  completedObjectives: []
                }
              }
            };
            await setDoc(userRef, initialStats).catch(err => {
              console.warn("Could not write initial user stats immediately:", err);
            });
            setUserStats(initialStats);
            try {
              await syncLeaderboard(initialStats);
            } catch (err) {
              console.warn("Failed to sync leaderboard for new user:", err);
            }
          }
          setView(prev => (prev === 'landing' ? 'home' : prev));
        } else {
          setUserStats(null);
          setActiveCourse(null);
          setSelectedObjective(null);
          setView('landing');
        }
      } catch (error: any) {
        console.error("Initialization error:", error);
        // If offline or network issue, don't trap the user in a fatal crash screen
        if (error?.message?.includes('offline') || error?.code === 'unavailable') {
          console.warn("Firebase client offline, falling back to public landing view.");
          setUserStats(null);
          setView('landing');
        } else {
          setInitError(error instanceof Error ? error.message : "Failed to connect to the vault.");
        }
      } finally {
        setLoading(false);
      }
    });

    // Timeout to prevent infinite loading if Firebase doesn't respond
    const timeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn("Initialization timed out.");
          return false;
        }
        return prev;
      });
    }, 10000);

    return () => {
      unsubscribeAuth();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Real-time user stats updates
    const unsubStats = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserStats(doc.data() as UserStats);
      }
    }, (error) => console.warn(`Could not listen to users/${user.uid}:`, error));
    unsubStatsRef.current = unsubStats;

    // Fetch user's specific tasks
    const tasksQuery = collection(db, `users/${user.uid}/todo`);
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Todo)));
    }, (error) => console.warn(`Could not listen to users/${user.uid}/todo:`, error));
    unsubTasksRef.current = unsubTasks;

    // Fetch user's specific test results
    const testResultsQuery = collection(db, `users/${user.uid}/testResults`);
    const unsubTests = onSnapshot(testResultsQuery, (snapshot) => {
      setTestResults(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TestResult)));
    }, (error) => console.warn(`Could not listen to users/${user.uid}/testResults:`, error));
    unsubTestResultsRef.current = unsubTests;

    return () => {
      unsubStats();
      unsubTasks();
      unsubTests();
    };
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Real-time objectives updates (only subscribe once authenticated to avoid watch-stream resets on login)
  useEffect(() => {
    if (!user) {
      setObjectives([]);
      return;
    }
    const unsubObjs = onSnapshot(collection(db, 'objectives'), (snapshot) => {
      const objs = snapshot.docs.map(d => {
        const data = d.data();
        const course = data.course || (d.id.includes('_') ? d.id.split('_')[0] : 'a-plus');
        const cleanId = data.id || (d.id.includes('_') ? d.id.slice(course.length + 1) : d.id);
        return {
          ...data,
          id: cleanId,
          docId: d.id,
          course
        } as Objective;
      });
      setObjectives(objs);
    }, (error) => console.warn('Could not load objectives:', error));
    unsubObjectivesRef.current = unsubObjs;
    return () => unsubObjs();
  }, [user]);

  // Real-time objective PDFs metadata map (badges on Content screen - only for authenticated users)
  useEffect(() => {
    if (!user) {
      setPdfMap({});
      return;
    }
    const unsubPdfs = subscribeAllObjectivePdfs((map) => {
      setPdfMap(map);
    });
    unsubPdfsRef.current = unsubPdfs;
    return () => unsubPdfs();
  }, [user]);

  // Real-time courses list from Firestore with fallback
  useEffect(() => {
    const unsubCourses = subscribeCourses((docs) => {
      setCourseDocs(docs);
    });
    unsubCoursesRef.current = unsubCourses;
    return () => unsubCourses();
  }, []);

  // Secure logout handler: unsubscribes all listeners, clears all per-user storage, resets state, terminates DB, reloads root
  const handleSecureLogout = async () => {
    try {
      if (unsubStatsRef.current) unsubStatsRef.current();
      if (unsubObjectivesRef.current) unsubObjectivesRef.current();
      if (unsubTasksRef.current) unsubTasksRef.current();
      if (unsubTestResultsRef.current) unsubTestResultsRef.current();
      if (unsubPdfsRef.current) unsubPdfsRef.current();
      if (unsubCoursesRef.current) unsubCoursesRef.current();

      clearUserStorage();

      setActiveCourse(null);
      setSelectedObjective(null);
      setView('landing');
      setUser(null);
      setUserStats(null);

      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.assign('/');
    }
  };

  // Course guard: If user navigates to a course-specific screen without an active course, redirect to My Courses
  useEffect(() => {
    const courseRequiredViews: ViewState[] = ['dashboard', 'objectives', 'test-center', 'performance'];
    if (user && !activeCourse && courseRequiredViews.includes(view)) {
      setView('my-courses');
    }
  }, [user, activeCourse, view]);

  const handleObjectiveClick = (obj: Objective) => {
    setSelectedObjective(obj);
    if (user) {
      const courseId = obj.course || activeCourse || 'a-plus';
      updateDoc(doc(db, 'users', user.uid), {
        lastOpenedCourse: courseId,
        lastOpenedObjectiveId: obj.id,
        lastOpenedObjectiveTitle: obj.title,
        lastStudyDate: new Date().toISOString()
      }).catch(err => {
        console.warn("Could not save last opened objective progress:", err);
      });
    }
  };

  if (resolvingInvite) {
    return <div className="fixed inset-0 bg-[#03070d]" aria-hidden="true" />;
  }

  if (showWelcomeIntro) {
    return (
      <WelcomeIntro
        studentName={welcomeStudentName}
        buttonLabel={welcomeConfig.buttonLabel}
        href={welcomeConfig.destination === 'custom' && welcomeConfig.href ? welcomeConfig.href : undefined}
        onContinue={() => {
          setShowWelcomeIntro(false);
          try {
            sessionStorage.setItem('itreal_welcome_seen', '1');
            window.history.replaceState({}, '', '/');
          } catch (_) {}
          if (welcomeConfig.destination === 'signup' && !user) {
            setPublicAuthMode('register');
            setView('landing');
          }
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020308] flex flex-col items-center justify-center text-white p-6 text-center relative overflow-hidden">
        <div className="portal-cosmos-bg" aria-hidden="true">
          <div className="portal-ray-primary" />
          <div className="portal-ray-core" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="saas-squircle-outer mb-6 animate-pulse">
            <div className="saas-squircle-inner !w-16 !h-16">
              <img src="/assets/itreal-icon.png" alt="ITreal" className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] font-extrabold saas-gradient-word mb-2">Initializing ITreal Core...</p>
          <p className="text-[11px] text-slate-400 font-medium">Connecting to certification database...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-white/5 p-12 rounded-[3rem] shadow-2xl text-center">
          <div className="text-red-600 font-black text-4xl tracking-tighter italic mb-8">SYSTEM ERROR</div>
          <h1 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Vault Connection Failed</h1>
          <p className="text-gray-500 mb-12 font-medium">We encountered an issue while initializing the core system. This might be due to a network interruption.</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-lg transition-all transform hover:scale-[1.03] flex items-center justify-center gap-3 shadow-2xl"
          >
            RETRY INITIALIZATION
          </button>
        </div>
      </div>
    );
  }

  if (!user || !userStats) {
    if (authLegalModal === 'privacy') {
      return (
        <React.Suspense fallback={null}>
          <PrivacyPolicy onBack={() => setAuthLegalModal(null)} />
        </React.Suspense>
      );
    }
    if (authLegalModal === 'terms') {
      return (
        <React.Suspense fallback={null}>
          <TermsOfUse onBack={() => setAuthLegalModal(null)} />
        </React.Suspense>
      );
    }
    if (showVerification) {
      return (
        <VerificationScreen 
          email={verificationEmail} 
          onLoginClick={() => setShowVerification(false)}
          onRefreshClick={() => window.location.reload()}
        />
      );
    }
    if (publicAuthMode === 'login' || publicAuthMode === 'register') {
      return (
        <AuthScreen 
          initialMode={publicAuthMode}
          onBackToLanding={() => setPublicAuthMode('landing')}
          onVerificationSent={(email) => {
            setVerificationEmail(email);
            setShowVerification(true);
          }} 
          onOpenPrivacy={() => setAuthLegalModal('privacy')}
          onOpenTerms={() => setAuthLegalModal('terms')}
        />
      );
    }
    return (
      <LandingPage 
        onEnter={() => setPublicAuthMode('login')}
        onLogin={() => setPublicAuthMode('login')}
        onRegister={() => setPublicAuthMode('register')}
        onOpenPrivacy={() => setAuthLegalModal('privacy')}
        onOpenTerms={() => setAuthLegalModal('terms')}
      />
    );
  }

  const isDevAdmin = Boolean(
    user?.email && (
      user.email.toLowerCase().startsWith('admin@') ||
      user.email.toLowerCase().includes('admin') ||
      user.email === 'admin@itreal.co.za' ||
      user.email === 'admin@itreal.io'
    )
  );

  if (user && !user.emailVerified && user.providerData[0]?.providerId === 'password' && !isDevAdmin) {
    return (
      <VerificationScreen 
        email={user.email || ''} 
        onLoginClick={() => logout()}
        onRefreshClick={() => window.location.reload()}
      />
    );
  }

  if (userStats?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-6">
        <div className="bg-[#1f1f1f] p-12 rounded-[3rem] border border-red-600/30 text-center max-w-lg w-full shadow-2xl">
          <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShieldAlert className="text-red-600 w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Account <span className="text-red-600">Locked</span></h1>
          <p className="text-gray-400 mb-8">Your account has been suspended by an administrator. Please contact support for more information.</p>
          <button 
            onClick={() => logout()}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors border border-white/10"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const getMergedDomains = (course: CourseId | null = activeCourse) => {
    if (!course) return [];
    const currentConfig = getCourseConfig(course);
    const baseDomains = currentConfig.domains;
    const courseObjectives = filterByCourse(objectives, course);

    // Initial domain buckets preserving base course domains
    const domainsList: Domain[] = baseDomains.map(d => ({
      ...d,
      objectives: [...(d.objectives || [])]
    }));

    courseObjectives.forEach(obj => {
      // Find matching domain by stable ID first, then by title fallback (case-insensitive)
      const targetDomain = domainsList.find(d => 
        d.id === obj.domain || 
        (obj.domain && d.title && d.title.toLowerCase() === obj.domain.toLowerCase())
      );

      if (targetDomain) {
        const existingIdx = targetDomain.objectives.findIndex(o => o.id === obj.id);
        if (existingIdx >= 0) {
          targetDomain.objectives[existingIdx] = obj;
        } else {
          targetDomain.objectives.push(obj);
        }
      } else {
        // Fallback: objective refers to an undeclared domain name/id, create an entry
        const fallbackTitle = obj.domain || 'Core Domain';
        let extra = domainsList.find(d => d.id === fallbackTitle || d.title === fallbackTitle);
        if (!extra) {
          extra = {
            id: fallbackTitle.toLowerCase().replace(/\s+/g, '-'),
            title: fallbackTitle,
            exam: obj.exam,
            course: course,
            objectives: []
          };
          domainsList.push(extra);
        }
        const existingIdx = extra.objectives.findIndex(o => o.id === obj.id);
        if (existingIdx >= 0) {
          extra.objectives[existingIdx] = obj;
        } else {
          extra.objectives.push(obj);
        }
      }
    });

    return domainsList.map(d => ({
      ...d,
      objectivesCount: d.objectives.length
    }));
  };

  const renderContent = () => {
    const activeCourseId = activeCourse || 'a-plus';
    const mergedDomains = activeCourse ? getMergedDomains(activeCourse) : [];
    const currentCourseConfig = getCourseConfig(activeCourseId);
    const courseProg = activeCourse ? getCourseProgress(userStats, activeCourse) : { examReadiness: 0, completedObjectives: [] };
    const isAdmin = userStats?.role === 'admin' || (userStats as any)?.isAdmin;

    // Filter courses visible to this user
    // Students only see published courses; admins also see draft courses (and can inspect archived in admin hub)
    const visibleCourseDocs = courseDocs.filter(c => {
      if (isAdmin) return c.status !== 'archived';
      return c.status === 'published';
    });
    const dynamicCourseList = visibleCourseDocs.length > 0 
      ? visibleCourseDocs.map(courseDocToConfig) 
      : COURSE_LIST;

    const currentCourseDoc = courseDocs.find(c => c.id === activeCourse);
    const requiresCode = currentCourseDoc ? currentCourseDoc.requiresCode : (activeCourse === 'network-plus');
    const isCurrentCourseUnlocked = isAdmin || activeCourse === 'a-plus' || !requiresCode || isCourseUnlocked(userStats, activeCourse, requiresCode);

    // If an unlock target is set from My Courses or elsewhere, show the unlock screen
    if (unlockTargetCourse) {
      return (
        <CourseUnlockScreen 
          course={unlockTargetCourse} 
          userStats={userStats} 
          onUnlocked={() => {
            setActiveCourse(unlockTargetCourse);
            setUnlockTargetCourse(null);
            setView('dashboard');
          }} 
          onBackToAPlus={() => {
            setUnlockTargetCourse(null);
            setView('my-courses');
          }} 
        />
      );
    }

    // If student attempts to access a locked course, show the unlock screen (admins are never blocked)
    if (view !== 'landing' && view !== 'admin' && view !== 'profile' && view !== 'my-courses' && !isCurrentCourseUnlocked) {
      return (
        <CourseUnlockScreen 
          course={activeCourse} 
          userStats={userStats} 
          onUnlocked={() => {
            setView('dashboard');
          }} 
          onBackToAPlus={() => {
            setActiveCourse('a-plus');
            setView('my-courses');
          }} 
        />
      );
    }

    switch (view) {
      case 'landing':
        return (
          <LandingPage 
            userName={userStats.displayName} 
            onEnter={() => setView('home')} 
            onOpenPrivacy={() => setView('privacy-policy')}
            onOpenTerms={() => setView('terms-of-use')}
          />
        );
      case 'home':
        return (
          <HomePage
            userStats={userStats}
            courseDocs={visibleCourseDocs}
            allObjectives={objectives}
            onNavigate={setView}
            onResumeLearning={(courseId, obj) => {
              setActiveCourse(courseId);
              if (obj) {
                handleObjectiveClick(obj);
              } else {
                setView('dashboard');
              }
            }}
          />
        );
      case 'dashboard':
        return <Dashboard domains={mergedDomains} stats={userStats} onObjectiveClick={handleObjectiveClick} onViewChange={setView} activeCourse={activeCourse || 'a-plus'} />;
      case 'test-center':
        return <TestCenter userStats={userStats} onBack={() => setView('dashboard')} activeCourse={activeCourse || 'a-plus'} />;
      case 'performance':
        return <Performance stats={userStats} onBack={() => setView('dashboard')} activeCourse={activeCourse || 'a-plus'} />;
      case 'leaderboard':
        return <LeaderboardView stats={userStats} onBack={() => setView(activeCourse ? 'dashboard' : 'home')} />;
      case 'gallery':
        return <MyGallery userStats={userStats} onBack={() => setView(activeCourse ? 'dashboard' : 'home')} />;
      case 'my-courses':
        return (
          <MyCoursesView
            userStats={userStats}
            activeCourse={activeCourse || 'a-plus'}
            courses={dynamicCourseList}
            courseDocs={visibleCourseDocs}
            onSelectCourse={(courseId) => {
              setActiveCourse(courseId);
            }}
            onOpenUnlockScreen={(courseId) => {
              setUnlockTargetCourse(courseId);
            }}
            onNavigateToDashboard={() => setView('dashboard')}
          />
        );
      case 'profile':
        return (
          <Profile 
            stats={userStats} 
            onLogout={handleSecureLogout} 
            onBack={() => setView(activeCourse ? 'dashboard' : 'home')} 
            onOpenPrivacy={() => setView('privacy-policy')}
            onOpenTerms={() => setView('terms-of-use')}
          />
        );
      case 'privacy-policy':
        return <PrivacyPolicy onBack={() => setView(activeCourse ? 'dashboard' : 'home')} />;
      case 'terms-of-use':
        return <TermsOfUse onBack={() => setView(activeCourse ? 'dashboard' : 'home')} />;
      case 'admin':
        return (
          <AdminRoute userStats={userStats}>
            <AdminDashboard onBack={() => setView(activeCourse ? 'dashboard' : 'home')} initialCourse={activeCourse || 'a-plus'} />
          </AdminRoute>
        );
      case 'subnet-speed-run':
        return <SubnetSpeedRun userStats={userStats} onBack={() => setView('dashboard')} />;
      case 'match-the-trio':
        return <MatchTheTrio userStats={userStats} onBack={() => setView('dashboard')} />;
      case 'cli-challenge':
        return <CommandLineChallenge userStats={userStats} onBack={() => setView('dashboard')} />;
      case 'motherboard-puzzle':
        return <MotherboardPuzzle userStats={userStats} onBack={() => setView('dashboard')} />;
      case 'path-finder':
        return <PathFinder userStats={userStats} onBack={() => setView('dashboard')} />;
      case 'acronym-attack':
        return <AcronymAttack userStats={userStats} onBack={() => setView('dashboard')} />;
      case 'cv-clinic':
        return <CVClinicGame userStats={userStats} onBack={() => setView('dashboard')} activeCourse={activeCourse || 'matric-to-money'} />;
      case 'contract-red-flags':
        return <ContractRedFlagsGame userStats={userStats} onBack={() => setView('dashboard')} activeCourse={activeCourse || 'matric-to-money'} />;
      case 'objectives': {
        const totalCourseObjs = mergedDomains.reduce((acc, d) => acc + d.objectives.length, 0);
        return (
          <div className="p-6 md:p-12 lg:p-16 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-300">
            {/* Top Hero Section */}
            <div className="saas-hero-card rounded-[2rem] text-white p-8 md:p-12">
              <div className="portal-ray-core" />
              <NetworkBackdrop accentColor={currentCourseConfig.accentHex} />
              <GradientDrift primaryColor={currentCourseConfig.accentHex} secondaryColor="#818cf8" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <span 
                    className="text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border inline-flex items-center gap-1.5 mb-3 shadow-sm backdrop-blur-md"
                    style={{
                      backgroundColor: `${currentCourseConfig.accentHex}22`,
                      color: '#E0E7FF',
                      borderColor: `${currentCourseConfig.accentHex}55`
                    }}
                  >
                    <Sparkles size={11} className="text-indigo-300" />
                    {currentCourseConfig.name} ({currentCourseConfig.badgeLabel})
                  </span>
                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                    Course <span className="saas-gradient-word">Content</span>
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-white/[0.04] border border-indigo-300/20 px-4 py-2 rounded-full backdrop-blur-md">
                  Completed: <span className="text-indigo-300 font-black">{courseProg.completedObjectives.length}</span> / {totalCourseObjs}
                </div>
              </div>
            </div>
            {totalCourseObjs === 0 ? (
              <div className="saas-glass-card rounded-3xl p-16 text-center flex flex-col items-center justify-center space-y-4">
                <div className="saas-squircle-outer">
                  <div className="saas-squircle-inner">
                    <BookOpen size={20} />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight">
                  No content available yet
                </h3>
                <p className="text-[var(--text-muted)] text-sm max-w-md">
                  Objectives and training modules for {currentCourseConfig.name} will appear here once added in the Admin Hub.
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {mergedDomains.map(domain => (
                  <div key={domain.id} className="space-y-6">
                    <h2 className="text-xl md:text-2xl font-extrabold text-[var(--text-main)] tracking-tight border-b border-[var(--border-color)] pb-4 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_#818cf8]" />
                      {domain.title}
                    </h2>
                    {domain.objectives.length > 0 ? (
                      <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {domain.objectives.map((obj, oIdx) => {
                          const isCompleted = courseProg.completedObjectives.includes(obj.id);
                          const hasInteractive = Boolean(obj.interactiveLesson || getInteractiveLesson(currentCourseConfig.id, obj.id, obj.domain || domain.title || domain.id));
                          const hasPdf = Boolean(getPdfForObjective(pdfMap, currentCourseConfig.id, obj.id));
                          const objImage = getObjectiveImage(domain.id, oIdx);
                          return (
                            <div 
                              key={obj.id} 
                              onClick={() => handleObjectiveClick(obj)} 
                              className={`saas-glass-card rounded-3xl cursor-pointer group flex flex-col h-full relative overflow-hidden ${
                                isCompleted 
                                  ? '!border-emerald-500/45 shadow-emerald-500/10' 
                                  : ''
                              }`}
                            >
                              {/* 16:9 Photographic Objective Banner */}
                              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                                <img 
                                  src={objImage} 
                                  alt={obj.title} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d19] via-transparent to-black/50" />
                                
                                {/* Floating Badges on Banner */}
                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                                  <span 
                                    className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border"
                                    style={{
                                      backgroundColor: `${currentCourseConfig.accentHex}30`,
                                      color: '#ffffff',
                                      borderColor: `${currentCourseConfig.accentHex}60`
                                    }}
                                  >
                                    {obj.id}
                                  </span>
                                  {isCompleted ? (
                                    <span className="w-6 h-6 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-md">
                                      <CheckCircle2 size={14} />
                                    </span>
                                  ) : hasInteractive ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-950/80 backdrop-blur-md text-indigo-300 border border-indigo-400/40 flex items-center gap-1 shadow-md">
                                      <Sparkles size={10} /> 3D & Labs
                                    </span>
                                  ) : hasPdf ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/40">
                                      PDF
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              {/* Card Body */}
                              <div className="p-5 flex-1 flex flex-col justify-between">
                                <h3 className="text-sm font-bold mb-3 tracking-tight leading-snug line-clamp-2 text-[var(--text-main)] group-hover:text-indigo-300 transition-colors">
                                  {obj.title}
                                </h3>

                                <div className="mt-auto pt-3 flex items-center justify-between border-t border-[var(--border-color)]">
                                  {/* Material / Interactive marker */}
                                  <div>
                                    {hasInteractive ? (
                                      <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/30 inline-flex items-center gap-1">
                                        <Sparkles size={10} /> Interactive Lab
                                      </span>
                                    ) : hasPdf ? (
                                      <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                                        <FileText size={10} /> PDF Ready
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[var(--text-muted)] border border-[var(--border-color)] inline-flex items-center gap-1">
                                        No material
                                      </span>
                                    )}
                                  </div>


                                  <div className="flex items-center gap-1 text-[var(--text-main)] font-bold text-[10px] uppercase tracking-wider group-hover:text-indigo-300 transition-colors">
                                    <span>{isCompleted ? 'Review' : 'Open'}</span> 
                                    <ChevronRight size={13} className="text-indigo-400" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </Stagger>
                    ) : (
                      <div className="p-8 saas-glass-card rounded-3xl text-center text-[var(--text-muted)] text-xs uppercase tracking-wider font-bold">
                        {currentCourseConfig.shortLabel} domain initialized • Objectives content will be added soon
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      default:
        return <div className="flex items-center justify-center h-full text-gray-500 uppercase font-black tracking-widest">Module under construction</div>;
    }
  };

  return (
    <div key={user?.uid || 'guest'} className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] relative transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
      {/* Persistent Dark SaaS Volumetric Rays & Starfield Atmosphere for Portal Views */}
      {view !== 'landing' && (
        <div className="portal-cosmos-bg" aria-hidden="true">
          <div className="portal-ray-primary" />
          <div className="portal-ray-core" />
          <div className="portal-star-grid" />
        </div>
      )}

      {view !== 'landing' && (
        <Sidebar 
          currentView={view} 
          setView={setView} 
          userStats={userStats}
          onLogout={handleSecureLogout}
          activeCourse={activeCourse}
          onSelectCourse={(course) => setActiveCourse(course)}
          isOpenMobile={showMobileMenu}
          onCloseMobile={() => setShowMobileMenu(false)}
        />
      )}
      
      {view !== 'landing' && (
        <nav className={`fixed top-0 left-0 min-[900px]:left-64 right-0 h-20 flex items-center justify-between px-4 sm:px-8 z-30 transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#060813]/85 backdrop-blur-2xl border-b border-indigo-300/[0.14] shadow-[0_14px_40px_rgba(0,0,0,0.65)]' 
            : 'bg-[#060813]/65 backdrop-blur-xl border-b border-indigo-300/[0.09]'
        }`}>
          {/* Top Subtle Rim Specular Line */}
          <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent pointer-events-none" />

          {/* Left: Mobile hamburger menu & Welcome Greeting & Active Course Chip */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button 
              type="button"
              onClick={() => setShowMobileMenu(true)}
              className="min-[900px]:hidden p-2.5 bg-white/[0.05] border border-indigo-300/20 rounded-2xl text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer shadow-sm"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>

            <img 
              src="/assets/itreal-icon.png" 
              alt="ITreal" 
              className="w-7 h-7 object-contain min-[900px]:hidden shrink-0 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
            />

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
              <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Welcome back, <span className="saas-gradient-word font-extrabold">{userStats?.displayName ? userStats.displayName.trim().split(' ')[0] : 'Student'}</span>
              </span>

              {/* Small non-clickable active course chip (only shown when a course is active and not on Home) */}
              {activeCourse && view !== 'home' && (() => {
                const config = getCourseConfig(activeCourse);
                return (
                  <div 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border select-none shrink-0 backdrop-blur-md"
                    style={{
                      backgroundColor: 'rgba(79, 70, 229, 0.16)',
                      color: '#C7D2FE',
                      borderColor: 'rgba(165, 180, 252, 0.32)',
                      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.16)'
                    }}
                    title={`Active course: ${config.name}`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full animate-pulse" 
                      style={{ backgroundColor: '#818CF8', boxShadow: '0 0 8px #818CF8' }}
                    />
                    <span>{config.name}</span>
                  </div>
                );
              })()}
            </div>
          </div>
          
          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <ThemeToggle />
            <div 
              onClick={() => {
                setView('profile');
                scrollToTop();
              }}
              className="flex items-center gap-2.5 cursor-pointer group bg-white/[0.05] hover:bg-indigo-500/15 pr-3.5 pl-1.5 py-1 rounded-full border border-indigo-300/20 hover:border-indigo-400/50 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              title="Go to profile"
            >
              {userStats?.photoURL ? (
                <img src={userStats.photoURL} alt={userStats.displayName || 'Profile'} className="w-8 h-8 rounded-full object-cover border border-indigo-300/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-indigo-700 border border-indigo-300/40 flex items-center justify-center font-bold text-xs text-white shadow-[0_0_14px_rgba(79,70,229,0.5)]">
                  {(userStats?.displayName ? userStats.displayName.trim()[0] : 'S').toUpperCase()}
                </div>
              )}
              <span className="text-xs font-bold tracking-wide text-slate-300 group-hover:text-white hidden md:inline">
                {userStats?.role === 'admin' ? 'Admin' : userStats?.displayName ? userStats.displayName.trim().split(' ')[0] : 'Profile'}
              </span>
            </div>
          </div>
        </nav>
      )}

      <main className={`${view !== 'landing' ? 'min-[900px]:pl-64 pl-0 pt-20 relative z-10' : ''} min-h-screen transition-all duration-200`}>
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        }>
          <div
            key={view + (activeCourse || '')}
            className="animate-in fade-in duration-200"
          >
            {renderContent()}
          </div>
        </React.Suspense>
      </main>

      {showCelebration && (
        <RankCelebration onComplete={() => setShowCelebration(false)} />
      )}

      {selectedObjective && (
        <LessonRenderer 
          objective={selectedObjective} 
          userStats={userStats}
          onBack={() => setSelectedObjective(null)} 
          activeCourse={activeCourse || 'a-plus'}
        />
      )}
    </div>
  );
};

export default App;
