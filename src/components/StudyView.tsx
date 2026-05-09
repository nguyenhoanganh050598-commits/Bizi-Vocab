import { useState, useEffect } from 'react';
import { Word, UserProfile, UserProgress } from '../types';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Info, Volume2, Check, X, ArrowLeft, RefreshCw, ChevronRight, GraduationCap, Trophy } from 'lucide-react';
import { generateWords, generateExercise } from '../services/geminiService';
import { updateWordProgress, saveWordsBatch, getWordsByLevel } from '../lib/firestoreService';

interface StudyViewProps {
  profile: UserProfile;
  onFinish: () => void;
}

export default function StudyView({ profile, onFinish }: StudyViewProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState<any[] | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [exerciseStep, setExerciseStep] = useState(0);
  const [score, setScore] = useState(0);

  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  useEffect(() => {
    loadSession();
  }, [profile.currentLevel]);

  const loadSession = async () => {
    setLoading(true);
    // Try to get words from DB or generate new ones
    let fetched = await getWordsByLevel(profile.currentLevel!);
    if (fetched.length < 10) {
      const generated = await generateWords(profile.currentLevel!, 15);
      await saveWordsBatch(generated);
      fetched = [...fetched, ...generated];
    }
    // Shuffle and pick 10
    setWords(fetched.sort(() => Math.random() - 0.5).slice(0, 10));
    setLoading(false);
  };

  const handleNext = (known: boolean) => {
    const currentWord = words[currentIndex];
    // Update local progress/state (Spaced Repetition logic would go here)
    const progress: UserProgress = {
      wordId: currentWord.id || currentWord.word,
      status: known ? 'known' : 'learning',
      lastReviewed: new Date().toISOString(),
      nextReview: new Date(Date.now() + (known ? 86400000 * 2 : 86400000)).toISOString(),
      interval: known ? 2 : 1,
      easeFactor: 2.5,
      attempts: 1
    };
    updateWordProgress(profile.uid, progress);

    if (currentIndex + 1 < words.length) {
      setCurrentIndex(prev => prev + 1);
      setShowMeaning(false);
    } else {
      startExercise();
    }
    setSessionCount(prev => prev + 1);
  };

  const startExercise = async () => {
    setLoading(true);
    const ex = await generateExercise(words);
    setExercise(ex);
    setLoading(false);
  };

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(option);
    setIsAnswered(true);
    
    if (option === exercise![exerciseStep].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (exerciseStep + 1 < exercise!.length) {
      setExerciseStep(prev => prev + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
    } else {
      setIsQuizFinished(true);
    }
  };

  const retryQuiz = () => {
    setExerciseStep(0);
    setScore(0);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setIsQuizFinished(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
        <p className="text-slate-500 animate-pulse">Preparing your custom session...</p>
      </div>
    );
  }

  if (isQuizFinished) {
    return (
      <div className="max-w-2xl mx-auto p-6 pt-12 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-slate-100 rounded-[40px] p-12 shadow-2xl shadow-slate-50"
        >
          <Trophy className="mx-auto text-blue-600 mb-6" size={64} />
          <h2 className="text-4xl font-black text-blue-950 mb-2 tracking-tighter">Quiz Complete!</h2>
          <p className="text-slate-500 mb-8 text-lg font-medium">
            You scored <span className="text-blue-600 font-bold">{score}</span> out of <span className="font-bold">{exercise?.length}</span>
          </p>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={onFinish}
              className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
            >
              Finish Session
            </button>
            <button 
              onClick={retryQuiz}
              className="w-full py-5 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
            >
              Retry Quiz
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (exercise) {
    const currentQ = exercise[exerciseStep];
    return (
      <div className="max-w-2xl mx-auto p-6 pt-12">
        <div className="mb-8 flex items-center justify-between">
          <button onClick={onFinish} className="text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <ArrowLeft size={18} /> Exit
          </button>
          <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full">
            Question {exerciseStep + 1} / {exercise.length}
          </div>
        </div>
        
        <div className="bg-white border-2 border-slate-100 rounded-[40px] p-10 shadow-2xl shadow-blue-50">
          <h3 className="text-2xl font-black text-blue-950 mb-8 tracking-tight leading-tight">{currentQ.question}</h3>
          <div className="grid grid-cols-1 gap-4 mb-8">
            {currentQ.options.map((opt: string) => {
              const isCorrectAtStep = opt === currentQ.correctAnswer;
              const isSelected = opt === selectedAnswer;
              
              let btnClass = "border-slate-100 text-slate-600 hover:border-blue-600 hover:bg-blue-50";
              if (isAnswered) {
                if (isCorrectAtStep) btnClass = "border-green-500 bg-green-50 text-green-700 font-bold";
                else if (isSelected) btnClass = "border-red-500 bg-red-50 text-red-700";
                else btnClass = "border-slate-50 text-slate-300 opacity-50";
              }

              return (
                <button
                  key={opt}
                  disabled={isAnswered}
                  onClick={() => handleAnswer(opt)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-medium flex justify-between items-center group ${btnClass}`}
                >
                  <span className="flex-1">{opt}</span>
                  {isAnswered && isCorrectAtStep && <Check size={20} className="text-green-600" />}
                  {isAnswered && isSelected && !isCorrectAtStep && <X size={20} className="text-red-500" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={`p-4 rounded-2xl text-sm font-medium ${selectedAnswer === currentQ.correctAnswer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {selectedAnswer === currentQ.correctAnswer 
                  ? "Perfect! That's the correct meaning."
                  : `Incorrect. The correct answer was: ${currentQ.correctAnswer}`
                }
              </div>
              <button 
                onClick={nextQuestion}
                className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {exerciseStep + 1 === exercise.length ? "View Results" : "Next Question"} 
                <ChevronRight size={18} strokeWidth={3} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  const word = words[currentIndex];
  return (
    <div className="max-w-4xl mx-auto p-8 pt-12 min-h-screen flex flex-col">
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onFinish} className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 transition-all border border-slate-100">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
              className="bg-blue-600 h-full"
            />
          </div>
        </div>
        <div className="text-[10px] font-black tracking-widest text-blue-600 uppercase bg-blue-50 px-4 py-2 rounded-full">
          Progress: {currentIndex + 1} / {words.length}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-12 items-center justify-center">
        {/* Card Section */}
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            <VocabCard 
              key={word.word}
              word={word} 
              onSwipe={handleNext} 
              showMeaning={showMeaning}
              onShowMeaning={() => setShowMeaning(true)}
            />
          </AnimatePresence>
        </div>

        {/* Controls Section */}
        <div className="w-full lg:w-64 flex flex-col gap-6">
          {showMeaning ? (
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => handleNext(false)}
              className="w-full py-8 rounded-[32px] bg-blue-600 text-white shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95"
            >
              Continue <ChevronRight size={18} strokeWidth={3} />
            </motion.button>
          ) : (
            <>
              <div className="hidden lg:block p-6 bg-slate-50 rounded-[32px] border border-slate-100 italic text-slate-400 text-xs font-medium text-center">
                Swipe left if you know the word, or right to reveal meaning.
              </div>
              <button 
                onClick={() => handleNext(true)}
                className="w-full py-6 rounded-[32px] border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all flex items-center justify-center gap-3"
              >
                <X size={18} strokeWidth={3} /> I Know This
              </button>
              <button 
                onClick={() => setShowMeaning(true)}
                className="w-full py-6 rounded-[32px] bg-blue-600 text-white shadow-xl shadow-blue-100 font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
              >
                <Info size={18} strokeWidth={3} /> Learn Word
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface VocabCardProps {
  word: Word;
  onSwipe: (known: boolean) => void;
  showMeaning: boolean;
  onShowMeaning: () => void;
  key?: string;
}

function VocabCard({ word, onSwipe, showMeaning, onShowMeaning }: VocabCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-100, 100], [-10, 10]);
  const opacity = useTransform(x, [-100, -50, 0, 50, 100], [0, 1, 1, 1, 0]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -100) onSwipe(true);
    else if (info.offset.x > 100) onShowMeaning();
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.98 }}
      className={`w-full bg-white border-2 border-slate-100 rounded-[48px] p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] cursor-grab active:cursor-grabbing flex flex-col items-center justify-center min-h-[500px] text-center relative overflow-hidden ${showMeaning ? 'ring-4 ring-blue-600/10' : ''}`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-12 text-slate-50 opacity-10 pointer-events-none">
        <GraduationCap size={200} strokeWidth={1} />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest mb-6">
          {word.partOfSpeech}
        </div>
        
        <h2 className="text-7xl font-black text-blue-950 mb-2 tracking-tighter leading-none">{word.word}</h2>
        <p className="text-xl font-medium text-slate-400 font-mono italic tracking-wide mb-10">
          {word.ipa}
        </p>

        {showMeaning ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-10 pt-10 border-t border-slate-50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 opacity-50">Vietnamese Meaning</p>
                <p className="text-2xl font-black text-slate-900 leading-tight">{word.vietnameseMeaning}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 opacity-50">Word Family</p>
                <div className="flex flex-wrap gap-2">
                  {word.wordFamily?.map(f => (
                    <span key={f} className="text-[10px] font-black bg-slate-50 px-3 py-1.5 rounded-lg text-slate-500 uppercase tracking-wider">{f}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-left bg-slate-50 p-6 rounded-[24px]">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 opacity-50">Example Context</p>
              <p className="text-slate-600 text-sm font-medium italic border-l-4 border-blue-600 pl-4 leading-relaxed">
                "{word.definition}"
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="mt-12 flex items-center gap-3 text-slate-300">
            <div className="w-12 h-[1px] bg-slate-100"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Swipe to learn</span>
            <div className="w-12 h-[1px] bg-slate-100"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
