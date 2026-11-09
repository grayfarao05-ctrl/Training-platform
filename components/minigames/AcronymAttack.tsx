
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Heart, 
  Timer, 
  Trophy, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Target,
  Flame,
  Shield,
  Cpu,
  Network,
  HardDrive
} from 'lucide-react';
import { UserStats } from '../../types';
import { db, OperationType, handleFirestoreError } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface AcronymAttackProps {
  userStats: UserStats;
  onBack: () => void;
}

type GameMode = 'Speed' | 'Practice' | 'Survival';
type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Acronym {
  term: string;
  definition: string;
  explanation: string;
  category: 'Security' | 'Networking' | 'Hardware' | 'Software' | 'Troubleshooting';
  difficulty: Difficulty;
}

const ACRONYMS: Acronym[] = [
  // Easy
  { term: 'CPU', definition: 'Central Processing Unit', explanation: 'The primary component of a computer that acts as its "brain".', category: 'Hardware', difficulty: 'Easy' },
  { term: 'RAM', definition: 'Random Access Memory', explanation: 'Volatile memory used to store data currently in use by the CPU.', category: 'Hardware', difficulty: 'Easy' },
  { term: 'DNS', definition: 'Domain Name System', explanation: 'Translates human-readable domain names (like google.com) into IP addresses.', category: 'Networking', difficulty: 'Easy' },
  { term: 'HTTP', definition: 'Hypertext Transfer Protocol', explanation: 'The foundation of data communication for the World Wide Web.', category: 'Networking', difficulty: 'Easy' },
  { term: 'LAN', definition: 'Local Area Network', explanation: 'A network that connects computers and devices in a limited geographical area.', category: 'Networking', difficulty: 'Easy' },
  { term: 'OS', definition: 'Operating System', explanation: 'Software that manages computer hardware and software resources.', category: 'Software', difficulty: 'Easy' },
  { term: 'URL', definition: 'Uniform Resource Locator', explanation: 'The address of a unique resource on the Web.', category: 'Networking', difficulty: 'Easy' },
  { term: 'USB', definition: 'Universal Serial Bus', explanation: 'A common interface for connecting peripheral devices to a computer.', category: 'Hardware', difficulty: 'Easy' },
  { term: 'VPN', definition: 'Virtual Private Network', explanation: 'Creates a secure, encrypted connection over a less secure network.', category: 'Networking', difficulty: 'Easy' },
  { term: 'Wi-Fi', definition: 'Wireless Fidelity', explanation: 'A wireless networking technology that uses radio waves to provide high-speed internet.', category: 'Networking', difficulty: 'Easy' },
  
  // Medium
  { term: 'DLP', definition: 'Data Loss Prevention', explanation: 'Strategies and tools to ensure sensitive data is not lost, misused, or accessed by unauthorized users.', category: 'Security', difficulty: 'Medium' },
  { term: 'PII', definition: 'Personally Identifiable Information', explanation: 'Any data that could potentially identify a specific individual.', category: 'Security', difficulty: 'Medium' },
  { term: 'UPS', definition: 'Uninterruptible Power Supply', explanation: 'Provides emergency power to a load when the input power source fails.', category: 'Hardware', difficulty: 'Medium' },
  { term: 'DHCP', definition: 'Dynamic Host Configuration Protocol', explanation: 'Automatically assigns IP addresses and other network configuration to devices.', category: 'Networking', difficulty: 'Medium' },
  { term: 'BIOS', definition: 'Basic Input/Output System', explanation: 'Firmware used to perform hardware initialization during the booting process.', category: 'Hardware', difficulty: 'Medium' },
  { term: 'SATA', definition: 'Serial Advanced Technology Attachment', explanation: 'A computer bus interface that connects host bus adapters to mass storage devices.', category: 'Hardware', difficulty: 'Medium' },
  { term: 'SSD', definition: 'Solid State Drive', explanation: 'A storage device that uses integrated circuit assemblies to store data persistently.', category: 'Hardware', difficulty: 'Medium' },
  { term: 'POST', definition: 'Power-On Self-Test', explanation: 'A diagnostic testing sequence that a computer runs to determine if the hardware is working correctly.', category: 'Hardware', difficulty: 'Medium' },
  { term: 'WAP', definition: 'Wireless Access Point', explanation: 'A networking hardware device that allows other Wi-Fi devices to connect to a wired network.', category: 'Networking', difficulty: 'Medium' },
  { term: 'MAC', definition: 'Media Access Control', explanation: 'A unique identifier assigned to a network interface controller for communications on a physical network segment.', category: 'Networking', difficulty: 'Medium' },

  // Hard
  { term: 'SIEM', definition: 'Security Information and Event Management', explanation: 'Provides real-time analysis of security alerts generated by applications and network hardware.', category: 'Security', difficulty: 'Hard' },
  { term: 'MTBF', definition: 'Mean Time Between Failures', explanation: 'The predicted elapsed time between inherent failures of a mechanical or electronic system.', category: 'Troubleshooting', difficulty: 'Hard' },
  { term: 'RAID', definition: 'Redundant Array of Independent Disks', explanation: 'A data storage virtualization technology that combines multiple physical disk drive components into one or more logical units.', category: 'Hardware', difficulty: 'Hard' },
  { term: 'SNMP', definition: 'Simple Network Management Protocol', explanation: 'An Internet Standard protocol for collecting and organizing information about managed devices on IP networks.', category: 'Networking', difficulty: 'Hard' },
  { term: 'VLAN', definition: 'Virtual Local Area Network', explanation: 'Any broadcast domain that is partitioned and isolated in a computer network at the data link layer.', category: 'Networking', difficulty: 'Hard' },
  { term: 'AES', definition: 'Advanced Encryption Standard', explanation: 'A specification for the encryption of electronic data established by the U.S. NIST.', category: 'Security', difficulty: 'Hard' },
  { term: 'FQDN', definition: 'Fully Qualified Domain Name', explanation: 'The complete domain name for a specific computer, or host, on the internet.', category: 'Networking', difficulty: 'Hard' },
  { term: 'SaaS', definition: 'Software as a Service', explanation: 'A software licensing and delivery model in which software is licensed on a subscription basis and is centrally hosted.', category: 'Software', difficulty: 'Hard' },
  { term: 'IaaS', definition: 'Infrastructure as a Service', explanation: 'Online services that provide high-level APIs used to dereference various low-level details of underlying network infrastructure.', category: 'Networking', difficulty: 'Hard' },
  { term: 'PaaS', definition: 'Platform as a Service', explanation: 'A category of cloud computing services that provides a platform allowing customers to develop, run, and manage applications.', category: 'Software', difficulty: 'Hard' },
];

const AcronymAttack: React.FC<AcronymAttackProps> = ({ userStats, onBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'feedback' | 'end'>('menu');
  const [mode, setMode] = useState<GameMode>('Speed');
  const [currentAcronym, setCurrentAcronym] = useState<Acronym | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; selected: string; correct: string; explanation: string } | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateQuestion = useCallback(() => {
    // Filter acronyms by difficulty if needed, or just pick random
    const pool = ACRONYMS;
    const correct = pool[Math.floor(Math.random() * pool.length)];
    
    // Generate distractors
    const distractors = pool
      .filter(a => a.term !== correct.term)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(a => a.definition);
    
    const allOptions = [...distractors, correct.definition].sort(() => 0.5 - Math.random());
    
    setCurrentAcronym(correct);
    setOptions(allOptions);
    setFeedback(null);
  }, []);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTotalCorrect(0);
    setTotalAnswered(0);
    setLives(3);
    setTimeLeft(60);
    setGameState('playing');
    generateQuestion();
  };

  useEffect(() => {
    if (gameState === 'playing' && mode === 'Speed') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState('end');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, mode]);

  const handleAnswer = (selected: string) => {
    if (!currentAcronym || feedback) return;

    const isCorrect = selected === currentAcronym.definition;
    setTotalAnswered(prev => prev + 1);

    if (isCorrect) {
      setTotalCorrect(prev => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      
      // Calculate points
      let points = 100;
      if (mode === 'Speed') {
        const speedBonus = Math.max(0, 10); // Could be based on reaction time
        points = (points + speedBonus) * Math.min(newStreak, 5);
      }
      setScore(prev => prev + points);
      
      setFeedback({ isCorrect: true, selected, correct: currentAcronym.definition, explanation: currentAcronym.explanation });
      
      if (mode !== 'Practice') {
        setTimeout(() => {
          generateQuestion();
        }, 1000);
      }
    } else {
      setStreak(0);
      if (mode === 'Survival') {
        setLives(prev => {
          if (prev <= 1) {
            setGameState('end');
            return 0;
          }
          return prev - 1;
        });
      }
      
      setFeedback({ isCorrect: false, selected, correct: currentAcronym.definition, explanation: currentAcronym.explanation });
      
      if (mode === 'Speed') {
        setTimeout(() => {
          generateQuestion();
        }, 1500);
      }
    }
  };

  const saveScore = async () => {
    try {
      await addDoc(collection(db, 'minigame_leaderboard'), {
        gameId: 'acronym-attack',
        uid: userStats.uid,
        username: userStats.displayName,
        score,
        mode,
        course: 'a-plus',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'minigame_leaderboard');
    }
  };

  useEffect(() => {
    if (gameState === 'end') {
      saveScore();
    }
  }, [gameState]);

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 p-12">
      <div className="text-center space-y-4">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 bg-orange-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-orange-600/20"
        >
          <Zap size={48} className="text-orange-600" />
        </motion.div>
        <h1 className="text-5xl font-black uppercase tracking-tighter text-white">Acronym <span className="text-orange-600">Attack</span></h1>
        <p className="text-gray-400 max-w-md mx-auto font-medium">
          Master the language of IT. Fast-paced memory challenges to reinforce your CompTIA A+ vocabulary.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {[
          { mode: 'Speed', icon: Flame, color: 'text-orange-600', desc: '60s Blitz • Streak Multiplier' },
          { mode: 'Survival', icon: Heart, color: 'text-red-600', desc: '3 Lives • Infinite Time' },
          { mode: 'Practice', icon: HelpCircle, color: 'text-blue-600', desc: 'No Timer • Detailed Feedback' }
        ].map(m => (
          <button
            key={m.mode}
            onClick={() => startGame(m.mode as GameMode)}
            className="group relative bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem] hover:border-orange-600/50 transition-all text-left overflow-hidden"
          >
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${m.color}`}>
              <m.icon size={64} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">{m.mode} Mode</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">{m.desc}</p>
            <div className={`${m.color} font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2`}>
              Initialize <Zap size={14} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPlaying = () => {
    if (!currentAcronym) return null;

    return (
      <div className="flex flex-col h-full">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-black/50 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Acronym <span className="text-orange-600">Attack</span></h2>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{mode} Mode</p>
            </div>
          </div>

          <div className="flex items-center gap-12">
            {mode === 'Speed' && (
              <div className="flex items-center gap-3">
                <Timer className={timeLeft < 10 ? 'text-red-600 animate-pulse' : 'text-gray-500'} size={20} />
                <span className={`font-mono text-2xl font-black ${timeLeft < 10 ? 'text-red-600' : 'text-white'}`}>
                  {timeLeft}s
                </span>
              </div>
            )}
            {mode === 'Survival' && (
              <div className="flex items-center gap-2">
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    size={20} 
                    className={i < lives ? 'text-red-600 fill-red-600' : 'text-gray-800'} 
                  />
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-500" size={20} />
              <span className="text-2xl font-black text-white">{score.toLocaleString()}</span>
            </div>
            {streak > 1 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-600/20 rounded-full border border-orange-600/30">
                <Flame size={16} className="text-orange-600 animate-bounce" />
                <span className="text-orange-600 font-black text-sm">x{streak}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-12 max-w-4xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAcronym.term}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full text-center space-y-12"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/5 rounded-full border border-white/10">
                  {currentAcronym.category === 'Security' && <Shield size={12} className="text-red-500" />}
                  {currentAcronym.category === 'Networking' && <Network size={12} className="text-blue-500" />}
                  {currentAcronym.category === 'Hardware' && <Cpu size={12} className="text-green-500" />}
                  {currentAcronym.category === 'Software' && <HardDrive size={12} className="text-purple-500" />}
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{currentAcronym.category}</span>
                </div>
                <h1 className="text-8xl md:text-9xl font-black uppercase tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  {currentAcronym.term}
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {options.map((option, index) => {
                  const isSelected = feedback?.selected === option;
                  const isCorrect = option === currentAcronym.definition;
                  
                  let borderColor = 'border-white/5';
                  let bgColor = 'bg-zinc-900';
                  let textColor = 'text-gray-300';

                  if (feedback) {
                    if (isCorrect) {
                      borderColor = 'border-green-500';
                      bgColor = 'bg-green-500/10';
                      textColor = 'text-green-500';
                    } else if (isSelected) {
                      borderColor = 'border-red-500';
                      bgColor = 'bg-red-500/10';
                      textColor = 'text-red-500';
                    } else {
                      opacity: 0.5;
                    }
                  }

                  return (
                    <motion.button
                      key={index}
                      whileHover={!feedback ? { scale: 1.02, borderColor: 'rgba(249, 115, 22, 0.5)' } : {}}
                      whileTap={!feedback ? { scale: 0.98 } : {}}
                      onClick={() => handleAnswer(option)}
                      disabled={!!feedback}
                      className={`p-8 rounded-[2rem] border ${borderColor} ${bgColor} ${textColor} text-lg font-black uppercase tracking-tight text-left transition-all relative overflow-hidden group`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {feedback && isCorrect && <CheckCircle2 size={24} className="text-green-500" />}
                        {feedback && isSelected && !isCorrect && <XCircle size={24} className="text-red-500" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8"
              >
                <div className="flex items-start gap-6">
                  <div className={`p-4 rounded-2xl ${feedback.isCorrect ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    <HelpCircle size={24} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-500">Did You Know?</h4>
                    <p className="text-white font-medium leading-relaxed">
                      {feedback.explanation}
                    </p>
                    {mode === 'Practice' && (
                      <button
                        onClick={generateQuestion}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all"
                      >
                        Next Acronym
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderEnd = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-12 p-12">
      <div className="text-center space-y-6">
        <div className="w-32 h-32 bg-orange-500/10 rounded-[3rem] flex items-center justify-center mx-auto border border-orange-500/20">
          <Trophy size={64} className="text-orange-500" />
        </div>
        <h2 className="text-5xl font-black uppercase tracking-tighter text-white">Mission <span className="text-orange-600">Complete</span></h2>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Your acronym recall is elite.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full max-w-5xl">
        {[
          { label: 'Final Score', value: score.toLocaleString(), icon: Trophy, color: 'text-yellow-500' },
          { label: 'Accuracy', value: `${totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%`, icon: Target, color: 'text-blue-500' },
          { label: 'Max Streak', value: maxStreak, icon: Flame, color: 'text-orange-600' },
          { label: 'Correct', value: totalCorrect, icon: CheckCircle2, color: 'text-green-500' }
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem] text-center space-y-4">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-3xl font-black text-white">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-md">
        <button
          onClick={() => setGameState('menu')}
          className="flex-1 py-6 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition-all flex items-center justify-center gap-3"
        >
          <RefreshCw size={16} /> Play Again
        </button>
        <button
          onClick={onBack}
          className="flex-1 py-6 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all border border-white/10"
        >
          Back to Arcade
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full"
        >
          {gameState === 'menu' && renderMenu()}
          {gameState === 'playing' && renderPlaying()}
          {gameState === 'feedback' && renderPlaying()}
          {gameState === 'end' && renderEnd()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AcronymAttack;
