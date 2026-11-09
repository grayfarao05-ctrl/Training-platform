import React, { useState, useEffect } from 'react';
import { UserStats, MinigameLeaderboard, MatchMakerHighscore, CliLeaderboard, ViewState, CourseId } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getCourseConfig, filterByCourse } from '../courseConfig';
import { Gamepad2, Zap, Layers, Timer, Terminal, Network, FileCheck, Scale, FileWarning } from 'lucide-react';
import { motion } from 'motion/react';
import { getGameImage } from '../themeAssets';

interface ArcadeRowProps {
  userStats: UserStats;
  onViewChange: (view: ViewState) => void;
  activeCourse?: CourseId;
}

const ArcadeRow: React.FC<ArcadeRowProps> = ({ userStats, onViewChange, activeCourse = 'a-plus' }) => {
  const courseConfig = getCourseConfig(activeCourse);
  const [speedrunStats, setSpeedrunStats] = useState<{ yourBest: number | null, classBest: number | null, bestUser: string }>({ yourBest: null, classBest: null, bestUser: '' });
  const [trioStats, setTrioStats] = useState<{ yourBest: number | null, classBest: number | null, bestUser: string }>({ yourBest: null, classBest: null, bestUser: '' });
  const [cliStats, setCliStats] = useState<{ yourBest: number | null, classBest: number | null, bestUser: string }>({ yourBest: null, classBest: null, bestUser: '' });
  const [pathFinderStats, setPathFinderStats] = useState<{ yourBest: number | null, classBest: number | null, bestUser: string }>({ yourBest: null, classBest: null, bestUser: '' });
  const [acronymStats, setAcronymStats] = useState<{ yourBest: number | null, classBest: number | null, bestUser: string }>({ yourBest: null, classBest: null, bestUser: '' });
  const [cvClinicStats, setCvClinicStats] = useState<{ yourBest: number | null, classBest: number | null, bestUser: string }>({ yourBest: null, classBest: null, bestUser: '' });
  const [publishedCvCasesCount, setPublishedCvCasesCount] = useState<number>(0);
  const [contractStats, setContractStats] = useState<{ yourBest: number | null, classBest: number | null, bestUser: string }>({ yourBest: null, classBest: null, bestUser: '' });
  const [publishedContractCasesCount, setPublishedContractCasesCount] = useState<number>(0);

  useEffect(() => {
    const q = query(collection(db, 'minigame_leaderboard'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawEntries = snapshot.docs.map(doc => doc.data() as MinigameLeaderboard);
      const entries = filterByCourse(rawEntries, activeCourse);
      
      // Subnet Speed-Run Stats (Highest Score is Best)
      const speedrunEntries = entries.filter(e => e.gameId === 'subnet-speed-run');
      const mySpeedrun = speedrunEntries.filter(e => e.uid === userStats.uid).sort((a, b) => b.score - a.score)[0];
      const bestSpeedrun = speedrunEntries.sort((a, b) => b.score - a.score)[0];

      setSpeedrunStats({
        yourBest: mySpeedrun ? mySpeedrun.score : null,
        classBest: bestSpeedrun ? bestSpeedrun.score : null,
        bestUser: bestSpeedrun ? bestSpeedrun.username : ''
      });

      // Path Finder Stats (Highest Score is Best)
      const pathFinderEntries = entries.filter(e => e.gameId === 'path-finder');
      const myPathFinder = pathFinderEntries.filter(e => e.uid === userStats.uid).sort((a, b) => b.score - a.score)[0];
      const bestPathFinder = pathFinderEntries.sort((a, b) => b.score - a.score)[0];

      setPathFinderStats({
        yourBest: myPathFinder ? myPathFinder.score : null,
        classBest: bestPathFinder ? bestPathFinder.score : null,
        bestUser: bestPathFinder ? bestPathFinder.username : ''
      });

      // Acronym Attack Stats (Highest Score is Best)
      const acronymEntries = entries.filter(e => e.gameId === 'acronym-attack');
      const myAcronym = acronymEntries.filter(e => e.uid === userStats.uid).sort((a, b) => b.score - a.score)[0];
      const bestAcronym = acronymEntries.sort((a, b) => b.score - a.score)[0];

      setAcronymStats({
        yourBest: myAcronym ? myAcronym.score : null,
        classBest: bestAcronym ? bestAcronym.score : null,
        bestUser: bestAcronym ? bestAcronym.username : ''
      });

    }, (error) => handleFirestoreError(error, OperationType.GET, 'minigame_leaderboard'));

    const qTrio = query(collection(db, 'matchMaker_highscores'));
    const unsubscribeTrio = onSnapshot(qTrio, (snapshot) => {
      const rawEntries = snapshot.docs.map(doc => doc.data() as MatchMakerHighscore);
      const entries = filterByCourse(rawEntries, activeCourse);
      
      // Match the Trio Stats (Lowest Time is Best)
      const myTrio = entries.filter(e => e.uid === userStats.uid).sort((a, b) => a.time - b.time)[0];
      const bestTrio = entries.sort((a, b) => a.time - b.time)[0];

      setTrioStats({
        yourBest: myTrio ? myTrio.time : null,
        classBest: bestTrio ? bestTrio.time : null,
        bestUser: bestTrio ? bestTrio.username : ''
      });

    }, (error) => handleFirestoreError(error, OperationType.GET, 'matchMaker_highscores'));

    const qCli = query(collection(db, 'cli_leaderboard'));
    const unsubscribeCli = onSnapshot(qCli, (snapshot) => {
      const rawEntries = snapshot.docs.map(doc => doc.data() as CliLeaderboard);
      const entries = filterByCourse(rawEntries, activeCourse);
      
      // CLI Stats (Highest Streak is Best)
      const myCli = entries.filter(e => e.uid === userStats.uid).sort((a, b) => b.streak - a.streak)[0];
      const bestCli = entries.sort((a, b) => b.streak - a.streak)[0];

      setCliStats({
        yourBest: myCli ? myCli.streak : null,
        classBest: bestCli ? bestCli.streak : null,
        bestUser: bestCli ? bestCli.username : ''
      });

    }, (error) => handleFirestoreError(error, OperationType.GET, 'cli_leaderboard'));

    const qCases = query(collection(db, 'cv_clinic_cases'), where('status', '==', 'published'));
    const unsubscribeCases = onSnapshot(qCases, (snapshot) => {
      const allPub = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any));
      const forActive = allPub.filter(c => {
        if (activeCourse === 'matric-to-money') {
          return !c.course || c.course === 'matric-to-money';
        }
        return c.course === activeCourse;
      });
      // Fallback: If on matric-to-money and no case was specifically tagged matric-to-money (e.g. authored under a-plus),
      // allow all published cases so the game card activates immediately!
      const effectiveCount = forActive.length > 0 
        ? forActive.length 
        : (activeCourse === 'matric-to-money' ? allPub.length : forActive.length);
      setPublishedCvCasesCount(effectiveCount);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'cv_clinic_cases'));

    const qCvLead = query(collection(db, 'cv_clinic_leaderboard'));
    const unsubscribeCvLead = onSnapshot(qCvLead, (snapshot) => {
      const rawEntries = snapshot.docs.map(doc => doc.data() as any);
      const entries = filterByCourse(rawEntries, activeCourse);
      const myCv = entries.filter(e => e.uid === userStats.uid).sort((a, b) => b.score - a.score)[0];
      const bestCv = entries.sort((a, b) => b.score - a.score)[0];
      setCvClinicStats({
        yourBest: myCv ? myCv.score : null,
        classBest: bestCv ? bestCv.score : null,
        bestUser: bestCv ? bestCv.username : ''
      });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'cv_clinic_leaderboard'));

    const qContractCases = query(collection(db, 'contract_cases'), where('status', '==', 'published'));
    const unsubscribeContractCases = onSnapshot(qContractCases, (snapshot) => {
      const allPub = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any));
      const forActive = allPub.filter(c => {
        if (activeCourse === 'matric-to-money') {
          return !c.course || c.course === 'matric-to-money';
        }
        return c.course === activeCourse;
      });
      const effectiveCount = forActive.length > 0 
        ? forActive.length 
        : (activeCourse === 'matric-to-money' ? allPub.length : forActive.length);
      setPublishedContractCasesCount(effectiveCount);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'contract_cases'));

    const qContractLead = query(collection(db, 'contract_leaderboard'));
    const unsubscribeContractLead = onSnapshot(qContractLead, (snapshot) => {
      const rawEntries = snapshot.docs.map(doc => doc.data() as any);
      const entries = filterByCourse(rawEntries, activeCourse);
      const myContract = entries.filter(e => e.uid === userStats.uid).sort((a, b) => b.score - a.score)[0];
      const bestContract = entries.sort((a, b) => b.score - a.score)[0];
      setContractStats({
        yourBest: myContract ? myContract.score : null,
        classBest: bestContract ? bestContract.score : null,
        bestUser: bestContract ? bestContract.username : ''
      });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'contract_leaderboard'));

    return () => {
      unsubscribe();
      unsubscribeTrio();
      unsubscribeCli();
      unsubscribeCases();
      unsubscribeCvLead();
      unsubscribeContractCases();
      unsubscribeContractLead();
    };
  }, [userStats.uid, activeCourse]);


  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="mb-12">
      {/* Title required: {course short name} Arcade */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tight flex items-center gap-3">
          <Gamepad2 style={{ color: courseConfig.accentHex }} />
          <span>{courseConfig.shortLabel} Arcade</span>
        </h2>
        <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] hidden sm:inline">
          Interactive Skill Drills
        </span>
      </div>
      
      {courseConfig.games.length === 0 || ((courseConfig.games.some(g => g.id === 'cv-clinic') || courseConfig.games.some(g => g.id === 'contract-red-flags')) && publishedCvCasesCount === 0 && publishedContractCasesCount === 0 && !courseConfig.games.some(g => g.id === 'match-the-trio')) ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${courseConfig.accentHex}15`, color: courseConfig.accentHex }}
          >
            <Gamepad2 size={36} />
          </div>
          <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">
            {courseConfig.name} games coming soon
          </h3>
          <p className="text-[var(--text-muted)] text-sm max-w-md">
            Interactive simulators and quick skills drills for {courseConfig.name} are currently in development.
          </p>
        </div>
      ) : (courseConfig.games.some(g => g.id === 'cv-clinic') || courseConfig.games.some(g => g.id === 'contract-red-flags')) && !courseConfig.games.some(g => g.id === 'match-the-trio') ? (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
        >
          {/* CV Clinic Card */}
          <motion.div 
            variants={item}
            whileHover={{ y: -6 }}
            onClick={() => onViewChange('cv-clinic')}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/50 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col shadow-xl"
          >
            {/* 16:9 Photographic Banner */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
              <img 
                src={getGameImage('cv-clinic')} 
                alt="CV Clinic" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-black/50" />
              
              {/* Dual Floating Status Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-sm">
                  New Simulator
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-sm flex items-center gap-1">
                  <Zap size={10} /> +10 XP / Mistake
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                    CV Clinic
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 font-medium leading-relaxed">
                  Spot planted mistakes in sample CVs before the timer runs out. Master professional South African hiring standards!
                </p>
              </div>

              {/* Telemetry HUD row */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Your Best</div>
                  <div className="text-xs font-black font-mono text-[var(--text-main)] truncate mt-0.5">
                    {cvClinicStats.yourBest !== null ? `${cvClinicStats.yourBest} pts` : '--'}
                  </div>
                </div>
                <div className="border-x border-[var(--border-color)]">
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Class Best</div>
                  <div className="text-xs font-black font-mono text-emerald-400 truncate mt-0.5" title={cvClinicStats.bestUser || undefined}>
                    {cvClinicStats.classBest !== null ? `${cvClinicStats.classBest} pts` : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Bounty</div>
                  <div className="text-xs font-black font-mono text-amber-400 truncate mt-0.5">+10 XP</div>
                </div>
              </div>

              {/* Action Trigger Button */}
              <button 
                type="button"
                className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 text-white group-hover:brightness-110 shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <FileCheck size={14} />
                <span>Launch CV Clinic</span>
              </button>
            </div>
          </motion.div>

          {/* Contract Red Flags Card */}
          <motion.div 
            variants={item}
            whileHover={{ y: -6 }}
            onClick={() => onViewChange('contract-red-flags')}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-rose-500/50 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col shadow-xl"
          >
            {/* 16:9 Photographic Banner */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
              <img 
                src={getGameImage('contract-red-flags')} 
                alt="Contract Red Flags" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-black/50" />
              
              {/* Dual Floating Status Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md shadow-sm">
                  Module 5
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-sm flex items-center gap-1">
                  <Zap size={10} /> +10 XP / Term
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-rose-400 transition-colors">
                    Contract Red Flags
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-sm" />
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 font-medium leading-relaxed">
                  Audit employment agreements, identify missing BCEA statutory terms, and recommend safe action.
                </p>
              </div>

              {/* Telemetry HUD row */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Your Best</div>
                  <div className="text-xs font-black font-mono text-[var(--text-main)] truncate mt-0.5">
                    {contractStats.yourBest !== null ? `${contractStats.yourBest} pts` : '--'}
                  </div>
                </div>
                <div className="border-x border-[var(--border-color)]">
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Class Best</div>
                  <div className="text-xs font-black font-mono text-rose-400 truncate mt-0.5" title={contractStats.bestUser || undefined}>
                    {contractStats.classBest !== null ? `${contractStats.classBest} pts` : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Bounty</div>
                  <div className="text-xs font-black font-mono text-amber-400 truncate mt-0.5">+10 XP</div>
                </div>
              </div>

              {/* Action Trigger Button */}
              <button 
                type="button"
                className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-rose-600 to-red-700 text-white group-hover:brightness-110 shadow-md shadow-rose-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Scale size={14} />
                <span>Launch Contract Red Flags</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
        >
          {/* Game 1: Match the Trio */}
          <motion.div 
            variants={item}
            whileHover={{ y: -6 }}
            onClick={() => onViewChange('match-the-trio')}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/50 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col shadow-xl"
          >

            {/* 16:9 Photographic Banner */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
              <img 
                src={getGameImage('match-the-trio')} 
                alt="Match the Trio" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-black/50" />
              
              {/* Dual Floating Status Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-sm">
                  Advanced Mode
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-sm flex items-center gap-1">
                  <Zap size={10} /> +200 XP
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                    Match the Trio
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 font-medium leading-relaxed">
                  Find the 3 connected cards (Port, Protocol, Description). Beat 60s for the Mastery Badge!
                </p>
              </div>

              {/* Telemetry HUD row */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Your Best</div>
                  <div className="text-xs font-black font-mono text-[var(--text-main)] truncate mt-0.5">
                    {trioStats.yourBest ? `${trioStats.yourBest}s` : '--'}
                  </div>
                </div>
                <div className="border-x border-[var(--border-color)]">
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Class Best</div>
                  <div className="text-xs font-black font-mono text-emerald-400 truncate mt-0.5" title={trioStats.bestUser || undefined}>
                    {trioStats.classBest ? `${trioStats.classBest}s` : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Bounty</div>
                  <div className="text-xs font-black font-mono text-amber-400 truncate mt-0.5">+200 XP</div>
                </div>
              </div>

              {/* Action Trigger Button */}
              <button 
                type="button"
                className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 text-white group-hover:brightness-110 shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Layers size={14} />
                <span>Launch Trio Drill (60s)</span>
              </button>
            </div>
          </motion.div>

          {/* Game 2: Subnet Speed-Run */}
          <motion.div 
            variants={item}
            whileHover={{ y: -6 }}
            onClick={() => onViewChange('subnet-speed-run')}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-cyan-500/50 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col shadow-xl"
          >
            {/* 16:9 Photographic Banner */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
              <img 
                src={getGameImage('subnet-speed-run')} 
                alt="Subnet Speed Run" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-black/50" />
              
              {/* Dual Floating Status Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 backdrop-blur-md shadow-sm">
                  Live Drill
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-sm flex items-center gap-1">
                  <Zap size={10} /> +100 XP
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                    Subnet Speed-Run
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 font-medium leading-relaxed">
                  Fast-fire quiz. Identify valid and invalid IP addresses and subnet masks. Hit a streak of 15!
                </p>
              </div>

              {/* Telemetry HUD row */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Your Streak</div>
                  <div className="text-xs font-black font-mono text-[var(--text-main)] truncate mt-0.5">
                    {speedrunStats.yourBest !== null ? speedrunStats.yourBest : '--'}
                  </div>
                </div>
                <div className="border-x border-[var(--border-color)]">
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Class Best</div>
                  <div className="text-xs font-black font-mono text-cyan-400 truncate mt-0.5" title={speedrunStats.bestUser || undefined}>
                    {speedrunStats.classBest !== null ? speedrunStats.classBest : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Bounty</div>
                  <div className="text-xs font-black font-mono text-amber-400 truncate mt-0.5">+100 XP</div>
                </div>
              </div>

              {/* Action Trigger Button */}
              <button 
                type="button"
                className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 text-white group-hover:brightness-110 shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Timer size={14} />
                <span>Launch Speed Drill (60s)</span>
              </button>
            </div>
          </motion.div>

          {/* Game 3: Command Line Challenge */}
          <motion.div 
            variants={item}
            whileHover={{ y: -6 }}
            onClick={() => onViewChange('cli-challenge')}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-indigo-500/50 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col shadow-xl"
          >
            {/* 16:9 Photographic Banner */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
              <img 
                src={getGameImage('cli-challenge')} 
                alt="Command Line Challenge" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-black/50" />
              
              {/* Dual Floating Status Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur-md shadow-sm">
                  Expert Mode
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 backdrop-blur-md shadow-sm flex items-center gap-1">
                  <Zap size={10} /> XP / Command
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-indigo-400 transition-colors">
                    Command Line Challenge
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 font-medium leading-relaxed">
                  Test your CLI skills. Get a streak of 10 for the Terminal Master Badge!
                </p>
              </div>

              {/* Telemetry HUD row */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Your Streak</div>
                  <div className="text-xs font-black font-mono text-[var(--text-main)] truncate mt-0.5">
                    {cliStats.yourBest !== null ? cliStats.yourBest : '--'}
                  </div>
                </div>
                <div className="border-x border-[var(--border-color)]">
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Class Best</div>
                  <div className="text-xs font-black font-mono text-indigo-400 truncate mt-0.5" title={cliStats.bestUser || undefined}>
                    {cliStats.classBest !== null ? cliStats.classBest : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Bounty</div>
                  <div className="text-xs font-black font-mono text-amber-400 truncate mt-0.5">Active</div>
                </div>
              </div>

              {/* Action Trigger Button */}
              <button 
                type="button"
                className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-violet-600 text-white group-hover:brightness-110 shadow-md shadow-indigo-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Terminal size={14} />
                <span>Open Terminal Sim</span>
              </button>
            </div>
          </motion.div>

          {/* Game 4: Motherboard Puzzle */}
          <motion.div 
            variants={item}
            whileHover={{ y: -6 }}
            onClick={() => onViewChange('motherboard-puzzle')}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-violet-500/50 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col shadow-xl"
          >
            {/* 16:9 Photographic Banner */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
              <img 
                src={getGameImage('motherboard-puzzle')} 
                alt="Motherboard Puzzle" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-black/50" />
              
              {/* Dual Floating Status Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-violet-500/20 text-violet-300 border border-violet-500/40 backdrop-blur-md shadow-sm">
                  Hardware Sim
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 backdrop-blur-md shadow-sm flex items-center gap-1">
                  <Zap size={10} /> +100 XP
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-violet-400 transition-colors">
                    Motherboard Puzzle
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 font-medium leading-relaxed">
                  Drag and drop components to build a PC. Learn motherboard layouts hands-on!
                </p>
              </div>

              {/* Telemetry HUD row */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Mode</div>
                  <div className="text-xs font-black font-mono text-[var(--text-main)] truncate mt-0.5">Interactive</div>
                </div>
                <div className="border-x border-[var(--border-color)]">
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Target</div>
                  <div className="text-xs font-black font-mono text-violet-400 truncate mt-0.5">PC Build</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Bounty</div>
                  <div className="text-xs font-black font-mono text-amber-400 truncate mt-0.5">+100 XP</div>
                </div>
              </div>

              {/* Action Trigger Button */}
              <button 
                type="button"
                className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-violet-500 to-purple-600 text-white group-hover:brightness-110 shadow-md shadow-violet-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Gamepad2 size={14} />
                <span>Launch Motherboard Sim</span>
              </button>
            </div>
          </motion.div>

          {/* Game 5: Path Finder */}
          <motion.div 
            variants={item}
            whileHover={{ y: -6 }}
            onClick={() => onViewChange('path-finder')}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-sky-500/50 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col shadow-xl"
          >
            {/* 16:9 Photographic Banner */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
              <img 
                src={getGameImage('path-finder')} 
                alt="Path Finder" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-black/50" />
              
              {/* Dual Floating Status Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-sky-500/20 text-sky-300 border border-sky-500/40 backdrop-blur-md shadow-sm">
                  Network Drill
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 backdrop-blur-md shadow-sm flex items-center gap-1">
                  <Zap size={10} /> +300 XP
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-sky-400 transition-colors">
                    Path Finder
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 font-medium leading-relaxed">
                  Troubleshoot IPv4 configurations. Fix gateways, DNS, and subnets in real scenarios.
                </p>
              </div>

              {/* Telemetry HUD row */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Your Best</div>
                  <div className="text-xs font-black font-mono text-[var(--text-main)] truncate mt-0.5">
                    {pathFinderStats.yourBest ? pathFinderStats.yourBest.toLocaleString() : '--'}
                  </div>
                </div>
                <div className="border-x border-[var(--border-color)]">
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Class Best</div>
                  <div className="text-xs font-black font-mono text-sky-400 truncate mt-0.5" title={pathFinderStats.bestUser || undefined}>
                    {pathFinderStats.classBest ? pathFinderStats.classBest.toLocaleString() : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Bounty</div>
                  <div className="text-xs font-black font-mono text-amber-400 truncate mt-0.5">+300 XP</div>
                </div>
              </div>

              {/* Action Trigger Button */}
              <button 
                type="button"
                className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-sky-500 to-indigo-600 text-white group-hover:brightness-110 shadow-md shadow-indigo-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Network size={14} />
                <span>Start Path Finder</span>
              </button>
            </div>
          </motion.div>

          {/* Game 6: Acronym Attack */}
          <motion.div 
            variants={item}
            whileHover={{ y: -6 }}
            onClick={() => onViewChange('acronym-attack')}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/50 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col shadow-xl"
          >
            {/* 16:9 Photographic Banner */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
              <img 
                src={getGameImage('acronym-attack')} 
                alt="Acronym Attack" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-black/50" />
              
              {/* Dual Floating Status Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md shadow-sm">
                  Speed Drill
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-300 border border-orange-500/40 backdrop-blur-md shadow-sm flex items-center gap-1">
                  <Zap size={10} /> +500 XP
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                    Acronym Attack
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 font-medium leading-relaxed">
                  Fast-paced acronym recall. Master technical certification vocabulary under pressure!
                </p>
              </div>

              {/* Telemetry HUD row */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Your Best</div>
                  <div className="text-xs font-black font-mono text-[var(--text-main)] truncate mt-0.5">
                    {acronymStats.yourBest ? acronymStats.yourBest.toLocaleString() : '--'}
                  </div>
                </div>
                <div className="border-x border-[var(--border-color)]">
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Class Best</div>
                  <div className="text-xs font-black font-mono text-amber-400 truncate mt-0.5" title={acronymStats.bestUser || undefined}>
                    {acronymStats.classBest ? acronymStats.classBest.toLocaleString() : '--'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Bounty</div>
                  <div className="text-xs font-black font-mono text-amber-400 truncate mt-0.5">+500 XP</div>
                </div>
              </div>

              {/* Action Trigger Button */}
              <button 
                type="button"
                className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-600 text-white group-hover:brightness-110 shadow-md shadow-amber-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Zap size={14} />
                <span>Engage Acronym Attack</span>
              </button>
            </div>
          </motion.div>

          {/* Game 7: CV Clinic (Available when cases are published) */}
          {publishedCvCasesCount > 0 && (
            <motion.div 
              variants={item}
              whileHover={{ y: -6 }}
              onClick={() => onViewChange('cv-clinic')}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/50 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col shadow-xl"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <img 
                  src={getGameImage('cv-clinic')} 
                  alt="CV Clinic" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-black/50" />
                
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-sm">
                    New Simulator
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-sm flex items-center gap-1">
                    <Zap size={10} /> +10 XP / Mistake
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                      CV Clinic
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 font-medium leading-relaxed">
                    Spot planted mistakes in sample CVs before the timer runs out. Master professional South African hiring standards!
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-center">
                  <div>
                    <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Your Best</div>
                    <div className="text-xs font-black font-mono text-[var(--text-main)] truncate mt-0.5">
                      {cvClinicStats.yourBest !== null ? `${cvClinicStats.yourBest} pts` : '--'}
                    </div>
                  </div>
                  <div className="border-x border-[var(--border-color)]">
                    <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Class Best</div>
                    <div className="text-xs font-black font-mono text-emerald-400 truncate mt-0.5" title={cvClinicStats.bestUser || undefined}>
                      {cvClinicStats.classBest !== null ? `${cvClinicStats.classBest} pts` : '--'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Bounty</div>
                    <div className="text-xs font-black font-mono text-amber-400 truncate mt-0.5">+10 XP</div>
                  </div>
                </div>

                <button 
                  type="button"
                  className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 text-white group-hover:brightness-110 shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <FileCheck size={14} />
                  <span>Launch CV Clinic</span>
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ArcadeRow;
