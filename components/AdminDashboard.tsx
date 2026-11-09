import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Search,
  Loader2,
  Database,
  HelpCircle,
  ArrowLeft,
  Sword,
  Gamepad2,
  Link as LinkIcon,
  FileText,
  GraduationCap,
  Home as HomeIcon,
  Globe,
  Award,
  UserCheck
} from 'lucide-react';
import { db, storage, OperationType, handleFirestoreError } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { UserStats, Objective, WeeklyBossChallenge, WeeklyBossSubmission, MinigameLeaderboard, MatchMakerHighscore, CliLeaderboard, TestQuestion, ExternalLink, CourseId, CourseDoc } from '../types';
import { filterByCourse, COURSE_LIST, getCourseConfig } from '../courseConfig';
import { subscribeCourses, courseDocToConfig } from '../coursesService';
import { motion, AnimatePresence } from 'motion/react';
import { scrollToTop } from '../scrollUtils';

import AdminStudentsTab from './admin/AdminStudentsTab';
import AdminObjectivesTab from './admin/AdminObjectivesTab';
import AdminQuestionsTab from './admin/AdminQuestionsTab';
import AdminStatsTab from './admin/AdminStatsTab';
import AdminBossTab from './admin/AdminBossTab';
import AdminArcadeTab from './admin/AdminArcadeTab';
import AdminLinksTab from './admin/AdminLinksTab';
import AdminCoursesTab from './admin/AdminCoursesTab';
import AdminHomeContentTab from './admin/AdminHomeContentTab';
import AdminLandingTab from './admin/AdminLandingTab';
import AdminChallengesTab from './admin/AdminChallengesTab';
import AdminAvatarsTab from './admin/AdminAvatarsTab';
import ConfirmDeleteModal from './admin/ConfirmDeleteModal';

interface AdminDashboardProps {
  onBack: () => void;
  initialCourse?: CourseId;
}

export type AdminTabType = 'courses' | 'objectives' | 'users' | 'avatars' | 'challenges' | 'questions' | 'stats' | 'boss' | 'arcade' | 'links' | 'home-content' | 'landing';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, initialCourse }) => {
  const [adminCourse, setAdminCourse] = useState<CourseId>(initialCourse || 'a-plus');
  const [activeTab, setActiveTab] = useState<AdminTabType>('objectives');
  const [courseDocs, setCourseDocs] = useState<CourseDoc[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [bossChallenges, setBossChallenges] = useState<WeeklyBossChallenge[]>([]);
  const [bossSubmissions, setBossSubmissions] = useState<WeeklyBossSubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<MinigameLeaderboard[]>([]);
  const [trioLeaderboard, setTrioLeaderboard] = useState<MatchMakerHighscore[]>([]);
  const [cliLeaderboard, setCliLeaderboard] = useState<CliLeaderboard[]>([]);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingObjective, setEditingObjective] = useState<Partial<Objective> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'question' | 'objective' | 'link'; title: string } | null>(null);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  // Auto-dismiss admin feedback notification after 4 seconds
  useEffect(() => {
    if (!adminFeedback) return;
    const timer = setTimeout(() => {
      setAdminFeedback(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [adminFeedback]);

  // Always reset scroll to top when switching admin tabs or managing courses
  useEffect(() => {
    scrollToTop();
  }, [activeTab, adminCourse]);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserStats)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

    const unsubscribeObjectives = onSnapshot(collection(db, 'objectives'), (snapshot) => {
      setObjectives(snapshot.docs.map(d => {
        const data = d.data();
        const course = data.course || (d.id.includes('_') ? d.id.split('_')[0] : 'a-plus');
        const cleanId = data.id || (d.id.includes('_') ? d.id.slice(course.length + 1) : d.id);
        return {
          ...data,
          id: cleanId,
          docId: d.id,
          course
        } as Objective;
      }));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'objectives'));

    const unsubscribeBosses = onSnapshot(collection(db, 'boss_challenges'), (snapshot) => {
      setBossChallenges(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WeeklyBossChallenge)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'boss_challenges'));

    const unsubscribeSubmissions = onSnapshot(collection(db, 'boss_submissions'), (snapshot) => {
      setBossSubmissions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WeeklyBossSubmission)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'boss_submissions'));

    const unsubscribeLeaderboard = onSnapshot(collection(db, 'minigame_leaderboard'), (snapshot) => {
      setLeaderboard(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MinigameLeaderboard)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'minigame_leaderboard'));

    const unsubscribeTrioLeaderboard = onSnapshot(collection(db, 'matchMaker_highscores'), (snapshot) => {
      setTrioLeaderboard(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MatchMakerHighscore)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'matchMaker_highscores'));

    const unsubscribeCliLeaderboard = onSnapshot(collection(db, 'cli_leaderboard'), (snapshot) => {
      setCliLeaderboard(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CliLeaderboard)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'cli_leaderboard'));

    const unsubscribeTestQuestions = onSnapshot(collection(db, 'test_questions'), (snapshot) => {
      setTestQuestions(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TestQuestion)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'test_questions'));

    const unsubscribeLinks = onSnapshot(collection(db, 'external_links'), (snapshot) => {
      setExternalLinks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExternalLink)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'external_links'));

    const unsubscribeCourses = subscribeCourses((docs) => {
      setCourseDocs(docs);
    });

    return () => {
      unsubscribeCourses();
      unsubscribeUsers();
      unsubscribeObjectives();
      unsubscribeBosses();
      unsubscribeSubmissions();
      unsubscribeLeaderboard();
      unsubscribeTrioLeaderboard();
      unsubscribeCliLeaderboard();
      unsubscribeTestQuestions();
      unsubscribeLinks();
    };
  }, []);

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      let collectionName = '';
      if (confirmDelete.type === 'question') {
        collectionName = 'test_questions';
        const qToDelete = testQuestions.find(q => q.id === confirmDelete.id);
        if (qToDelete?.imagePath) {
          try {
            await deleteObject(ref(storage, qToDelete.imagePath));
          } catch (e) {
            console.warn('Failed to delete question image from storage:', e);
          }
        }
      }
      else if (confirmDelete.type === 'objective') collectionName = 'objectives';
      else if (confirmDelete.type === 'link') collectionName = 'external_links';
      
      await deleteDoc(doc(db, collectionName, confirmDelete.id));
      
      // If deleting an objective with a course-prefixed doc ID (e.g. "a-plus_1.1"), also attempt cleanup of legacy "1.1"
      if (confirmDelete.type === 'objective' && confirmDelete.id.includes('_')) {
        const rawId = confirmDelete.id.split('_').slice(1).join('_');
        if (rawId) {
          try {
            await deleteDoc(doc(db, 'objectives', rawId));
          } catch {}
        }
      }

      if (confirmDelete.type === 'objective') {
        setEditingObjective(null);
      }
      
      setConfirmDelete(null);
      setAdminFeedback(`${confirmDelete.type} deleted successfully!`);
      setTimeout(() => setAdminFeedback(null), 3000);
    } catch (error) {
      const collectionName = confirmDelete.type === 'question' ? 'test_questions' : confirmDelete.type === 'objective' ? 'objectives' : 'external_links';
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${confirmDelete.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 lg:p-20 max-w-7xl mx-auto min-h-screen text-[var(--text-main)] transition-colors">
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors uppercase font-black tracking-widest text-xs"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div>
          <div 
            className="flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.3em] mb-4"
            style={{ color: getCourseConfig(adminCourse).accentHex }}
          >
            <Database size={14} /> System Core
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-[var(--text-main)]">
            Admin <span style={{ color: getCourseConfig(adminCourse).accentHex }}>Hub</span>
          </h1>
        </div>

        {/* Dynamic Course Switch */}
        <div className="flex items-center gap-3 bg-[var(--bg-surface)] p-2 rounded-2xl border border-[var(--border-color)]">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] pl-2">
            Managing:
          </span>
          <div className="flex bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)] gap-1 flex-wrap">
            {(courseDocs.length > 0 ? courseDocs.map(courseDocToConfig) : COURSE_LIST).map((c) => {
              const isSelected = adminCourse === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setAdminCourse(c.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected
                      ? 'text-white shadow-lg'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                  style={isSelected ? { backgroundColor: c.accentHex, boxShadow: `0 8px 16px ${c.accentHex}40` } : undefined}
                >
                  {c.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Course Managing Banner */}
      {(() => {
        const curConfig = getCourseConfig(adminCourse);
        return (
          <div 
            className="mb-8 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-all"
            style={{
              backgroundColor: `${curConfig.accentHex}15`,
              borderColor: `${curConfig.accentHex}40`,
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full animate-ping"
                style={{ backgroundColor: curConfig.accentHex }}
              />
              <span className="text-sm md:text-base font-black uppercase tracking-widest text-[var(--text-main)]">
                Managing: <span style={{ color: curConfig.accentHex }}>{curConfig.name}</span>
              </span>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              All actions, items & materials are automatically saved to {curConfig.name}
            </span>
          </div>
        );
      })()}

      {/* Tabs Navigation */}
      <div className="flex bg-[var(--bg-card)] p-1.5 rounded-2xl border border-[var(--border-color)] flex-wrap gap-1 mb-10 shadow-sm">
        {[
          { id: 'courses', icon: GraduationCap, label: 'Courses' },
          { id: 'objectives', icon: BookOpen, label: 'Objectives' },
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'avatars', icon: UserCheck, label: 'Avatars & Cards' },
          { id: 'challenges', icon: Award, label: 'Challenges' },
          { id: 'questions', icon: HelpCircle, label: 'Questions' },
          { id: 'stats', icon: TrendingUp, label: 'Analytics' },
          { id: 'boss', icon: Sword, label: 'Boss' },
          { id: 'arcade', icon: Gamepad2, label: 'Arcade' },
          { id: 'links', icon: LinkIcon, label: 'Links' },
          { id: 'home-content', icon: HomeIcon, label: 'Home Content' },
          { id: 'landing', icon: Globe, label: 'Landing' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              scrollToTop();
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)]'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'objectives' && activeTab !== 'courses' && activeTab !== 'home-content' && activeTab !== 'landing' && (
        <div className="relative mb-12">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl py-4 md:py-5 pl-16 pr-8 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-colors font-medium shadow-sm"
          />
        </div>
      )}

        <AnimatePresence mode="wait">
          {activeTab === 'courses' && (
          <AdminCoursesTab 
            key="courses-tab"
            courses={courseDocs}
            allObjectives={objectives}
            setAdminFeedback={setAdminFeedback}
            onSelectManagingCourse={(courseId) => {
              setAdminCourse(courseId);
              setActiveTab('objectives');
            }}
          />
        )}

        {activeTab === 'users' && (
          <AdminStudentsTab 
            key={`users-${adminCourse}`}
            course={adminCourse}
            users={users} 
            searchTerm={searchTerm} 
            setAdminFeedback={setAdminFeedback} 
          />
        )}

        {activeTab === 'avatars' && (
          <AdminAvatarsTab
            key="avatars-tab"
            setAdminFeedback={setAdminFeedback}
          />
        )}

        {activeTab === 'challenges' && (
          <AdminChallengesTab
            key="challenges-tab"
            users={users}
            setAdminFeedback={setAdminFeedback}
          />
        )}

        {activeTab === 'objectives' && (
          <AdminObjectivesTab 
            key={`objectives-${adminCourse}`}
            course={adminCourse}
            courses={courseDocs}
            onNavigateToCourses={() => setActiveTab('courses')}
            objectives={filterByCourse(objectives, adminCourse)} 
            onDeleteObjective={(id, title) => setConfirmDelete({ id, type: 'objective', title })} 
            setAdminFeedback={setAdminFeedback}
            editingObjective={editingObjective}
            setEditingObjective={setEditingObjective}
          />
        )}

        {activeTab === 'questions' && (
          <AdminQuestionsTab 
            key={`questions-${adminCourse}`}
            course={adminCourse}
            courses={courseDocs}
            onNavigateToCourses={() => setActiveTab('courses')}
            testQuestions={filterByCourse(testQuestions, adminCourse)} 
            onDeleteQuestion={(id, text) => setConfirmDelete({ id, type: 'question', title: text })} 
            setAdminFeedback={setAdminFeedback} 
          />
        )}

        {activeTab === 'stats' && (
          <AdminStatsTab 
            key={`stats-${adminCourse}`}
            course={adminCourse}
            users={users} 
            objectives={filterByCourse(objectives, adminCourse)} 
            setAdminFeedback={setAdminFeedback} 
          />
        )}

        {activeTab === 'boss' && (
          <AdminBossTab 
            key={`boss-${adminCourse}`}
            course={adminCourse}
            bossChallenges={filterByCourse(bossChallenges, adminCourse)} 
            bossSubmissions={filterByCourse(bossSubmissions, adminCourse)} 
            setAdminFeedback={setAdminFeedback} 
          />
        )}

        {activeTab === 'arcade' && (
          <AdminArcadeTab 
            key={`arcade-${adminCourse}`}
            course={adminCourse}
            trioLeaderboard={trioLeaderboard} 
            leaderboard={leaderboard} 
            cliLeaderboard={cliLeaderboard} 
            setAdminFeedback={setAdminFeedback}
          />
        )}

        {activeTab === 'links' && (
          <AdminLinksTab 
            key={`links-${adminCourse}`}
            course={adminCourse}
            externalLinks={filterByCourse(externalLinks, adminCourse)} 
            searchTerm={searchTerm} 
            onDeleteLink={(id, label) => setConfirmDelete({ id, type: 'link', title: label })} 
            setAdminFeedback={setAdminFeedback} 
          />
        )}

        {activeTab === 'home-content' && (
          <AdminHomeContentTab 
            key="home-content-tab"
            courses={courseDocs}
            setAdminFeedback={setAdminFeedback} 
          />
        )}

        {activeTab === 'landing' && (
          <AdminLandingTab key="landing-tab" />
        )}
        </AnimatePresence>

      {/* Admin Feedback Toast */}
      <AnimatePresence>
        {adminFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            onClick={() => setAdminFeedback(null)}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-green-600/40 cursor-pointer flex items-center gap-3 transition-colors select-none"
            title="Click to dismiss"
          >
            <span>{adminFeedback}</span>
            <span className="opacity-75 text-[10px] ml-1 bg-black/20 hover:bg-black/30 rounded-full w-4 h-4 flex items-center justify-center">✕</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal 
        confirmDelete={confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={executeDelete}
      />
    </div>
  );
};

export default AdminDashboard;
