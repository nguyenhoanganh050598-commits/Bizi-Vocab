import { useState, useEffect } from 'react';
import { UserProfile, Word, UserProgress } from '../types';
import { getUserProgress, getWordsByIds } from '../lib/firestoreService';
import { ArrowLeft, BookOpen, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';

interface VocabBankProps {
  profile: UserProfile;
  onBack: () => void;
}

export default function VocabBank({ profile, onBack }: VocabBankProps) {
  const [loading, setLoading] = useState(true);
  const [bankWords, setBankWords] = useState<(Word & { status: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadBank() {
      const progress = await getUserProgress(profile.uid);
      if (progress.length === 0) {
        setLoading(false);
        return;
      }

      const wordIds = progress.map(p => p.wordId);
      const details = await getWordsByIds(wordIds);
      
      const combined = details.map(d => {
        const p = progress.find(prog => prog.wordId === d.id);
        return {
          ...d,
          status: p?.status || 'learning'
        };
      });

      setBankWords(combined);
      setLoading(false);
    }

    loadBank();
  }, [profile.uid]);

  const filteredWords = bankWords.filter(w => 
    w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.vietnameseMeaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-8 pt-12">
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 transition-all border border-slate-100"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-4">
            <img 
              src="https://lh3.googleusercontent.com/d/1MmHEjNxmYiIY94xZieR__GM2FUVRpWQ2" 
              alt="Bizi Vocab" 
              className="w-12 h-12 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-4xl font-black text-blue-950 tracking-tighter">Vocab Bank</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Your personal dictionary</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 px-6 py-3 rounded-2xl flex items-center gap-4">
          <BookOpen className="text-blue-600" size={20} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-blue-900/40">Total Words</span>
            <span className="text-lg font-black text-blue-900 leading-none">{bankWords.length}</span>
          </div>
        </div>
      </header>

      <div className="mb-10 relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text"
          placeholder="Search words or meanings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] pl-16 pr-6 py-5 text-lg font-medium focus:outline-none focus:border-blue-600 transition-all"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-[32px]"></div>
          ))}
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
          <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-400">No words found in your bank.</h3>
          <p className="text-slate-400 text-sm">Start learning to populate your collection!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWords.map((word) => (
            <motion.div 
              layout
              key={word.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-slate-50 p-8 rounded-[32px] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-50 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">
                  {word.level} • {word.partOfSpeech}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${word.status === 'known' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                  {word.status}
                </span>
              </div>
              <h3 className="text-2xl font-black text-blue-950 mb-1 group-hover:text-blue-600 transition-colors">{word.word}</h3>
              <p className="text-sm font-mono text-slate-400 italic mb-4">{word.ipa}</p>
              <div className="pt-4 border-t border-slate-50">
                <p className="text-sm font-bold text-slate-900 mb-1">{word.vietnameseMeaning}</p>
                <p className="text-xs text-slate-400 italic line-clamp-2">"{word.definition}"</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
