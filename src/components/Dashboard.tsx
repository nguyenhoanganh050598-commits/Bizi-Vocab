import { useState, useEffect } from 'react';
import { UserProfile, LEVELS } from '../types';
import { BookOpen, Trophy, Settings, LogOut, ChevronRight, Play, Flame, Target, Library } from 'lucide-react';
import { motion } from 'motion/react';
import { getUserProgress, getWordsByLevel } from '../lib/firestoreService';

interface DashboardProps {
  profile: UserProfile;
  onStartReview: () => void;
  onChangeLevel: () => void;
  onLogout: () => void;
  onViewBank: () => void;
}

export default function Dashboard({ profile, onStartReview, onChangeLevel, onLogout, onViewBank }: DashboardProps) {
  const [stats, setStats] = useState({
    learned: 0,
    knownInLevel: 0,
    totalInLevel: 1, // Avoid division by zero
  });

  useEffect(() => {
    async function loadStats() {
      const progress = await getUserProgress(profile.uid);
      const totalCount = progress.length;
      const currentLevelInfo = LEVELS.find(l => l.level === profile.currentLevel) || LEVELS[0];

      setStats({
        learned: totalCount,
        knownInLevel: progress.filter(p => p.status === 'known').length,
        totalInLevel: currentLevelInfo.requiredWords,
      });
    }
    loadStats();
  }, [profile.uid, profile.currentLevel]);

  const levelInfo = LEVELS.find(l => l.level === profile.currentLevel);

  return (
    <div className="max-w-5xl mx-auto p-8 pt-16 space-y-10">
      {/* Header */}
      <header className="flex justify-between items-center mb-10 pb-10 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center">
            <img 
              src="https://lh3.googleusercontent.com/d/1MmHEjNxmYiIY94xZieR__GM2FUVRpWQ2" 
              alt="Bizi Vocab" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-blue-950 tracking-tighter italic uppercase">Bizi Vocab</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-0.5">Student Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col gap-1 items-end min-w-[140px]">
            <div className="flex justify-between w-full text-[9px] font-black uppercase tracking-widest text-slate-400">
              <span>{profile.currentLevel} Goal</span>
              <span className="text-blue-600">{Math.round((stats.learned / stats.totalInLevel) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (stats.learned / stats.totalInLevel) * 100)}%` }}
              ></div>
            </div>
          </div>
          <button 
            onClick={onViewBank}
            className="flex items-center gap-2 bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
          >
            <Library size={16} /> Vocab Bank
          </button>
          <div className="h-10 w-[1px] bg-slate-100 mx-2"></div>
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">XP Points</span>
            <span className="text-xl font-black text-blue-600 leading-none">{profile.xp}</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100"
          >
            <LogOut size={20} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Main Action Card */}
      <div className="flex flex-col lg:flex-row gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 bg-white border-4 border-blue-600 rounded-[40px] p-10 text-slate-900 shadow-2xl shadow-blue-50 relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">Current Mastery</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IELTS {levelInfo?.ielts}</span>
            </div>
            <h2 className="text-7xl font-black mb-4 tracking-tighter text-blue-950 leading-none">{profile.currentLevel}</h2>
            <p className="text-slate-500 mb-10 max-w-sm text-lg font-medium leading-relaxed">
              {levelInfo?.description} level vocabulary. Push your boundaries and reach fluency.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onStartReview}
                className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-2 shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest text-sm"
              >
                <Play size={18} fill="currentColor" /> Start Session
              </button>
              <button 
                onClick={onChangeLevel}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-8 py-5 rounded-2xl font-black transition-all uppercase tracking-widest text-xs"
              >
                Switch Level
              </button>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 p-10 text-blue-50 group-hover:text-blue-100 transition-colors pointer-events-none">
            <Target size={120} strokeWidth={4} />
          </div>
        </motion.div>

        {/* Stats Sidebar */}
        <aside className="lg:w-80 flex flex-col gap-6">
          <div className="p-8 bg-blue-950 rounded-[32px] text-white shadow-xl shadow-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">CEFR Progress</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-5xl font-black italic tracking-tighter leading-none">
                {Math.round((stats.learned / stats.totalInLevel) * 100)}%
              </span>
              <span className="text-lg font-black uppercase tracking-widest opacity-60 pb-1">Goal</span>
            </div>
            <div className="h-1.5 bg-blue-800 rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-blue-400 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (stats.learned / stats.totalInLevel) * 100)}%` }}
              ></div>
            </div>
            <p className="text-[10px] font-bold text-blue-300 mt-4 uppercase tracking-widest leading-relaxed">
              {stats.learned} of {stats.totalInLevel} words learned
            </p>
          </div>

          <div className="p-8 bg-white border border-slate-100 rounded-[32px] flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Learning Activity</p>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                  <span className="text-slate-900">Vocabulary Reach</span>
                  <span className="text-blue-600">{stats.learned} Words</span>
                </div>
                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-blue-600/10">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-1000"
                      style={{ width: `${Math.min(100, (stats.learned / 16000) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-[9px] font-medium text-slate-400 mt-2 italic">Goal: 16,000 words (C2 Proficiency)</p>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                    <Flame size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Current Streak</p>
                    <p className="text-lg font-black text-slate-900 leading-none">14 Days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
