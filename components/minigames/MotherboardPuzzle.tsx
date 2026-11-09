import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, doc, updateDoc, increment, handleFirestoreError, OperationType } from '../../firebase';
import { updateUserActivity } from '../../statsService';
import { UserStats } from '../../types';
import { ArrowLeft, Clock, Info, RotateCcw, CheckCircle2, XCircle, Trophy, Settings } from 'lucide-react';

interface MotherboardPuzzleProps {
  userStats: UserStats;
  onBack: () => void;
}

type ComponentId = 'cpu' | 'ram1' | 'ram2' | 'gpu' | 'atx24' | 'cpu8' | 'm2' | 'sata';

interface MBComponent {
  id: ComponentId;
  type: string;
  name: string;
  function: string;
  examNote: string;
  color: string;
}

const COMPONENTS: MBComponent[] = [
  { id: 'cpu', type: 'cpu', name: 'CPU', function: 'The brain of the computer.', examNote: 'Know the difference between PGA and LGA sockets.', color: 'bg-zinc-300 text-black' },
  { id: 'ram1', type: 'ram', name: 'RAM', function: 'Volatile memory for active tasks.', examNote: 'DDR4 has 288 pins. DDR5 has 288 pins but different keying.', color: 'bg-green-700 text-white' },
  { id: 'ram2', type: 'ram', name: 'RAM', function: 'Volatile memory for active tasks.', examNote: 'Install in pairs for dual-channel.', color: 'bg-green-700 text-white' },
  { id: 'gpu', type: 'gpu', name: 'GPU', function: 'Renders graphics and video.', examNote: 'Uses PCIe x16 slot.', color: 'bg-red-800 text-white' },
  { id: 'atx24', type: 'atx24', name: '24-pin', function: 'Main power to motherboard.', examNote: 'Provides +3.3V, +5V, +12V.', color: 'bg-zinc-800 text-white border border-zinc-600' },
  { id: 'cpu8', type: 'cpu8', name: '8-pin', function: 'Dedicated power for CPU.', examNote: 'Also known as EPS12V.', color: 'bg-zinc-800 text-white border border-zinc-600' },
  { id: 'm2', type: 'm2', name: 'M.2 SSD', function: 'High-speed storage.', examNote: 'Uses PCIe lanes, much faster than SATA.', color: 'bg-blue-900 text-white' },
  { id: 'sata', type: 'sata', name: 'SATA', function: 'Connects 2.5"/3.5" drives.', examNote: 'SATA III supports up to 6 Gbps.', color: 'bg-red-500 text-white' },
];

const DROP_ZONES = [
  { id: 'zone-cpu', accepts: ['cpu'], label: 'CPU Socket', left: '35%', top: '15%', width: '25%', height: '18%' },
  { id: 'zone-ram1', accepts: ['ram'], label: 'DIMM A2', left: '65%', top: '10%', width: '6%', height: '35%' },
  { id: 'zone-ram2', accepts: ['ram'], label: 'DIMM B2', left: '75%', top: '10%', width: '6%', height: '35%' },
  { id: 'zone-gpu', accepts: ['gpu'], label: 'PCIe x16', left: '15%', top: '60%', width: '60%', height: '10%' },
  { id: 'zone-atx24', accepts: ['atx24'], label: '24-pin ATX', left: '88%', top: '30%', width: '6%', height: '20%' },
  { id: 'zone-cpu8', accepts: ['cpu8'], label: '8-pin CPU', left: '10%', top: '5%', width: '12%', height: '6%' },
  { id: 'zone-m2', accepts: ['m2'], label: 'M.2 Slot', left: '35%', top: '45%', width: '25%', height: '6%' },
  { id: 'zone-sata', accepts: ['sata'], label: 'SATA Ports', left: '85%', top: '80%', width: '10%', height: '10%' },
];

const MotherboardPuzzle: React.FC<MotherboardPuzzleProps> = ({ userStats, onBack }) => {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [failedId, setFailedId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [explainMode, setExplainMode] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<MBComponent | null>(null);

  const dropZonesRef = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isFinished) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isFinished]);

  useEffect(() => {
    if (Object.keys(placed).length === COMPONENTS.length && COMPONENTS.length > 0) {
      handleComplete();
    }
  }, [placed]);

  const handleComplete = async () => {
    setIsFinished(true);
    setIsPlaying(false);
    
    try {
      const xpReward = difficulty === 'hard' ? 300 : difficulty === 'medium' ? 200 : 100;
      await updateUserActivity(xpReward, 0.2); // ~12 mins
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userStats.uid}`);
    }
  };

  const startGame = () => {
    setPlaced({});
    setScore(0);
    setMistakes(0);
    setTime(0);
    setIsPlaying(true);
    setIsFinished(false);
    setSelectedComponent(null);
  };

  const handleDragEnd = (event: any, info: any, comp: MBComponent) => {
    if (!isPlaying) return;

    const point = info.point;
    let droppedZoneId: string | null = null;

    for (const [zoneId, el] of Object.entries(dropZonesRef.current)) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (
        point.x >= rect.left &&
        point.x <= rect.right &&
        point.y >= rect.top &&
        point.y <= rect.bottom
      ) {
        droppedZoneId = zoneId;
        break;
      }
    }

    if (droppedZoneId) {
      const zoneDef = DROP_ZONES.find(z => z.id === droppedZoneId);
      if (zoneDef && zoneDef.accepts.includes(comp.type) && !placed[droppedZoneId]) {
        // Success
        setPlaced(prev => ({ ...prev, [droppedZoneId]: comp.id }));
        setScore(s => s + 100);
        return;
      } else {
        // Wrong zone
        setMistakes(m => m + 1);
        setScore(s => Math.max(0, s - 20));
        setFailedId(comp.id);
        setTooltip(`Incorrect: ${comp.name} goes into ${comp.type === 'ram' ? 'DIMM slots' : comp.type === 'gpu' ? 'PCIe slots' : 'its specific connector'}.`);
        setTimeout(() => {
          setFailedId(null);
          setTooltip(null);
        }, 3000);
        return;
      }
    }

    // Dropped outside
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const unplacedComponents = COMPONENTS.filter(c => !Object.values(placed).includes(c.id));

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col">
      {/* Top Bar */}
      <header className="bg-black border-b border-white/5 h-16 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-black uppercase tracking-tight text-red-600 italic">Motherboard Puzzle</h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-gray-300 font-mono text-lg">
            <Clock size={18} className="text-red-500" />
            {formatTime(time)}
          </div>
          <div className="flex items-center gap-2 text-gray-300 font-black text-lg">
            Score: <span className="text-white">{score}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative">
          
          {!isPlaying && !isFinished && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center">
                <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-4">Motherboard Puzzle</h2>
                <p className="text-gray-400 mb-8">Drag and drop the components into their correct slots on the motherboard. Learn the layout to ace your CompTIA A+ exam.</p>
                
                <div className="flex justify-center gap-4 mb-8">
                  {['easy', 'medium', 'hard'].map(level => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level as any)}
                      className={`px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-xs border transition-all ${
                        difficulty === level 
                          ? 'bg-red-600 border-red-500 text-white' 
                          : 'bg-black border-white/10 text-gray-500 hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={startGame}
                  className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
                >
                  Start Game
                </button>
              </div>
            </div>
          )}

          {isFinished && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center">
                <Trophy size={64} className="text-yellow-500 mx-auto mb-6" />
                <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Build Complete!</h2>
                <p className="text-gray-400 mb-8">System is ready to boot.</p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-black border border-white/5 p-4 rounded-xl">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Final Score</div>
                    <div className="text-2xl font-black text-white">{score}</div>
                  </div>
                  <div className="bg-black border border-white/5 p-4 rounded-xl">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Time</div>
                    <div className="text-2xl font-black text-white">{formatTime(time)}</div>
                  </div>
                  <div className="bg-black border border-white/5 p-4 rounded-xl">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Mistakes</div>
                    <div className="text-2xl font-black text-red-500">{mistakes}</div>
                  </div>
                  <div className="bg-black border border-white/5 p-4 rounded-xl">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Accuracy</div>
                    <div className="text-2xl font-black text-green-500">
                      {Math.max(0, Math.round(((COMPONENTS.length - mistakes) / COMPONENTS.length) * 100))}%
                    </div>
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full bg-red-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} /> Play Again
                </button>
              </div>
            </div>
          )}

          {/* Motherboard Board */}
          <div className="w-full max-w-2xl aspect-[3/4] bg-[#0a0a0a] border-4 border-zinc-800 rounded-lg relative shadow-2xl overflow-hidden">
            {/* Decorative Motherboard Traces */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
              backgroundSize: '20px 20px'
            }} />
            
            {DROP_ZONES.map(zone => {
              const isPlaced = placed[zone.id];
              const placedComp = COMPONENTS.find(c => c.id === isPlaced);

              return (
                <div
                  key={zone.id}
                  ref={el => {
                    if (el) dropZonesRef.current[zone.id] = el;
                  }}
                  data-zoneid={zone.id}
                  className={`absolute border-2 flex items-center justify-center transition-colors ${
                    isPlaced 
                      ? 'border-transparent' 
                      : difficulty === 'easy' 
                        ? 'border-dashed border-white/30 bg-white/5' 
                        : difficulty === 'medium'
                          ? 'border-dashed border-white/10'
                          : 'border-transparent'
                  }`}
                  style={{
                    left: zone.left,
                    top: zone.top,
                    width: zone.width,
                    height: zone.height,
                  }}
                >
                  {!isPlaced && difficulty === 'easy' && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30 text-center px-1">
                      {zone.label}
                    </span>
                  )}

                  {isPlaced && placedComp && (
                    <motion.div
                      layoutId={placedComp.id}
                      className={`w-full h-full ${placedComp.color} flex items-center justify-center rounded shadow-[0_0_15px_rgba(34,197,94,0.3)] border border-white/20 cursor-pointer`}
                      onClick={() => explainMode && setSelectedComponent(placedComp)}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest text-center px-1">
                        {placedComp.name}
                      </span>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tooltip */}
          <AnimatePresence>
            {tooltip && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute bottom-8 bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2"
              >
                <XCircle size={18} />
                {tooltip}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel: Components & Info */}
        <div className="w-80 bg-zinc-900 border-l border-white/5 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-black uppercase tracking-widest text-sm text-white">Components</h3>
            <button 
              onClick={() => setExplainMode(!explainMode)}
              className={`p-2 rounded-lg transition-colors ${explainMode ? 'bg-blue-600 text-white' : 'bg-black text-gray-400 hover:text-white'}`}
              title="Explain Mode"
            >
              <Info size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {explainMode && selectedComponent ? (
              <div className="bg-black border border-blue-500/30 rounded-xl p-4 relative">
                <button 
                  onClick={() => setSelectedComponent(null)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-white"
                >
                  <XCircle size={16} />
                </button>
                <div className="text-blue-500 font-black uppercase tracking-widest text-xs mb-2">Component Info</div>
                <h4 className="text-lg font-bold text-white mb-2">{selectedComponent.name}</h4>
                <p className="text-sm text-gray-400 mb-4">{selectedComponent.function}</p>
                <div className="bg-blue-900/20 border border-blue-500/20 p-3 rounded-lg">
                  <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Exam Note</div>
                  <p className="text-xs text-blue-200">{selectedComponent.examNote}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {unplacedComponents.map(comp => (
                  <motion.div
                    key={comp.id}
                    layoutId={comp.id}
                    drag={isPlaying && !explainMode}
                    dragSnapToOrigin
                    onDragEnd={(e, info) => handleDragEnd(e, info, comp)}
                    whileDrag={{ scale: 1.1, zIndex: 50, cursor: 'grabbing' }}
                    onClick={() => explainMode && setSelectedComponent(comp)}
                    animate={failedId === comp.id ? { x: [-5, 5, -5, 5, 0] } : {}}
                    transition={failedId === comp.id ? { duration: 0.4 } : {}}
                    className={`h-16 ${comp.color} rounded-lg flex items-center justify-center p-2 text-center border border-white/10 shadow-lg ${
                      explainMode ? 'cursor-pointer hover:ring-2 ring-blue-500' : 'cursor-grab'
                    } ${failedId === comp.id ? 'ring-2 ring-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : ''}`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest leading-tight">
                      {comp.name}
                    </span>
                  </motion.div>
                ))}
                {unplacedComponents.length === 0 && (
                  <div className="col-span-2 text-center text-gray-500 text-sm py-8 font-medium">
                    All components placed!
                  </div>
                )}
              </div>
            )}
          </div>
          
          {explainMode && (
            <div className="p-4 bg-blue-900/20 border-t border-blue-500/20 text-xs text-blue-300">
              <strong>Explain Mode Active:</strong> Click any component (in the tray or on the board) to view its details. Dragging is disabled.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MotherboardPuzzle;
