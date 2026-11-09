
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Timer, 
  Trophy, 
  ArrowLeft, 
  RefreshCw, 
  HelpCircle,
  Zap,
  Terminal,
  Globe,
  Server,
  Activity,
  Target
} from 'lucide-react';
import { UserStats } from '../../types';
import { db, OperationType, handleFirestoreError } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface PathFinderProps {
  userStats: UserStats;
  onBack: () => void;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface NetworkConfig {
  ip: string;
  subnet: string;
  gateway: string;
  dns: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  config: NetworkConfig;
  correctConfig: NetworkConfig;
  explanation: string;
  difficulty: Difficulty;
  type: 'gateway' | 'dns' | 'apipa' | 'subnet' | 'duplicate';
}

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

const PathFinder: React.FC<PathFinderProps> = ({ userStats, onBack }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'feedback' | 'end'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [userConfig, setUserConfig] = useState<NetworkConfig>({ ip: '', subnet: '', gateway: '', dns: '' });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [scenariosCompleted, setScenariosCompleted] = useState(0);

  const generateScenario = useCallback((diff: Difficulty): Scenario => {
    const types: Scenario['type'][] = ['gateway', 'dns', 'apipa', 'subnet', 'duplicate'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let ip = `192.168.1.${Math.floor(Math.random() * 250) + 2}`;
    let subnet = '255.255.255.0';
    let gateway = '192.168.1.1';
    let dns = '8.8.8.8';
    
    let correctIp = ip;
    let correctSubnet = subnet;
    let correctGateway = gateway;
    let correctDns = dns;
    
    let title = '';
    let description = '';
    let explanation = '';

    switch (type) {
      case 'gateway':
        title = 'Gateway Mismatch';
        description = 'The user reports they can access local files but cannot reach any external websites.';
        gateway = '192.168.0.1'; // Wrong subnet
        explanation = 'The default gateway must be on the same subnet as the IP address to route traffic externally.';
        break;
      case 'dns':
        title = 'DNS Resolution Failure';
        description = 'The user can ping 8.8.8.8 but cannot load google.com in their browser.';
        dns = '127.0.0.1'; // Loopback
        explanation = 'The DNS server was set to the loopback address, preventing domain name resolution.';
        break;
      case 'apipa':
        title = 'DHCP Failure';
        description = 'The workstation has no network connectivity at all after a recent router reboot.';
        ip = '169.254.12.45'; // APIPA
        gateway = '0.0.0.0';
        correctIp = '192.168.1.45';
        correctGateway = '192.168.1.1';
        explanation = 'The system assigned an APIPA address because it could not reach a DHCP server.';
        break;
      case 'subnet':
        title = 'Subnet Mask Error';
        description = 'The user can reach some local devices but not others on the same floor.';
        subnet = '255.255.0.0'; // Too broad
        correctSubnet = '255.255.255.0';
        explanation = 'An incorrect subnet mask can cause the device to look for local addresses in the wrong range.';
        break;
      case 'duplicate':
        title = 'IP Conflict';
        description = 'An error message "Duplicate IP address detected" appears on the screen.';
        ip = '192.168.1.10'; // Common static IP
        correctIp = `192.168.1.${Math.floor(Math.random() * 100) + 100}`;
        explanation = 'Two devices on the same network cannot share the same IP address.';
        break;
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      config: { ip, subnet, gateway, dns },
      correctConfig: { ip: correctIp, subnet: correctSubnet, gateway: correctGateway, dns: correctDns },
      explanation,
      difficulty: diff,
      type
    };
  }, []);

  const startLevel = (diff: Difficulty) => {
    const newScenario = generateScenario(diff);
    setScenario(newScenario);
    setUserConfig({ ...newScenario.config });
    setDifficulty(diff);
    setGameState('playing');
    setFeedback(null);
    setShowHint(false);
    setStartTime(Date.now());
    
    const timeLimit = diff === 'Easy' ? 120 : diff === 'Medium' ? 90 : 60;
    setTimeLeft(timeLimit);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleCheck = () => {
    if (!scenario) return;

    const isCorrect = 
      userConfig.ip === scenario.correctConfig.ip &&
      userConfig.subnet === scenario.correctConfig.subnet &&
      userConfig.gateway === scenario.correctConfig.gateway &&
      userConfig.dns === scenario.correctConfig.dns;

    if (isCorrect) {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      setTotalTimeTaken(prev => prev + timeTaken);
      
      let points = difficulty === 'Easy' ? 100 : difficulty === 'Medium' ? 200 : 300;
      const speedBonus = Math.max(0, timeLeft * 2);
      points += speedBonus;
      
      setScore(prev => prev + points);
      setScenariosCompleted(prev => prev + 1);

      let command = '';
      switch (scenario.type) {
        case 'gateway': command = 'ipconfig /renew'; break;
        case 'dns': command = 'ipconfig /flushdns'; break;
        case 'apipa': command = 'ipconfig /release && ipconfig /renew'; break;
        case 'subnet': command = 'netsh interface ip set address...'; break;
        case 'duplicate': command = 'ipconfig /release'; break;
      }

      setFeedback({ 
        isCorrect: true, 
        message: `${scenario.explanation}${command ? `\n\nRecommended Command: ${command}` : ''}` 
      });
      setGameState('feedback');
    } else {
      setMistakes(prev => prev + 1);
      setFeedback({ isCorrect: false, message: 'Configuration still incorrect. Check the subnet relationships.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const saveScore = async () => {
    try {
      await addDoc(collection(db, 'minigame_leaderboard'), {
        gameId: 'path-finder',
        uid: userStats.uid,
        username: userStats.displayName,
        score,
        time: totalTimeTaken,
        course: 'a-plus',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'minigame_leaderboard');
    }
  };

  const nextScenario = () => {
    if (scenariosCompleted >= 5) {
      saveScore();
      setGameState('end');
    } else {
      const newScenario = generateScenario(difficulty);
      setScenario(newScenario);
      setUserConfig({ ...newScenario.config });
      setFeedback(null);
      setShowHint(false);
      setGameState('playing');
      setStartTime(Date.now());
      const timeLimit = difficulty === 'Easy' ? 120 : difficulty === 'Medium' ? 90 : 60;
      setTimeLeft(timeLimit);
    }
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 p-12">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 bg-red-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-600/20">
          <Network size={48} className="text-red-600" />
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tighter text-white">Path <span className="text-red-600">Finder</span></h1>
        <p className="text-gray-400 max-w-md mx-auto font-medium">
          Master IPv4 troubleshooting. Identify misconfigurations, fix gateways, and resolve DNS issues like a pro technician.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {DIFFICULTIES.map(diff => (
          <button
            key={diff}
            onClick={() => startLevel(diff)}
            className="group relative bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem] hover:border-red-600/50 transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap size={64} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">{diff}</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">
              {diff === 'Easy' ? '1 Error • Hints • Choice' : diff === 'Medium' ? '1-2 Errors • No Hints' : 'Multiple Errors • Manual'}
            </p>
            <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-[0.2em]">
              Initialize <Zap size={14} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPlaying = () => {
    if (!scenario) return null;

    return (
      <div className="flex flex-col h-full">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-black/50 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Path <span className="text-red-600">Finder</span></h2>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Scenario {scenariosCompleted + 1} of 5</p>
            </div>
          </div>

          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <Timer className={timeLeft < 15 ? 'text-red-600 animate-pulse' : 'text-gray-500'} size={20} />
              <span className={`font-mono text-2xl font-black ${timeLeft < 15 ? 'text-red-600' : 'text-white'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-500" size={20} />
              <span className="text-2xl font-black text-white">{score.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* Left Panel: Scenario */}
          <div className="lg:col-span-3 p-8 border-r border-white/5 bg-zinc-900/30 overflow-y-auto">
            <div className="bg-black/40 border border-white/5 p-8 rounded-[2rem] space-y-6">
              <div className="flex items-center gap-3 text-red-600">
                <ShieldAlert size={24} />
                <h3 className="font-black uppercase tracking-tight">Support Ticket</h3>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-black text-white uppercase tracking-tight">{scenario.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed font-medium italic">
                  "{scenario.description}"
                </p>
              </div>
              <div className="pt-6 border-t border-white/5">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Network Context</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <Globe size={14} className="text-blue-500" />
                    <span>External Access Required</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <Server size={14} className="text-green-500" />
                    <span>Local Subnet: 192.168.1.0/24</span>
                  </div>
                </div>
              </div>
            </div>

            {difficulty === 'Easy' && (
              <button
                onClick={() => setShowHint(true)}
                className="w-full mt-8 p-6 bg-white/5 border border-white/5 rounded-2xl text-gray-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px]"
              >
                <HelpCircle size={16} /> Need a Hint?
              </button>
            )}
          </div>

          {/* Center Panel: Config Card */}
          <div className="lg:col-span-6 p-12 flex flex-col items-center justify-center bg-black relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent opacity-50" />
              
              <div className="flex items-center gap-4 mb-12">
                <div className="p-3 bg-red-600/10 rounded-2xl text-red-600">
                  <Terminal size={24} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white">IPv4 Configuration</h3>
              </div>

              <div className="space-y-8">
                {[
                  { label: 'IP Address', key: 'ip', icon: Activity },
                  { label: 'Subnet Mask', key: 'subnet', icon: ShieldAlert },
                  { label: 'Default Gateway', key: 'gateway', icon: Globe },
                  { label: 'DNS Server', key: 'dns', icon: Server }
                ].map(field => (
                  <div key={field.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <field.icon size={12} /> {field.label}
                      </label>
                      {showHint && userConfig[field.key as keyof NetworkConfig] !== scenario.correctConfig[field.key as keyof NetworkConfig] && (
                        <span className="text-[8px] font-black text-red-600 uppercase tracking-widest animate-pulse">Issue Detected</span>
                      )}
                    </div>
                    <div className="bg-black/50 border border-white/5 p-5 rounded-2xl font-mono text-xl text-white tracking-wider flex items-center justify-between group hover:border-red-600/30 transition-all">
                      {userConfig[field.key as keyof NetworkConfig]}
                      <div className="w-2 h-2 rounded-full bg-red-600/20 group-hover:bg-red-600 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="mt-12 flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
                <Activity size={12} /> Status: <span className="text-red-600">Disconnected</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Controls */}
          <div className="lg:col-span-3 p-8 border-l border-white/5 bg-zinc-900/30 flex flex-col">
            <div className="flex-1 space-y-8">
              <div className="text-center">
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Correction Terminal</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Apply the fix below</p>
              </div>

              <div className="space-y-6">
                {['ip', 'subnet', 'gateway', 'dns'].map(field => (
                  <div key={field} className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Modify {field.toUpperCase()}</label>
                    {difficulty === 'Hard' ? (
                      <input
                        type="text"
                        value={userConfig[field as keyof NetworkConfig]}
                        onChange={(e) => setUserConfig(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full bg-black border border-white/5 rounded-xl p-4 text-white font-mono focus:border-red-600/50 transition-all outline-none"
                      />
                    ) : (
                      <select
                        value={userConfig[field as keyof NetworkConfig]}
                        onChange={(e) => setUserConfig(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full bg-black border border-white/5 rounded-xl p-4 text-white font-mono focus:border-red-600/50 transition-all outline-none appearance-none"
                      >
                        <option value={scenario.config[field as keyof NetworkConfig]}>{scenario.config[field as keyof NetworkConfig]} (Current)</option>
                        <option value={scenario.correctConfig[field as keyof NetworkConfig]}>{scenario.correctConfig[field as keyof NetworkConfig]} (Suggested)</option>
                        <option value="192.168.1.254">192.168.1.254</option>
                        <option value="255.255.255.0">255.255.255.0</option>
                        <option value="1.1.1.1">1.1.1.1</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/5">
              <button
                onClick={handleCheck}
                className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-red-700 transition-all shadow-2xl shadow-red-600/20 active:scale-95"
              >
                Test Connection
              </button>
              <div className="text-center text-[10px] font-black text-gray-600 uppercase tracking-widest">
                Mistakes: <span className="text-red-600">{mistakes}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            >
              <div className={`max-w-md w-full p-12 rounded-[3rem] border shadow-2xl backdrop-blur-xl pointer-events-auto ${feedback.isCorrect ? 'bg-green-600/10 border-green-500/30' : 'bg-red-600/10 border-red-500/30'}`}>
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${feedback.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {feedback.isCorrect ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black uppercase tracking-tighter mb-2 ${feedback.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                      {feedback.isCorrect ? 'Connection Restored' : 'Connection Failed'}
                    </h3>
                    <p className="text-gray-300 font-medium leading-relaxed">
                      {feedback.message}
                    </p>
                  </div>
                  {feedback.isCorrect && (
                    <button
                      onClick={nextScenario}
                      className="w-full py-5 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-700 transition-all"
                    >
                      Next Scenario
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderEnd = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-12 p-12">
      <div className="text-center space-y-6">
        <div className="w-32 h-32 bg-yellow-500/10 rounded-[3rem] flex items-center justify-center mx-auto border border-yellow-500/20">
          <Trophy size={64} className="text-yellow-500" />
        </div>
        <h2 className="text-5xl font-black uppercase tracking-tighter text-white">Mission <span className="text-red-600">Complete</span></h2>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">You have mastered the network paths.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        {[
          { label: 'Final Score', value: score.toLocaleString(), icon: Trophy, color: 'text-yellow-500' },
          { label: 'Accuracy', value: `${Math.round((scenariosCompleted / (scenariosCompleted + mistakes)) * 100)}%`, icon: Target, color: 'text-blue-500' },
          { label: 'Total Time', value: `${Math.floor(totalTimeTaken / 60)}m ${totalTimeTaken % 60}s`, icon: Timer, color: 'text-red-600' }
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
          className="flex-1 py-6 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all flex items-center justify-center gap-3"
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

export default PathFinder;
