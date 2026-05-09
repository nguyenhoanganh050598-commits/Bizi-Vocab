import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { auth } from './lib/firebase';
import { getUserProfile, saveUserProfile } from './lib/firestoreService';
import { UserProfile, Level, LEVELS } from './types';
import { BookOpen, GraduationCap, Trophy, LogOut, ChevronRight, User as UserIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StudyView from './components/StudyView';
import Dashboard from './components/Dashboard';
import VocabBank from './components/VocabBank';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'landing' | 'level-select' | 'study' | 'dashboard' | 'vocab-bank'>('landing');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const p = await getUserProfile(u.uid);
        if (p) {
          setProfile(p);
          setView(p.currentLevel ? 'dashboard' : 'level-select');
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            xp: 0
          };
          await saveUserProfile(newProfile);
          setProfile(newProfile);
          setView('level-select');
        }
      } else {
        setView('landing');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const selectLevel = async (level: Level) => {
    if (profile) {
      const updated = { ...profile, currentLevel: level };
      await saveUserProfile(updated);
      setProfile(updated);
      setView('dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
          transition={{ repeat: Infinity, duration: 3 }}
          className="flex flex-col items-center gap-4"
        >
          <img 
            src="https://lh3.googleusercontent.com/d/1MmHEjNxmYiIY94xZieR__GM2FUVRpWQ2" 
            alt="Bizi Vocab" 
            className="w-24 h-24 object-contain drop-shadow-xl"
            referrerPolicy="no-referrer"
          />
          <span className="text-blue-950 font-black text-2xl tracking-tighter italic">Bizi Vocab</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-blue-50/30"
          >
            <div className="mb-10 w-32 h-32 flex items-center justify-center">
              <img 
                src="https://lh3.googleusercontent.com/d/1MmHEjNxmYiIY94xZieR__GM2FUVRpWQ2" 
                alt="Bizi Vocab" 
                className="w-full h-full object-contain drop-shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-6xl font-black text-blue-950 mb-4 tracking-tighter uppercase italic">Bizi Vocab</h1>
            <p className="text-xl text-slate-400 mb-10 max-w-md font-medium leading-relaxed">
              Master English vocabulary with adaptive spaced repetition and interactive exercises.
            </p>
            <button 
              onClick={login}
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-sm"
            >
              <UserIcon size={18} strokeWidth={3} />
              Login with Google
            </button>
          </motion.div>
        )}

        {view === 'level-select' && (
          <motion.div 
            key="level-select"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto p-8 pt-16"
          >
            <div className="mb-14 text-center">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-900/40 mb-4">Select Proficiency Level</h2>
              <h1 className="text-5xl font-black text-blue-950 mb-2 tracking-tighter">Choose Your Path</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {LEVELS.map((l) => (
                <button
                  key={l.level}
                  onClick={() => selectLevel(l.level)}
                  className="group bg-white border-2 border-slate-100 hover:border-blue-600 p-8 rounded-[32px] text-left transition-all hover:shadow-2xl hover:shadow-blue-50 active:scale-95 relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <span className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase mb-1 block opacity-60">{l.description}</span>
                    <h3 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">{l.level}</h3>
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full w-fit text-[10px] font-black uppercase tracking-widest">
                      <Trophy size={12} strokeWidth={3} />
                      IELTS {l.ielts}
                    </div>
                  </div>
                  <ChevronRight size={32} className="absolute bottom-6 right-6 text-slate-100 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'dashboard' && profile && (
          <Dashboard 
            profile={profile} 
            onStartReview={() => setView('study')} 
            onChangeLevel={() => setView('level-select')}
            onLogout={() => signOut(auth)}
            onViewBank={() => setView('vocab-bank')}
          />
        )}

        {view === 'vocab-bank' && profile && (
          <VocabBank 
            profile={profile}
            onBack={() => setView('dashboard')}
          />
        )}

        {view === 'study' && profile && (
          <StudyView 
            profile={profile} 
            onFinish={() => setView('dashboard')} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
