import React, { useState, useEffect } from 'react';
import { UserStats } from '../../types';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { doc, updateDoc, increment, collection, addDoc, arrayUnion } from 'firebase/firestore';
import { updateUserActivity } from '../../statsService';
import { ArrowLeft, Timer, Layers, RefreshCw, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MatchTheTrioProps {
  userStats: UserStats;
  onBack: () => void;
}

const aPlusTrios = [
  { id: "trio_dns", item1: "53", item2: "DNS", item3: "Resolves Hostnames to IP Addresses" },
  { id: "trio_dhcp", item1: "67/68", item2: "DHCP", item3: "Dynamically Assigns IP Addresses" },
  { id: "trio_ssh", item1: "22", item2: "SSH", item3: "Secure Remote Console Access" },
  { id: "trio_http", item1: "80", item2: "HTTP", item3: "Unencrypted Web Traffic" },
  { id: "trio_https", item1: "443", item2: "HTTPS", item3: "Encrypted Web Traffic (TLS/SSL)" },
  { id: "trio_rdp", item1: "3389", item2: "RDP", item3: "Microsoft Remote Desktop Protocol" },
  { id: "trio_smb", item1: "445", item2: "SMB", item3: "Windows File and Printer Sharing" },
  { id: "trio_snmp", item1: "161/162", item2: "SNMP", item3: "Network Device Monitoring/Management" },
  { id: "trio_cat6", item1: "CAT6", item2: "10 Gbps", item3: "Ethernet Cable (Up to 55 Meters)" },
  { id: "trio_cat5e", item1: "CAT5e", item2: "1 Gbps", item3: "Standard Ethernet Cable (100 Meters)" },
  { id: "trio_apipa", item1: "169.254.x.x", item2: "APIPA", item3: "Indicates DHCP Server is Unreachable" },
  { id: "trio_loopback", item1: "127.0.0.1", item2: "Loopback", item3: "Tests Local TCP/IP Stack Functionality" },
  { id: "trio_fiber_sc", item1: "SC Connector", item2: "Subscriber Connector", item3: "Square-shaped Fiber Optic Plug" },
  { id: "trio_fiber_lc", item1: "LC Connector", item2: "Lucent Connector", item3: "Small, Snap-in Fiber Optic Plug" },
  { id: "trio_raid1", item1: "RAID 1", item2: "Mirroring", item3: "Data Redundancy (Requires 2 Drives)" }
];

interface Card {
  id: string;
  trioId: string;
  text: string;
  isFlipped: boolean;
  isMatched: boolean;
  isError: boolean;
}

const MatchTheTrio: React.FC<MatchTheTrioProps> = ({ userStats, onBack }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matches, setMatches] = useState(0);
  const [turns, setTurns] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // We will use 12 trios for a 36-card grid (6x6)
  const TOTAL_TRIOS = 12;
  const MASTER_TIME = 60; // seconds

  const initializeGame = () => {
    // Pick 12 random trios
    const shuffledTrios = [...aPlusTrios].sort(() => 0.5 - Math.random()).slice(0, TOTAL_TRIOS);
    
    let gameCards: Card[] = [];
    shuffledTrios.forEach((trio) => {
      gameCards.push({ id: `${trio.id}_1`, trioId: trio.id, text: trio.item1, isFlipped: false, isMatched: false, isError: false });
      gameCards.push({ id: `${trio.id}_2`, trioId: trio.id, text: trio.item2, isFlipped: false, isMatched: false, isError: false });
      gameCards.push({ id: `${trio.id}_3`, trioId: trio.id, text: trio.item3, isFlipped: false, isMatched: false, isError: false });
    });

    gameCards = gameCards.sort(() => 0.5 - Math.random());
    
    setCards(gameCards);
    setFlippedIds([]);
    setMatches(0);
    setTurns(0);
    setTime(0);
    setIsPlaying(false);
    setIsFinished(false);
    setIsProcessing(false);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isFinished) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isFinished]);

  const handleCardClick = (cardId: string) => {
    if (!isPlaying) setIsPlaying(true);
    if (isFinished || isProcessing) return;

    const clickedCard = cards.find(c => c.id === cardId);
    if (!clickedCard || clickedCard.isMatched) return;

    // If card is already flipped, do nothing (or allow unflip? Let's just do nothing for now, they have to click a 4th to reset or click Select)
    if (clickedCard.isFlipped) return;

    if (flippedIds.length === 3) {
      // Clicked a 4th card. Flip back the previous 3 and start a new selection.
      setCards(prev => prev.map(c => flippedIds.includes(c.id) ? { ...c, isFlipped: false } : c));
      setFlippedIds([cardId]);
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c));
    } else {
      // Less than 3 cards flipped
      const newFlippedIds = [...flippedIds, cardId];
      setFlippedIds(newFlippedIds);
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c));
    }
  };

  const handleSelect = () => {
    if (flippedIds.length !== 3 || isProcessing) return;
    
    setIsProcessing(true);
    setTurns(prev => prev + 1);
    
    const flippedCards = cards.filter(c => flippedIds.includes(c.id));
    const isMatch = flippedCards.every(c => c.trioId === flippedCards[0].trioId);

    if (isMatch) {
      setCards(prev => prev.map(c => flippedIds.includes(c.id) ? { ...c, isMatched: true } : c));
      setFlippedIds([]);
      setIsProcessing(false);
      setMatches(prev => {
        const newMatches = prev + 1;
        if (newMatches === TOTAL_TRIOS) {
          handleGameComplete();
        }
        return newMatches;
      });
    } else {
      // No Match - Red Shake
      setCards(prev => prev.map(c => flippedIds.includes(c.id) ? { ...c, isError: true } : c));
      setTimeout(() => {
        setCards(prev => prev.map(c => flippedIds.includes(c.id) ? { ...c, isFlipped: false, isError: false } : c));
        setFlippedIds([]);
        setIsProcessing(false);
      }, 1000);
    }
  };

  const handleGameComplete = async () => {
    setIsFinished(true);
    setIsPlaying(false);

    try {
      // Save to leaderboard
      await addDoc(collection(db, 'matchMaker_highscores'), {
        uid: userStats.uid,
        username: auth.currentUser?.email?.split('@')[0] || 'Unknown',
        time: time,
        turns: turns + 1, // +1 because state hasn't fully updated yet
        course: 'a-plus',
        timestamp: new Date().toISOString()
      });

      // Award XP and Badge if under Master Time
      if (time <= MASTER_TIME) {
        const extraUpdates: any = {};
        if (!userStats.badges?.includes('Match Maker')) {
          extraUpdates.badges = arrayUnion('Match Maker');
        }
        await updateUserActivity(200, 0.15, extraUpdates); // 200 XP, 9 mins
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'matchMaker_highscores');
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white p-6 md:p-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 uppercase tracking-widest text-xs font-black"
      >
        <ArrowLeft size={16} /> Back to Arcade
      </button>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
              <Layers className="text-green-500" /> Match the Trio
            </h1>
            <p className="text-gray-400 text-sm mt-2">Find the 3 connected cards. Under {MASTER_TIME}s = +200 XP & Badge!</p>
          </div>
          
          <div className="flex items-center gap-6 bg-black/50 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <Timer className="text-red-500" size={20} />
              <span className={`text-2xl font-black font-mono ${time > MASTER_TIME ? 'text-red-500' : 'text-white'}`}>{time}s</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2">
              <Layers className="text-green-500" size={20} />
              <span className="text-2xl font-black font-mono">{matches}/{TOTAL_TRIOS}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Turns</span>
              <span className="text-lg font-black font-mono">{turns}</span>
            </div>
            <button 
              onClick={handleSelect}
              disabled={flippedIds.length !== 3 || isProcessing}
              className={`ml-4 px-6 py-2 rounded-xl font-black uppercase tracking-widest text-sm transition-all ${
                flippedIds.length === 3 && !isProcessing
                  ? 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              Select
            </button>
            <button 
              onClick={initializeGame}
              className="ml-2 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              title="Restart Game"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {isFinished && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 p-8 rounded-3xl mb-8 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Award size={120} />
            </div>
            <h2 className="text-3xl font-black text-green-500 uppercase tracking-tight mb-2">Mastery Achieved!</h2>
            <p className="text-gray-300 mb-6 text-lg">You found all {TOTAL_TRIOS} trios in <span className="text-white font-black">{time} seconds</span> and <span className="text-white font-black">{turns} turns</span>.</p>
            {time <= MASTER_TIME ? (
              <div className="inline-flex items-center gap-3 bg-green-500 text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <Award size={20} /> +200 XP & "Match Maker" Badge Awarded!
              </div>
            ) : (
              <div className="inline-block bg-white/10 text-gray-400 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm">
                Try again to beat {MASTER_TIME}s for the Mastery Badge
              </div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
          {cards.map((card) => (
            <div 
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square rounded-2xl cursor-pointer transition-all duration-300 transform perspective-1000 ${
                card.isMatched ? 'opacity-50 scale-95 pointer-events-none' : 'hover:scale-105'
              }`}
            >
              <div className={`w-full h-full relative preserve-3d transition-transform duration-500 ${card.isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front (Hidden) */}
                <div className="absolute w-full h-full backface-hidden bg-[#1f1f1f] border border-white/10 rounded-2xl flex items-center justify-center hover:border-green-500/50 transition-colors shadow-lg">
                  <Layers className="text-white/10 w-8 h-8" />
                </div>
                
                {/* Back (Revealed) */}
                <div className={`absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl flex items-center justify-center p-3 text-center border-2 shadow-xl ${
                  card.isMatched 
                    ? 'bg-green-900/20 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-pulse' 
                    : card.isError
                      ? 'bg-red-900/20 border-red-500 text-red-400 animate-shake'
                      : 'bg-[#2a2a2a] border-white/20 text-white'
                }`}>
                  <span className="text-xs sm:text-sm md:text-base font-black tracking-tight break-words w-full">{card.text}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}} />
    </div>
  );
};

export default MatchTheTrio;
