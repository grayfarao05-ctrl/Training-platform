import React from 'react';
import { 
  Home,
  LayoutDashboard, 
  Layers, 
  BookOpen, 
  GraduationCap, 
  BarChart3, 
  Trophy, 
  User, 
  ShieldCheck, 
  LogOut,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ViewState, CourseId, UserStats } from '../types';
import { ITrealLogo } from './ITrealLogo';
import PWAInstallButton from './PWAInstallButton';
import { getCourseConfig } from '../courseConfig';
import { scrollToTop } from '../scrollUtils';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  userStats: UserStats | null;
  onLogout: () => void;
  activeCourse?: CourseId | null;
  onSelectCourse?: (course: CourseId) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  userStats,
  onLogout,
  activeCourse = null,
  onSelectCourse,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const isAdmin = userStats?.role === 'admin' || (userStats as any)?.isAdmin;
  const courseConfig = activeCourse ? getCourseConfig(activeCourse) : null;

  const primaryNavItems = [
    { id: 'home' as ViewState, label: 'Home', icon: Home },
    { id: 'my-courses' as ViewState, label: 'My Courses', icon: Layers },
    { id: 'gallery' as ViewState, label: 'My Gallery', icon: Sparkles },
  ];

  const courseNavItems = [
    { id: 'dashboard' as ViewState, label: 'Course Dashboard', icon: LayoutDashboard },
    { id: 'objectives' as ViewState, label: 'Content', icon: BookOpen },
    { id: 'test-center' as ViewState, label: 'Test Center', icon: GraduationCap },
    { id: 'performance' as ViewState, label: 'Performance', icon: BarChart3 },
  ];

  const bottomNavItems = [
    { id: 'leaderboard' as ViewState, label: 'Leaderboard', icon: Trophy },
    { id: 'profile' as ViewState, label: 'Profile', icon: User },
  ];

  const handleNavClick = (viewId: ViewState) => {
    setView(viewId);
    scrollToTop();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = userStats?.displayName || 'Student';
  const initials = getInitials(displayName);

  const renderNavButton = (item: { id: ViewState; label: string; icon: any }, accentColor?: string) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;
    const activeColor = accentColor || '#818CF8';

    return (
      <button
        key={item.id}
        onClick={() => handleNavClick(item.id)}
        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-200 text-left relative group cursor-pointer ${
          isActive
            ? 'text-white border border-indigo-400/35 shadow-[0_0_24px_rgba(79,70,229,0.28),inset_0_1px_0_rgba(255,255,255,0.22)]'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
        }`}
        style={
          isActive
            ? {
                background:
                  'radial-gradient(60% 90% at 50% 105%, rgba(165, 180, 252, 0.25) 0%, transparent 75%), linear-gradient(180deg, rgba(99, 102, 241, 0.28) 0%, rgba(79, 70, 229, 0.14) 100%)',
              }
            : undefined
        }
      >
        {isActive && (
          <div 
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-full"
            style={{
              backgroundColor: activeColor,
              boxShadow: `0 0 12px ${activeColor}`
            }}
          />
        )}
        <Icon 
          size={18} 
          className="shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={isActive ? { color: '#C7D2FE' } : undefined}
        />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#060813]/90 text-[var(--text-main)] border-r border-indigo-300/[0.12] select-none backdrop-blur-2xl relative overflow-hidden">
      {/* Subtle Top-Left Indigo Ambient Glow inside Sidebar */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-indigo-600/15 blur-[70px] pointer-events-none"
      />

      {/* Brand Header */}
      <div className="h-20 px-5 flex items-center justify-between border-b border-indigo-300/[0.10] relative z-10">
        <div 
          onClick={() => handleNavClick('home')} 
          className="cursor-pointer group flex flex-col justify-center transition-transform hover:scale-[1.02]"
        >
          <ITrealLogo size="sm" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-300/80 mt-0.5">
            Western Cape • Real Knowledge
          </span>
        </div>
        {isOpenMobile && (
          <button 
            type="button"
            onClick={onCloseMobile} 
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3.5 py-5 space-y-1.5 overflow-y-auto relative z-10" aria-label="Main Navigation">
        {/* Top Primary Items: Home & My Courses */}
        <div className="space-y-1">
          {primaryNavItems.map((item) => renderNavButton(item))}
        </div>

        {/* Active Course Group: Only shown when activeCourse is selected */}
        {activeCourse && courseConfig && (
          <div className="pt-3 pb-2 my-2 border-t border-indigo-300/[0.10]">
            <div className="px-3.5 py-2 mb-2 flex items-center justify-between gap-2 bg-indigo-500/[0.08] rounded-full border border-indigo-400/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <span 
                className="text-[10px] font-bold uppercase tracking-widest truncate text-indigo-200"
              >
                {courseConfig.name}
              </span>
              <span 
                className="w-2 h-2 rounded-full shrink-0 animate-pulse"
                style={{ backgroundColor: '#818CF8', boxShadow: '0 0 8px #818CF8' }}
              />
            </div>
            <div className="space-y-1">
              {courseNavItems.map((item) => renderNavButton(item, courseConfig.accentHex))}
            </div>
          </div>
        )}

        {/* Global Nav: Leaderboard & Profile */}
        <div className="pt-3 mt-2 border-t border-indigo-300/[0.10] space-y-1">
          {bottomNavItems.map((item) => renderNavButton(item))}
        </div>

        {/* Admin Hub - Only for administrators */}
        {isAdmin && (
          <div className="pt-2 mt-1">
            <button
              onClick={() => handleNavClick('admin')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-200 text-left relative group cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/35 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent'
              }`}
            >
              {currentView === 'admin' && (
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-5 bg-rose-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.8)]" />
              )}
              <ShieldCheck 
                size={18} 
                className={currentView === 'admin' ? 'text-rose-300 shrink-0' : 'text-slate-400 group-hover:text-rose-300 shrink-0 transition-colors'} 
              />
              <span className="truncate">Admin Hub</span>
            </button>
          </div>
        )}
      </nav>

      {/* Sidebar Footer with Student Card, Theme Toggle, Logout & Legal */}
      <div className="p-3.5 border-t border-indigo-300/[0.10] bg-[#050711]/90 space-y-2.5 relative z-10">
        {/* User Quick Info */}
        {userStats && (
          <div 
            onClick={() => handleNavClick('profile')}
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-indigo-300/15 hover:border-indigo-400/45 hover:bg-indigo-500/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all cursor-pointer group"
          >
            {userStats.photoURL ? (
              <img 
                src={userStats.photoURL} 
                alt={displayName} 
                className="w-9 h-9 rounded-xl object-cover shrink-0 border border-indigo-300/25" 
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-700 border border-indigo-300/40 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-[0_0_16px_rgba(79,70,229,0.45)]">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate tracking-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-semibold flex items-center gap-1">
                <span>{isAdmin ? 'Administrator' : `Level 0${userStats.level || 1}`}</span>
                <span>•</span>
                <span className="text-indigo-300 font-bold">{userStats.xp || 0} XP</span>
              </p>
            </div>
            <ChevronRight size={14} className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        )}

        {/* PWA Install Button (auto-hides when already installed) */}
        <PWAInstallButton className="w-full justify-center py-2" />

        {/* Logout Control */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={onLogout}
            className="w-full h-10 rounded-full flex items-center justify-center gap-2 bg-white/[0.03] text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-indigo-300/15 hover:border-rose-500/35 transition-all cursor-pointer text-xs font-bold uppercase tracking-wider"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut size={15} />
            <span>Log Out</span>
          </button>
        </div>

        {/* Legal & South African Privacy (POPIA) Links */}
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 pt-0.5">
          <button 
            type="button" 
            onClick={() => handleNavClick('privacy-policy')}
            className="hover:text-indigo-300 transition-colors cursor-pointer"
          >
            POPIA / Privacy
          </button>
          <span className="opacity-40">•</span>
          <button 
            type="button" 
            onClick={() => handleNavClick('terms-of-use')}
            className="hover:text-indigo-300 transition-colors cursor-pointer"
          >
            Terms
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 900px) */}
      <aside className="fixed left-0 top-0 h-full w-64 hidden min-[900px]:block z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-in Drawer (< 900px) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 min-[900px]:hidden">
          {/* Backdrop */}
          <div 
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />
          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-[80%] max-w-sm h-full shadow-2xl animate-in slide-in-from-left duration-250">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
