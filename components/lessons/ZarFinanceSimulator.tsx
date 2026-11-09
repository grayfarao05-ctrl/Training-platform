import React, { useState, useEffect } from 'react';
import { FinanceSimLessonSection, PayslipHotspotItem } from '../../types';
import { 
  Wallet, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  FileSpreadsheet, 
  Sliders, 
  ShieldCheck,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ZarFinanceSimulatorProps {
  section: FinanceSimLessonSection;
  onRewardXP?: (xp: number) => void;
  onStageComplete?: () => void;
}

export const ZarFinanceSimulator: React.FC<ZarFinanceSimulatorProps> = ({
  section,
  onRewardXP,
  onStageComplete
}) => {
  const {
    simTitle,
    employeeName,
    roleTitle,
    grossMonthlyZar,
    payslipItems,
    auditQuestion,
    budgetTargetPercent,
    xpReward
  } = section;

  const [selectedItem, setSelectedItem] = useState<PayslipHotspotItem | null>(payslipItems[0] || null);
  const [inspectedItemIds, setInspectedItemIds] = useState<string[]>(
    payslipItems[0] ? [payslipItems[0].id] : []
  );

  // Interactive 50/30/20 Sliders (Start unbalanced so student has to balance it!)
  const [needsPct, setNeedsPct] = useState<number>(60);
  const [wantsPct, setWantsPct] = useState<number>(35);
  const savingsPct = Math.max(0, 100 - needsPct - wantsPct);

  const [selectedAuditOption, setSelectedAuditOption] = useState<number | null>(null);
  const [xpClaimed, setXpClaimed] = useState<boolean>(false);

  const netItem = payslipItems.find(i => i.category === 'net');
  const netPayZar = netItem ? netItem.amountZar : Math.round(grossMonthlyZar * 0.88);

  const formatZar = (amount: number) =>
    `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const isBudgetBalanced =
    needsPct <= budgetTargetPercent.needsMax &&
    wantsPct <= budgetTargetPercent.wantsMax &&
    savingsPct >= budgetTargetPercent.savingsMin &&
    needsPct + wantsPct + savingsPct === 100;

  const isAuditCorrect = selectedAuditOption === auditQuestion.correctAnswer;
  const isAllComplete = isBudgetBalanced && isAuditCorrect;

  useEffect(() => {
    if (isAllComplete) {
      if (!xpClaimed && onRewardXP) {
        onRewardXP(xpReward);
        setXpClaimed(true);
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
      }
      if (onStageComplete) {
        onStageComplete();
      }
    }
  }, [isAllComplete, xpClaimed, onRewardXP, xpReward, onStageComplete]);

  const handleSelectPayslipItem = (item: PayslipHotspotItem) => {
    setSelectedItem(item);
    if (!inspectedItemIds.includes(item.id)) {
      setInspectedItemIds(prev => [...prev, item.id]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-[#0B0D19]/90 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <Wallet size={12} />
              South African Payslip & ZAR Budget Lab
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Candidate: {employeeName} ({roleTitle})
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-1">
            {simTitle}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Inspect each statutory line item on the South African payslip, balance the monthly ZAR budget to the 50/30/20 rule, and complete the SARS/BCEA audit check.
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-right shrink-0">
          <div className="text-[10px] font-mono uppercase text-slate-400">Gross CTC Salary</div>
          <div className="text-base font-black text-emerald-400 font-mono">
            {formatZar(grossMonthlyZar)} / pm
          </div>
        </div>
      </div>

      {/* Part 1: Interactive SA Payslip Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-[#070A14] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                1. Interactive Statutory Payslip (Click rows to inspect BCEA / SARS rules)
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">
              {inspectedItemIds.length}/{payslipItems.length} Inspected
            </span>
          </div>

          <div className="space-y-2.5">
            {payslipItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const isInspected = inspectedItemIds.includes(item.id);
              const badgeColor =
                item.category === 'earnings'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : item.category === 'deduction'
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  : item.category === 'employer'
                  ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                  : 'text-cyan-300 bg-cyan-500/15 border-cyan-500/40';

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPayslipItem(item)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-4 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/50 border-cyan-400 shadow-lg'
                      : 'bg-slate-900/60 border-white/10 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-black border ${badgeColor}`}>
                      {item.category}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-white">
                      {item.label}
                    </span>
                    {isInspected && <CheckCircle2 size={13} className="text-emerald-400" />}
                  </div>

                  <span className="font-mono text-xs md:text-sm font-black text-white">
                    {item.category === 'deduction' ? '- ' : ''}
                    {formatZar(item.amountZar)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Statutory Inspector Details */}
        <div className="lg:col-span-5 bg-[#0B0D19]/95 border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
          {selectedItem ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                    Statutory Line Item Breakdown
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">{selectedItem.label}</h3>
                </div>
                <span className="font-mono text-sm font-black text-cyan-300">
                  {formatZar(selectedItem.amountZar)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Info size={14} className="text-cyan-400" />
                  What This Means for Your Pocket
                </div>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                  {selectedItem.explanation}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/35 border border-indigo-500/30 space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
                  South African Labour / SARS Law (BCEA / UIF Act)
                </div>
                <p className="text-xs text-indigo-100 leading-relaxed">
                  {selectedItem.bceaOrSarsRule}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Part 2: Interactive 50/30/20 Rands Budget Simulator */}
      <div className="bg-[#0B0D19]/95 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                2. Interactive ZAR Take-Home Budget Simulator (Net Pay: {formatZar(netPayZar)})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Drag the sliders so Needs ≤ {budgetTargetPercent.needsMax}%, Wants ≤ {budgetTargetPercent.wantsMax}%, and Savings/Emergency Fund ≥ {budgetTargetPercent.savingsMin}%.
            </p>
          </div>

          <div
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border flex items-center gap-2 self-start md:self-auto ${
              isBudgetBalanced
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            }`}
          >
            {isBudgetBalanced ? (
              <>
                <CheckCircle2 size={14} />
                <span>50/30/20 Target Balanced!</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} />
                <span>Adjust Sliders to Reach ≥{budgetTargetPercent.savingsMin}% Savings</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Needs Slider */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-white">
                Essential Needs (Rent, Taxi, Food)
              </span>
              <span className={`text-xs font-mono font-black ${needsPct <= budgetTargetPercent.needsMax ? 'text-emerald-400' : 'text-rose-400'}`}>
                {needsPct}%
              </span>
            </div>
            <div className="text-base font-mono font-black text-cyan-300">
              {formatZar(Math.round((netPayZar * needsPct) / 100))}
            </div>
            <input
              type="range"
              min={30}
              max={80}
              step={5}
              value={needsPct}
              onChange={(e) => {
                const nextNeeds = Number(e.target.value);
                setNeedsPct(nextNeeds);
                if (nextNeeds + wantsPct > 100) {
                  setWantsPct(100 - nextNeeds);
                }
              }}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="text-[10px] font-mono text-slate-400">
              Target: ≤ {budgetTargetPercent.needsMax}% of Net Pay
            </div>
          </div>

          {/* Wants Slider */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-white">
                Personal Wants (Takeaways, Subs)
              </span>
              <span className={`text-xs font-mono font-black ${wantsPct <= budgetTargetPercent.wantsMax ? 'text-emerald-400' : 'text-rose-400'}`}>
                {wantsPct}%
              </span>
            </div>
            <div className="text-base font-mono font-black text-indigo-300">
              {formatZar(Math.round((netPayZar * wantsPct) / 100))}
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={wantsPct}
              onChange={(e) => {
                const nextWants = Math.min(Number(e.target.value), 100 - needsPct);
                setWantsPct(nextWants);
              }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="text-[10px] font-mono text-slate-400">
              Target: ≤ {budgetTargetPercent.wantsMax}% of Net Pay
            </div>
          </div>

          {/* Savings & Emergency Fund (Auto-calculated remainder) */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-300">
                Emergency Fund & TFSA Savings
              </span>
              <span className={`text-xs font-mono font-black ${savingsPct >= budgetTargetPercent.savingsMin ? 'text-emerald-400' : 'text-amber-400'}`}>
                {savingsPct}%
              </span>
            </div>
            <div className="text-base font-mono font-black text-emerald-400">
              {formatZar(Math.round((netPayZar * savingsPct) / 100))}
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  savingsPct >= budgetTargetPercent.savingsMin ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, savingsPct * 3)}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Target: ≥ {budgetTargetPercent.savingsMin}% ({formatZar(Math.round((netPayZar * budgetTargetPercent.savingsMin) / 100))}/pm)
            </div>
          </div>
        </div>
      </div>

      {/* Part 3: Payslip Verification Question */}
      <div className="bg-[#0B0D19]/95 border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">
          3. Statutory Payslip Audit Verification
        </div>
        <h3 className="text-base md:text-lg font-black text-white">
          {auditQuestion.question}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {auditQuestion.options.map((opt, idx) => {
            const isSelected = selectedAuditOption === idx;
            const isRight = idx === auditQuestion.correctAnswer;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedAuditOption(idx)}
                className={`p-4 rounded-2xl border text-left text-xs md:text-sm font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? isRight
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold'
                      : 'bg-rose-950/40 border-rose-500 text-rose-200'
                    : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-indigo-500/40'
                }`}
              >
                <span>{opt}</span>
                {isSelected && isRight && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {selectedAuditOption !== null && (
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              isAuditCorrect
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            }`}
          >
            {auditQuestion.explanation}
          </div>
        )}
      </div>

      {isAllComplete && (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-1.5 animate-in zoom-in-95">
          <ShieldCheck size={28} className="text-emerald-400 mx-auto" />
          <div className="text-base font-black text-white uppercase">
            Financial & Statutory Audit Mastered (+{xpReward} XP)
          </div>
          <p className="text-xs text-slate-300">
            Both your 50/30/20 ZAR budget and statutory payslip audit are verified! Next stage unlocked.
          </p>
        </div>
      )}
    </div>
  );
};
export default ZarFinanceSimulator;

