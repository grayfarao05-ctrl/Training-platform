import React, { useState, useEffect, useRef } from 'react';
import { UserStats } from '../../types';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { doc, updateDoc, increment, collection, addDoc, arrayUnion } from 'firebase/firestore';
import { updateUserActivity } from '../../statsService';
import { ArrowLeft, Terminal, Zap, Award, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface CommandLineChallengeProps {
  userStats: UserStats;
  onBack: () => void;
}

const cliMissions = [
  {
    "id": "cli_001",
    "category": "Networking",
    "os": "Windows",
    "mission": "Display the full IP configuration, including the MAC address and DNS servers.",
    "correct_command": "ipconfig /all",
    "hint": "Try adding a switch that shows 'everything'.",
    "xp_reward": 50
  },
  {
    "id": "cli_002",
    "category": "Networking",
    "os": "Linux",
    "mission": "Test the reachability of the Google DNS server (8.8.8.8).",
    "correct_command": "ping 8.8.8.8",
    "hint": "Use the most common tool for testing latency.",
    "xp_reward": 30
  },
  {
    "id": "cli_003",
    "category": "Troubleshooting",
    "os": "Windows",
    "mission": "Clear the local DNS resolver cache to fix a 'Site Not Found' error.",
    "correct_command": "ipconfig /flushdns",
    "hint": "You need to 'flush' the records.",
    "xp_reward": 75
  },
  {
    "id": "cli_004",
    "category": "Networking",
    "os": "Windows",
    "mission": "Trace the path packets take to reach 'google.com' to find where a connection is dropping.",
    "correct_command": "tracert google.com",
    "hint": "Windows uses a shortened version of 'traceroute'.",
    "xp_reward": 60
  },
  {
    "id": "cli_005",
    "category": "System Admin",
    "os": "Linux",
    "mission": "List all files in the current directory, including hidden configuration files.",
    "correct_command": "ls -a",
    "hint": "The 'list' command with an 'all' flag.",
    "xp_reward": 40
  },
  {
    "id": "cli_006",
    "category": "Networking",
    "os": "Both",
    "mission": "Query the DNS to find the IP address associated with 'mastery-app.com'.",
    "correct_command": "nslookup mastery-app.com",
    "hint": "Use the standard tool for 'name server lookup'.",
    "xp_reward": 50
  },
  {
    "id": "cli_007",
    "category": "System Admin",
    "os": "Windows",
    "mission": "Scan the file system for errors and attempt to repair them on the next reboot.",
    "correct_command": "sfc /scannow",
    "hint": "Think 'System File Checker'.",
    "xp_reward": 100
  },
  {
    "id": "cli_008",
    "category": "Linux Skills",
    "os": "Linux",
    "mission": "Display the current working directory path.",
    "correct_command": "pwd",
    "hint": "Stands for 'Print Working Directory'.",
    "xp_reward": 25
  },
  {
    "id": "cli_009",
    "category": "Security",
    "os": "Windows",
    "mission": "Display all active TCP connections and the ports the computer is listening on.",
    "correct_command": "netstat -an",
    "hint": "Check the 'network statistics'.",
    "xp_reward": 80
  },
  {
    "id": "cli_010",
    "category": "Hard Mode",
    "os": "Linux",
    "mission": "Change the permissions of 'config.txt' so that everyone has Read, Write, and Execute access.",
    "correct_command": "chmod 777 config.txt",
    "hint": "Use the numeric method for 'Full Access'.",
    "xp_reward": 150
  }
];

interface TerminalLine {
  id: string;
  type: 'system' | 'input' | 'success' | 'error' | 'hint';
  text: string;
}

const CommandLineChallenge: React.FC<CommandLineChallengeProps> = ({ userStats, onBack }) => {
  const [missions, setMissions] = useState([...cliMissions].sort(() => 0.5 - Math.random()));
  const [currentMissionIndex, setCurrentMissionIndex] = useState(0);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const currentMission = missions[currentMissionIndex];

  useEffect(() => {
    // Initial boot sequence
    setHistory([
      { id: 'boot1', type: 'system', text: 'A+ Terminal Emulator v2.4.1' },
      { id: 'boot2', type: 'system', text: 'Connecting to remote server...' },
      { id: 'boot3', type: 'system', text: 'Connection established.' },
      { id: 'boot4', type: 'system', text: 'Type the correct command to complete the mission.' },
      { id: 'boot5', type: 'system', text: '--------------------------------------------------' },
      { id: `mission_${currentMission.id}`, type: 'system', text: `MISSION [${currentMission.os}]: ${currentMission.mission}` }
    ]);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGameOver) return;

    const command = input.trim();
    setInput('');

    const newHistory = [...history, { id: `in_${Date.now()}`, type: 'input', text: `> ${command}` } as TerminalLine];

    if (command.toLowerCase() === currentMission.correct_command.toLowerCase()) {
      // Correct
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setShowHint(false);

      newHistory.push({ id: `succ_${Date.now()}`, type: 'success', text: `SUCCESS: Command accepted. +${currentMission.xp_reward} XP` });
      
      // Award XP
      try {
        const extraUpdates: any = {};
        if (newStreak === 10 && !userStats.badges?.includes('Terminal Master')) {
          extraUpdates.badges = arrayUnion('Terminal Master');
          newHistory.push({ id: `badge_${Date.now()}`, type: 'success', text: `ACHIEVEMENT UNLOCKED: Terminal Master Badge!` });
        }
        await updateUserActivity(currentMission.xp_reward, 0.05, extraUpdates); // ~3 mins per command
      } catch (err) {
        console.error("Failed to update XP", err);
      }

      // Next Mission
      if (currentMissionIndex + 1 < missions.length) {
        const nextIndex = currentMissionIndex + 1;
        setCurrentMissionIndex(nextIndex);
        newHistory.push({ id: `sep_${Date.now()}`, type: 'system', text: '--------------------------------------------------' });
        newHistory.push({ id: `mission_${missions[nextIndex].id}`, type: 'system', text: `MISSION [${missions[nextIndex].os}]: ${missions[nextIndex].mission}` });
      } else {
        // Game Over - Completed all
        newHistory.push({ id: `end_${Date.now()}`, type: 'system', text: 'ALL MISSIONS COMPLETED. Connection closed.' });
        setIsGameOver(true);
        saveScore(newStreak);
      }
    } else {
      // Incorrect
      newHistory.push({ id: `err_${Date.now()}`, type: 'error', text: `ERROR: Command not recognized.` });
      setShowHint(true);
      
      // Reset streak but keep playing
      if (streak > 0) {
        saveScore(streak);
        setStreak(0);
      }
    }

    setHistory(newHistory);
  };

  const saveScore = async (finalStreak: number) => {
    if (finalStreak === 0) return;
    try {
      await addDoc(collection(db, 'cli_leaderboard'), {
        uid: userStats.uid,
        username: auth.currentUser?.email?.split('@')[0] || 'Unknown',
        streak: finalStreak,
        course: 'a-plus',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'cli_leaderboard');
    }
  };

  const showHintLine = () => {
    setHistory(prev => [...prev, { id: `hint_${Date.now()}`, type: 'hint', text: `HINT: ${currentMission.hint}` }]);
    setShowHint(false);
    handleFocus();
  };

  const restartGame = () => {
    setMissions([...cliMissions].sort(() => 0.5 - Math.random()));
    setCurrentMissionIndex(0);
    setStreak(0);
    setInput('');
    setShowHint(false);
    setIsGameOver(false);
    setHistory([
      { id: `boot1_${Date.now()}`, type: 'system', text: 'Rebooting terminal...' },
      { id: `mission_${Date.now()}`, type: 'system', text: `MISSION [${missions[0].os}]: ${missions[0].mission}` }
    ]);
    setTimeout(handleFocus, 100);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white p-6 md:p-12 flex flex-col">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 uppercase tracking-widest text-xs font-black self-start"
      >
        <ArrowLeft size={16} /> Back to Arcade
      </button>

      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
              <Terminal className="text-green-500" /> Command Line Challenge
            </h1>
            <p className="text-gray-400 text-sm mt-2">Type the correct command. Streak of 10 = Terminal Master Badge.</p>
          </div>
          
          <div className="flex items-center gap-6 bg-black/50 p-4 rounded-2xl border border-white/5">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Current Streak</span>
              <span className="text-2xl font-black font-mono text-green-500">{streak}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Best Streak</span>
              <span className="text-lg font-black font-mono">{maxStreak}</span>
            </div>
          </div>
        </div>

        {/* Terminal Window */}
        <div 
          className="flex-1 bg-black rounded-xl border border-green-900/30 p-6 font-mono text-sm md:text-base overflow-hidden flex flex-col relative shadow-[0_0_30px_rgba(34,197,94,0.1)] crt-effect"
          onClick={handleFocus}
        >
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-20" />
          
          <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-2 pb-4 z-20 custom-scrollbar">
            {history.map((line) => (
              <div key={line.id} className={`
                ${line.type === 'system' ? 'text-green-500' : ''}
                ${line.type === 'input' ? 'text-white' : ''}
                ${line.type === 'success' ? 'text-green-400 font-bold' : ''}
                ${line.type === 'error' ? 'text-red-500' : ''}
                ${line.type === 'hint' ? 'text-yellow-500 italic' : ''}
              `}>
                {line.text}
              </div>
            ))}
            
            {!isGameOver && (
              <form onSubmit={handleCommandSubmit} className="flex items-center mt-2">
                <span className="text-green-500 mr-2">{currentMission?.os === 'Windows' ? 'C:\\>' : '$'}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-white font-mono"
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />
              </form>
            )}
          </div>

          {showHint && !isGameOver && (
            <div className="absolute bottom-6 right-6 z-30">
              <button 
                onClick={(e) => { e.stopPropagation(); showHintLine(); }}
                className="flex items-center gap-2 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-4 py-2 rounded-lg font-black uppercase tracking-widest text-xs hover:bg-yellow-500 hover:text-black transition-colors"
              >
                <HelpCircle size={14} /> Show Hint
              </button>
            </div>
          )}

          {isGameOver && (
            <div className="absolute bottom-6 right-6 z-30">
              <button 
                onClick={(e) => { e.stopPropagation(); restartGame(); }}
                className="bg-green-500 text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-green-400 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.4)]"
              >
                Restart Terminal
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .crt-effect::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          z-index: 2;
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.5);
        }
      `}} />
    </div>
  );
};

export default CommandLineChallenge;
