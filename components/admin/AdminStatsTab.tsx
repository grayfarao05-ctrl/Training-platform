import React from 'react';
import { UserStats, Objective, CourseId } from '../../types';
import { getCourseConfig, getCourseProgress } from '../../courseConfig';
import { Users, Award, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminStatsTabProps {
  users: UserStats[];
  objectives: Objective[];
  setAdminFeedback: (msg: string | null) => void;
  course?: CourseId;
}

export const AdminStatsTab: React.FC<AdminStatsTabProps> = ({
  users,
  objectives,
  setAdminFeedback,
  course = 'a-plus'
}) => {
  const courseConfig = getCourseConfig(course);

  // Analytics Calculations scoped to active course
  const totalXP = users.reduce((acc, u) => acc + (u.xp || 0), 0);
  const avgXP = users.length ? Math.round(totalXP / users.length) : 0;
  const avgReadiness = users.length ? Math.round(users.reduce((acc, u) => acc + (getCourseProgress(u, course).examReadiness || 0), 0) / users.length) : 0;
  const totalCompletions = users.reduce((acc, u) => acc + (getCourseProgress(u, course).completedObjectives?.length || 0), 0);
  
  const systemStats = [
    { label: 'Total Candidates', value: users.length, icon: Users, color: 'text-blue-500' },
    { label: 'Avg System XP', value: avgXP.toLocaleString(), icon: Award, color: 'text-yellow-500' },
    { label: `${courseConfig.shortLabel} Readiness`, value: `${avgReadiness}%`, icon: TrendingUp, color: 'text-green-500' },
    { label: `${courseConfig.shortLabel} Completions`, value: totalCompletions, icon: CheckCircle2, color: 'text-purple-500' }
  ];

  return (
    <motion.div 
      key="stats"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemStats.map((stat, i) => (
          <div key={i} className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2rem] border border-[var(--border-color)] relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={80} />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-black mb-3">{stat.label}</p>
            <div className={`text-3xl md:text-4xl font-black tracking-tighter ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[var(--bg-card)] p-6 md:p-10 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 text-[var(--text-main)]">System <span style={{ color: courseConfig.accentHex }}>Performance Gaps</span></h3>
          <div className="space-y-6">
            {objectives.slice(0, 5).map(obj => {
              const completions = users.filter(u => u.completedObjectives?.includes(obj.id)).length;
              const completionRate = users.length ? Math.round((completions / users.length) * 100) : 0;
              
              return (
                <div key={obj.id} className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest font-black">
                    <span className="text-[var(--text-muted)]">{obj.id} {obj.title}</span>
                    <span className={completionRate < 30 ? 'text-rose-500' : 'text-emerald-500'}>{completionRate}% Mastery</span>
                  </div>
                  <div className="h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-color)]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      className={`h-full ${completionRate < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[var(--bg-card)] p-6 md:p-8 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-6 text-[var(--text-main)]">Top <span style={{ color: courseConfig.accentHex }}>Performers</span></h3>
            <div className="space-y-4">
              {[...users].sort((a, b) => b.xp - a.xp).slice(0, 5).map((user, i) => (
                <div key={user.uid} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-surface)] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-muted)] font-black italic text-xs">#0{i+1}</span>
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs overflow-hidden text-white"
                      style={{ backgroundColor: courseConfig.accentHex }}
                    >
                      {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : user.displayName[0]}
                    </div>
                    <span className="font-bold text-sm uppercase tracking-tight text-[var(--text-main)]">{user.displayName}</span>
                  </div>
                  <span className="font-black text-sm" style={{ color: courseConfig.accentHex }}>{user.xp.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminStatsTab;
