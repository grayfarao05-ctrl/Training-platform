import React from 'react';
import { Target, BookOpen, CheckSquare, Skull } from 'lucide-react';

export interface XPBreakdown {
  modules: number;
  tests: number;
  tasks: number;
  bosses: number;
}

interface XPBreakdownWidgetProps {
  userXP: number;
  breakdown: XPBreakdown;
}

const XPBreakdownWidget: React.FC<XPBreakdownWidgetProps> = ({ userXP, breakdown }) => {
  const total = userXP > 0 ? userXP : 1; // Prevent division by zero

  const getPercentage = (value: number) => Math.round((value / total) * 100);

  const items = [
    { label: 'Modules', value: breakdown.modules, color: 'bg-blue-500', icon: BookOpen },
    { label: 'Tests', value: breakdown.tests, color: 'bg-emerald-500', icon: Target },
    { label: 'Tasks', value: breakdown.tasks, color: 'bg-amber-500', icon: CheckSquare },
    { label: 'Bosses', value: breakdown.bosses, color: 'bg-violet-500', icon: Skull },
  ];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-3xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest">XP Breakdown</h3>
        <div className="text-xs font-mono font-bold text-[var(--text-muted)]">{userXP.toLocaleString()} Total</div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="h-2.5 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden flex mb-6 border border-[var(--border-color)]">
        {items.map((item, index) => (
          <div 
            key={index}
            className={`h-full ${item.color} transition-all duration-1000`}
            style={{ width: `${getPercentage(item.value)}%` }}
            title={`${item.label}: ${item.value} XP`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
              <div className={`w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center shrink-0 ${item.color.replace('bg-', 'text-')}`}>
                <Icon size={13} />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] truncate">{item.label}</div>
                <div className="text-xs font-black text-[var(--text-main)] font-mono">{getPercentage(item.value)}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default XPBreakdownWidget;
