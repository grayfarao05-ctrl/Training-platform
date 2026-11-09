import React, { useState, useEffect, useMemo } from 'react';
import { DiagramLessonSection, DiagramHotspot } from '../../types';
import { 
  Layers, 
  Info, 
  Wrench, 
  Award, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Crosshair,
  Eye,
  Cpu,
  Zap,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InteractiveDiagramProps {
  section: DiagramLessonSection;
  onStageComplete?: () => void;
}

type BlueprintTheme = 'motherboard' | 'laptop' | 'network' | 'finance' | 'ai-pipeline';

export const InteractiveDiagram: React.FC<InteractiveDiagramProps> = ({ section, onStageComplete }) => {
  const { diagramId, diagramTitle, description, hotspots, quizQuestions } = section;
  
  const [selectedHotspot, setSelectedHotspot] = useState<DiagramHotspot | null>(hotspots[0] || null);
  const [inspectedIds, setInspectedIds] = useState<string[]>(hotspots[0] ? [hotspots[0].id] : []);
  const [xrayLayer, setXrayLayer] = useState<'physical' | 'signal' | 'power'>('physical');
  const [mode, setMode] = useState<'explore' | 'challenge'>('explore');
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<number[]>([]);

  const blueprintTheme: BlueprintTheme = useMemo(() => {
    const sig = `${diagramId} ${diagramTitle} ${description}`.toLowerCase();
    if (sig.includes('payslip') || sig.includes('tax') || sig.includes('budget') || sig.includes('salary') || sig.includes('bcea') || sig.includes('contract')) {
      return 'finance';
    }
    if (sig.includes('prompt') || sig.includes('llm') || sig.includes('chatbot') || sig.includes('rag') || sig.includes('hallucination') || sig.includes('token')) {
      return 'ai-pipeline';
    }
    if (sig.includes('network') || sig.includes('vlan') || sig.includes('switch') || sig.includes('router') || sig.includes('osi') || sig.includes('subnet') || sig.includes('rack') || sig.includes('firewall')) {
      return 'network';
    }
    if (sig.includes('laptop') || sig.includes('clamshell') || sig.includes('so-dimm') || sig.includes('sodimm') || sig.includes('hinge') || sig.includes('display') || sig.includes('inverter') || sig.includes('webcam')) {
      return 'laptop';
    }
    return 'motherboard';
  }, [diagramId, diagramTitle, description]);

  const minRequiredInspections = Math.max(1, Math.min(3, hotspots.length));
  const isStageSatisfied = inspectedIds.length >= minRequiredInspections || (completedQuizzes.length > 0);

  useEffect(() => {
    if (isStageSatisfied && onStageComplete) {
      onStageComplete();
    }
  }, [isStageSatisfied, onStageComplete]);

  const handleHotspotClick = (spot: DiagramHotspot) => {
    if (!inspectedIds.includes(spot.id)) {
      setInspectedIds(prev => [...prev, spot.id]);
    }

    if (mode === 'explore') {
      setSelectedHotspot(spot);
      return;
    }

    if (quizQuestions && quizQuestions[currentQuizIdx]) {
      const targetId = quizQuestions[currentQuizIdx].targetHotspotId;
      if (spot.id === targetId) {
        setQuizFeedback({
          isCorrect: true,
          message: `Correct! You located ${spot.name}.`
        });
        setSelectedHotspot(spot);
        if (!completedQuizzes.includes(currentQuizIdx)) {
          const next = [...completedQuizzes, currentQuizIdx];
          setCompletedQuizzes(next);
          if (next.length === quizQuestions.length) {
            try {
              confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
            } catch {
              // ignore
            }
          }
        }
      } else {
        setQuizFeedback({
          isCorrect: false,
          message: `That's ${spot.name}. Hint: ${quizQuestions[currentQuizIdx].hint}`
        });
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0B0D19]/90 border border-white/10 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
              <Layers size={12} />
              Interactive Multi-Layer Blueprint
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Inspected: {inspectedIds.length} / {hotspots.length} Nodes
            </span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">
            {diagramTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* X-Ray Layer Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setXrayLayer('physical')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                xrayLayer === 'physical' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu size={12} />
              <span>Physical</span>
            </button>
            <button
              type="button"
              onClick={() => setXrayLayer('signal')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                xrayLayer === 'signal' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity size={12} />
              <span>Data Flow</span>
            </button>
            <button
              type="button"
              onClick={() => setXrayLayer('power')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                xrayLayer === 'power' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap size={12} />
              <span>X-Ray Rails</span>
            </button>
          </div>

          {/* Mode Toggle */}
          {quizQuestions && quizQuestions.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('explore');
                  setQuizFeedback(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === 'explore'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye size={13} />
                <span>Explore</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('challenge');
                  setQuizFeedback(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === 'challenge'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Crosshair size={13} />
                <span>Pin Challenge ({completedQuizzes.length}/{quizQuestions.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Challenge Prompt Banner */}
      {mode === 'challenge' && quizQuestions && quizQuestions[currentQuizIdx] && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
              <HelpCircle size={15} />
              <span>Target Challenge {currentQuizIdx + 1} of {quizQuestions.length}</span>
            </div>
            <p className="text-sm md:text-base font-bold text-white">
              {quizQuestions[currentQuizIdx].prompt}
            </p>
            {quizFeedback && (
              <div className={`flex items-center gap-2 text-xs font-medium mt-2 ${
                quizFeedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {quizFeedback.isCorrect ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                <span>{quizFeedback.message}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {quizQuestions.map((_, qIdx) => (
              <button
                key={qIdx}
                type="button"
                onClick={() => {
                  setCurrentQuizIdx(qIdx);
                  setQuizFeedback(null);
                }}
                className={`w-8 h-8 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                  currentQuizIdx === qIdx
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : completedQuizzes.includes(qIdx)
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {qIdx + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Split View: Interactive Blueprint Left, Inspector Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#060913] border border-white/10 rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-2xl">
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#070d19]">
            <svg
              viewBox="0 0 800 500"
              className="w-full h-full select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="bpGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.6" />
                </pattern>
              </defs>
              <rect width="800" height="500" fill="url(#bpGrid)" />

              {/* THEME 1: LAPTOP CLAMSHELL & INTERNAL BAY */}
              {blueprintTheme === 'laptop' && (
                <g>
                  {/* Top Clamshell Display Bezel */}
                  <rect x="90" y="20" width="620" height="175" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                  <rect x="110" y="38" width="580" height="140" rx="8" fill="#050b14" stroke="#1e293b" />
                  <circle cx="400" cy="29" r="5" fill="#22d3ee" />
                  <rect x="355" y="25" width="25" height="8" rx="3" fill="#334155" />
                  <rect x="420" y="25" width="25" height="8" rx="3" fill="#334155" />
                  {/* Wi-Fi Antenna Loops in Upper Display Bezel */}
                  <path d="M 120 165 L 120 45 L 240 45" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5,3" />
                  <path d="M 680 165 L 680 45 L 560 45" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeDasharray="5,3" />
                  {/* Dual Clamshell Hinges */}
                  <rect x="180" y="192" width="55" height="18" rx="4" fill="#475569" />
                  <rect x="565" y="192" width="55" height="18" rx="4" fill="#475569" />
                  {/* Bottom Chassis Internal Bay */}
                  <rect x="70" y="210" width="660" height="265" rx="16" fill="#0b1324" stroke="#6366f1" strokeWidth="2" />
                  {/* Li-Ion Battery Pack */}
                  <rect x="95" y="365" width="340" height="90" rx="8" fill="#090d16" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="265" y="415" fill="#fbbf24" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    LI-ION SMART BATTERY PACK (11.4V 58Wh)
                  </text>
                  {/* SO-DIMM Dual Slots */}
                  <rect x="330" y="235" width="135" height="50" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                  <rect x="330" y="292" width="135" height="50" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                  {/* M.2 NVMe Bay + Wi-Fi M.2 Key E */}
                  <rect x="500" y="240" width="190" height="52" rx="6" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
                  <rect x="500" y="315" width="90" height="65" rx="6" fill="#083344" stroke="#22d3ee" strokeWidth="1.5" />
                  {/* Centrifugal Fan & Copper Heatpipe */}
                  <circle cx="175" cy="285" r="52" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                  <path d="M 227 285 L 310 285" stroke="#ea580c" strokeWidth="12" strokeLinecap="round" />
                </g>
              )}

              {/* THEME 2: NETWORK RACK, SWITCH & VLAN TOPOLOGY */}
              {blueprintTheme === 'network' && (
                <g>
                  {/* Core Cloud / WAN Gateway */}
                  <rect x="290" y="25" width="220" height="75" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                  <text x="400" y="60" fill="#7dd3fc" fontSize="13" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    ISP / EDGE FIREWALL (UTM)
                  </text>
                  <text x="400" y="80" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    WAN: 196.25.1.1/30 • NAT + ACL
                  </text>

                  {/* 1U Patch Panel & Managed L3 Switch */}
                  <rect x="85" y="155" width="630" height="95" rx="10" fill="#0b1324" stroke="#6366f1" strokeWidth="2" />
                  <text x="110" y="180" fill="#a5b4fc" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    CORE L3 MANAGED SWITCH (802.1Q VLAN TRUNK + PoE+ 802.3at)
                  </text>
                  {Array.from({ length: 12 }).map((_, pIdx) => (
                    <rect
                      key={pIdx}
                      x={110 + pIdx * 48}
                      y={196}
                      width="36"
                      height="32"
                      rx="4"
                      fill="#050b14"
                      stroke={pIdx < 4 ? '#10b981' : pIdx < 8 ? '#38bdf8' : '#f59e0b'}
                      strokeWidth="1.5"
                    />
                  ))}

                  {/* Subnet / VLAN Zones */}
                  <rect x="75" y="315" width="195" height="145" rx="12" fill="#042f2e" stroke="#10b981" strokeWidth="1.5" />
                  <text x="172" y="345" fill="#6ee7b7" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    VLAN 10: CORPORATE LAN
                  </text>

                  <rect x="302" y="315" width="195" height="145" rx="12" fill="#082f49" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="400" y="345" fill="#7dd3fc" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    VLAN 20: VOIP & WIFI 6E
                  </text>

                  <rect x="530" y="315" width="195" height="145" rx="12" fill="#31102f" stroke="#e879f9" strokeWidth="1.5" />
                  <text x="627" y="345" fill="#f0abfc" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    VLAN 99: DMZ / SERVERS
                  </text>

                  {/* Fiber & Trunk Uplinks */}
                  <path d="M 400 100 L 400 155" stroke="#22d3ee" strokeWidth="3" strokeDasharray="6,4" />
                  <path d="M 172 250 L 172 315" stroke="#10b981" strokeWidth="2.5" />
                  <path d="M 400 250 L 400 315" stroke="#38bdf8" strokeWidth="2.5" />
                  <path d="M 627 250 L 627 315" stroke="#e879f9" strokeWidth="2.5" />
                </g>
              )}

              {/* THEME 3: SOUTH AFRICAN PAYSLIP & BCEA / SARS TAX ARCHITECTURE */}
              {blueprintTheme === 'finance' && (
                <g>
                  <rect x="60" y="30" width="680" height="440" rx="16" fill="#0b1120" stroke="#6366f1" strokeWidth="2" />
                  <rect x="85" y="55" width="630" height="65" rx="10" fill="#111827" stroke="#334155" />
                  <text x="110" y="85" fill="#ffffff" fontSize="15" fontFamily="monospace" fontWeight="bold">
                    SOUTH AFRICAN STATUTORY PAYSLIP & BCEA BREAKDOWN (ZAR)
                  </text>
                  <text x="110" y="106" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                    Employer: ITreal Tech Solutions (Pty) Ltd • Tax Year: 2026/2027 • Currency: R (ZAR)
                  </text>

                  {/* Gross Earnings Block */}
                  <rect x="85" y="140" width="300" height="175" rx="12" fill="#042f2e" stroke="#10b981" strokeWidth="1.5" />
                  <text x="105" y="168" fill="#6ee7b7" fontSize="12" fontFamily="monospace" fontWeight="bold">
                    GROSS EARNINGS (CTC)
                  </text>
                  <text x="105" y="200" fill="#e2e8f0" fontSize="11" fontFamily="monospace">
                    Basic Salary: R 14,500.00
                  </text>
                  <text x="105" y="228" fill="#e2e8f0" fontSize="11" fontFamily="monospace">
                    Standby Allowance: R 1,500.00
                  </text>

                  {/* Statutory Deductions Block */}
                  <rect x="415" y="140" width="300" height="175" rx="12" fill="#3b0764" stroke="#c084fc" strokeWidth="1.5" />
                  <text x="435" y="168" fill="#e9d5ff" fontSize="12" fontFamily="monospace" fontWeight="bold">
                    SARS & STATUTORY DEDUCTIONS
                  </text>
                  <text x="435" y="200" fill="#e2e8f0" fontSize="11" fontFamily="monospace">
                    PAYE Income Tax: R 1,380.00
                  </text>
                  <text x="435" y="228" fill="#e2e8f0" fontSize="11" fontFamily="monospace">
                    UIF (1% Employee): R 160.00
                  </text>

                  {/* Net Take-Home & 50/30/20 Allocation */}
                  <rect x="85" y="335" width="630" height="110" rx="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                  <text x="110" y="368" fill="#7dd3fc" fontSize="13" fontFamily="monospace" fontWeight="bold">
                    NET TAKE-HOME PAY: R 14,460.00 → 50% NEEDS / 30% WANTS / 20% SAVINGS
                  </text>
                </g>
              )}

              {/* THEME 4: AI PROMPT & RAG PIPELINE */}
              {blueprintTheme === 'ai-pipeline' && (
                <g>
                  <rect x="55" y="130" width="180" height="240" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                  <text x="145" y="165" fill="#7dd3fc" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    1. PROMPT CONTEXT
                  </text>
                  <text x="145" y="200" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    Role + Constraints
                  </text>
                  <text x="145" y="225" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    POPIA PII Redaction
                  </text>

                  <rect x="310" y="95" width="185" height="310" rx="16" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2.5" />
                  <text x="402" y="135" fill="#c7d2fe" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    2. LLM + RAG ENGINE
                  </text>
                  <circle cx="402" cy="245" r="55" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />

                  <rect x="565" y="130" width="180" height="240" rx="14" fill="#042f2e" stroke="#10b981" strokeWidth="2" />
                  <text x="655" y="165" fill="#6ee7b7" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    3. VERIFIED OUTPUT
                  </text>
                  <text x="655" y="205" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    Fact & Citation Check
                  </text>

                  <path d="M 235 250 L 310 250" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6,4" />
                  <path d="M 495 250 L 565 250" stroke="#10b981" strokeWidth="3" strokeDasharray="6,4" />
                </g>
              )}

              {/* THEME 5: DEFAULT ATX MOTHERBOARD & SYSTEM BUS */}
              {blueprintTheme === 'motherboard' && (
                <g>
                  <rect x="70" y="30" width="660" height="440" rx="16" fill="#0b1f17" stroke="#10b981" strokeWidth="2.5" />
                  {/* Rear I/O Cluster */}
                  <rect x="70" y="55" width="75" height="240" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                  {/* VRM Phases */}
                  <rect x="175" y="50" width="185" height="42" rx="6" fill="#334155" stroke="#94a3b8" />
                  {/* CPU Socket */}
                  <rect x="210" y="115" width="145" height="145" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
                  <rect x="235" y="140" width="95" height="95" rx="6" fill="#1e293b" stroke="#0284c7" />
                  <text x="282" y="192" fill="#38bdf8" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    CPU SOCKET
                  </text>
                  {/* 4x DDR5 DIMM Slots */}
                  <g transform="translate(415, 85)">
                    {[0, 22, 44, 66].map((offset, idx) => (
                      <rect
                        key={idx}
                        x={offset}
                        y={0}
                        width="14"
                        height="195"
                        rx="2"
                        fill={idx % 2 === 0 ? '#0284c7' : '#1e293b'}
                        stroke="#38bdf8"
                        strokeWidth="1"
                      />
                    ))}
                  </g>
                  {/* 24-Pin ATX Power */}
                  <rect x="655" y="115" width="38" height="140" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
                  {/* PCIe x16 Slot */}
                  <rect x="155" y="325" width="310" height="24" rx="4" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
                  {/* M.2 NVMe Slot */}
                  <rect x="210" y="280" width="160" height="30" rx="4" fill="#042f2e" stroke="#10b981" strokeWidth="1.5" />
                  {/* Chipset Heatsink */}
                  <rect x="515" y="315" width="125" height="105" rx="10" fill="#0f172a" stroke="#6366f1" strokeWidth="2" />
                </g>
              )}

              {/* X-Ray Overlay Layer: Data Flow or Power Rails */}
              {xrayLayer === 'signal' && (
                <g stroke="#22d3ee" strokeWidth="2.5" fill="none" opacity="0.85">
                  <path d="M 150 150 Q 400 80 650 180" strokeDasharray="8,6">
                    <animate attributeName="stroke-dashoffset" values="28;0" dur="1.2s" repeatCount="indefinite" />
                  </path>
                  <path d="M 220 340 Q 420 260 620 350" strokeDasharray="8,6">
                    <animate attributeName="stroke-dashoffset" values="28;0" dur="1.2s" repeatCount="indefinite" />
                  </path>
                </g>
              )}

              {xrayLayer === 'power' && (
                <g stroke="#f59e0b" strokeWidth="3" fill="none" opacity="0.85">
                  <circle cx="280" cy="185" r="70" fill="#ef4444" fillOpacity="0.14" stroke="#ef4444" strokeDasharray="4,4" />
                  <circle cx="560" cy="340" r="65" fill="#f59e0b" fillOpacity="0.14" stroke="#f59e0b" strokeDasharray="4,4" />
                </g>
              )}
            </svg>

            {/* Interactive Pin Overlay */}
            {hotspots.map((spot, idx) => {
              const isSelected = selectedHotspot?.id === spot.id;
              const isInspected = inspectedIds.includes(spot.id);
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => handleHotspotClick(spot)}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-20 cursor-pointer"
                  title={spot.name}
                >
                  <span
                    className={`absolute -inset-2 rounded-full animate-ping ${
                      isSelected
                        ? 'bg-cyan-400/60'
                        : mode === 'challenge'
                        ? 'bg-amber-400/50'
                        : 'bg-indigo-500/30 group-hover:bg-cyan-400/50'
                    }`}
                  />
                  <div
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-black transition-all shadow-lg border-2 ${
                      isSelected
                        ? 'bg-cyan-400 text-slate-950 border-white scale-125'
                        : isInspected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-200 hover:scale-110'
                        : mode === 'challenge'
                        ? 'bg-slate-900/90 text-amber-300 border-amber-400 hover:scale-110'
                        : 'bg-slate-900/90 text-cyan-300 border-cyan-400/80 hover:scale-110'
                    }`}
                  >
                    {idx + 1}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hotspot Legend Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {hotspots.map((spot, idx) => {
              const isSelected = selectedHotspot?.id === spot.id;
              const isInspected = inspectedIds.includes(spot.id);
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => handleHotspotClick(spot)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-2 border cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                      : isInspected
                      ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-cyan-400 font-bold">
                    {idx + 1}
                  </span>
                  <span>{spot.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Technical Specification Inspector */}
        <div className="lg:col-span-5">
          {selectedHotspot ? (
            <div className="bg-[#0B0D19]/95 border border-white/10 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  {selectedHotspot.category && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                      {selectedHotspot.category}
                    </span>
                  )}
                  <h3 className="text-xl font-black text-white mt-0.5">
                    {selectedHotspot.name}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                  NODE #{hotspots.findIndex(h => h.id === selectedHotspot.id) + 1}
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Info size={14} className="text-cyan-400" />
                  Functional Role
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {selectedHotspot.shortDescription}
                </p>
              </div>

              <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
                  Technical Architecture & Specs
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {selectedHotspot.fullSpecs}
                </p>
              </div>

              {selectedHotspot.troubleshootingNote && (
                <div className="bg-rose-950/25 border border-rose-500/30 rounded-2xl p-4 space-y-1.5">
                  <div className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Wrench size={14} />
                    Field Failure Symptoms & Diagnostics
                  </div>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    {selectedHotspot.troubleshootingNote}
                  </p>
                </div>
              )}

              {selectedHotspot.examRelevance && (
                <div className="bg-amber-950/25 border border-amber-500/30 rounded-2xl p-4 space-y-1.5">
                  <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Award size={14} />
                    Exam & Assessment Focus
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    {selectedHotspot.examRelevance}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0B0D19]/90 border border-white/10 rounded-3xl p-8 text-center text-slate-400">
              Click any numbered pin on the blueprint to inspect its specifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default InteractiveDiagram;
