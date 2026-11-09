import React, { useState, useEffect } from 'react';
import { UserStats } from '../../types';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { updateUserActivity } from '../../statsService';
import { ArrowLeft, Zap, Flame, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SubnetSpeedRunProps {
  userStats: UserStats;
  onBack: () => void;
}

interface Question {
  text: string;
  isValid: boolean;
  type: 'ip' | 'subnet';
}

const SubnetSpeedRun: React.FC<SubnetSpeedRunProps> = ({ userStats, onBack }) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const generateQuestion = (): Question => {
    const isIp = Math.random() > 0.5;
    const isValid = Math.random() > 0.5;

    if (isIp) {
      if (isValid) {
        return {
          text: `${Math.floor(Math.random() * 224)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
          isValid: true,
          type: 'ip'
        };
      } else {
        // Invalid IP (octet > 255)
        const octets = [
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256)
        ];
        octets[Math.floor(Math.random() * 4)] = 256 + Math.floor(Math.random() * 100);
        return {
          text: octets.join('.'),
          isValid: false,
          type: 'ip'
        };
      }
    } else {
      const validMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0', '255.255.255.128', '255.255.255.192', '255.255.255.224', '255.255.255.240', '255.255.255.248', '255.255.255.252'];
      if (isValid) {
        return {
          text: validMasks[Math.floor(Math.random() * validMasks.length)],
          isValid: true,
          type: 'subnet'
        };
      } else {
        const invalidMasks = ['255.255.255.13', '255.255.128.255', '255.0.255.0', '255.255.255.256', '255.255.255.1'];
        return {
          text: invalidMasks[Math.floor(Math.random() * invalidMasks.length)],
          isValid: false,
          type: 'subnet'
        };
      }
    }
  };

  useEffect(() => {
    setCurrentQuestion(generateQuestion());
  }, []);

  const handleAnswer = async (userSaysValid: boolean) => {
    if (!currentQuestion || isGameOver) return;

    const isCorrect = userSaysValid === currentQuestion.isValid;

    if (isCorrect) {
      setFeedback('correct');
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      if (newStreak === 15) {
        handleWin();
      } else {
        setTimeout(() => {
          setFeedback(null);
          setCurrentQuestion(generateQuestion());
        }, 400);
      }
    } else {
      setFeedback('wrong');
      handleLoss();
    }
  };

  const handleWin = async () => {
    setIsGameOver(true);
    try {
      await addDoc(collection(db, 'minigame_leaderboard'), {
        gameId: 'subnet-speed-run',
        uid: userStats.uid,
        username: auth.currentUser?.email?.split('@')[0] || 'Unknown',
        score: 15,
        time: 0,
        course: 'a-plus',
        timestamp: new Date().toISOString()
      });

      await updateUserActivity(100, 0.1); // 100 XP, 6 mins
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'minigame_leaderboard');
    }
  };

  const handleLoss = async () => {
    setIsGameOver(true);
    try {
      if (streak > 0) {
        await addDoc(collection(db, 'minigame_leaderboard'), {
          gameId: 'subnet-speed-run',
          uid: userStats.uid,
          username: auth.currentUser?.email?.split('@')[0] || 'Unknown',
          score: streak,
          time: 0,
          course: 'a-plus',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'minigame_leaderboard');
    }
  };

  const restartGame = () => {
    setStreak(0);
    setIsGameOver(false);
    setFeedback(null);
    setCurrentQuestion(generateQuestion());
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white p-6 md:p-12 flex flex-col">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 uppercase tracking-widest text-xs font-black self-start"
      >
        <ArrowLeft size={16} /> Back to Arcade
      </button>

      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Subnet Speed-Run</h1>
          <p className="text-gray-400 text-sm">Identify valid vs invalid IPs and Subnets. Hit a streak of 15 for +100 XP!</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-black/50 px-8 py-4 rounded-3xl border border-white/5 flex items-center gap-6">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Current Streak</div>
              <div className="text-3xl font-black text-white flex items-center justify-center gap-2">
                <Flame className={streak > 0 ? 'text-orange-500' : 'text-gray-600'} size={24} />
                {streak}/15
              </div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Best Streak</div>
              <div className="text-3xl font-black text-gray-400">{maxStreak}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative">
          <AnimatePresence mode="wait">
            {!isGameOver && currentQuestion && (
              <motion.div
                key={currentQuestion.text}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
                className={`w-full max-w-md bg-zinc-900 border-2 rounded-[3rem] p-12 text-center shadow-2xl transition-colors duration-300 ${
                  feedback === 'correct' ? 'border-green-500 bg-green-500/10 shadow-[0_0_50px_rgba(34,197,94,0.2)]' :
                  feedback === 'wrong' ? 'border-red-500 bg-red-500/10 shadow-[0_0_50px_rgba(239,68,68,0.2)]' :
                  'border-white/10'
                }`}
              >
                <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">
                  {currentQuestion.type === 'ip' ? 'IPv4 Address' : 'Subnet Mask'}
                </div>
                <div className="text-4xl md:text-5xl font-black font-mono tracking-tighter text-white break-all">
                  {currentQuestion.text}
                </div>
              </motion.div>
            )}

            {isGameOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[3rem] p-12 text-center shadow-2xl"
              >
                {streak === 15 ? (
                  <>
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Zap className="text-green-500 w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Flawless!</h2>
                    <p className="text-gray-400 mb-6">You hit a streak of 15.</p>
                    <div className="inline-block bg-green-500 text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm mb-8">
                      +100 XP Awarded
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <X className="text-red-500 w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Streak Broken</h2>
                    <p className="text-gray-400 mb-8">You made it to <span className="text-white font-black">{streak}</span> before missing.</p>
                  </>
                )}
                
                <button 
                  onClick={restartGame}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors"
                >
                  Play Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isGameOver && (
          <div className="grid grid-cols-2 gap-4 mt-12">
            <button 
              onClick={() => handleAnswer(true)}
              disabled={feedback !== null}
              className="py-6 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors group disabled:opacity-50"
            >
              <Check className="text-green-500 group-hover:scale-110 transition-transform" size={32} />
              <span className="text-green-500 font-black uppercase tracking-widest text-sm">Valid</span>
            </button>
            <button 
              onClick={() => handleAnswer(false)}
              disabled={feedback !== null}
              className="py-6 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors group disabled:opacity-50"
            >
              <X className="text-red-500 group-hover:scale-110 transition-transform" size={32} />
              <span className="text-red-500 font-black uppercase tracking-widest text-sm">Invalid</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubnetSpeedRun;
