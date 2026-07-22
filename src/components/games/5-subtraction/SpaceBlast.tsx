import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, Star, ChevronRight } from 'lucide-react';

const RANKS = [
    { name: "Moon Explorer", icon: "🧑‍🚀" },
    { name: "Galaxy Captain", icon: "🛸" },
    { name: "Cosmic Superstar", icon: "🌟" },
    { name: "Master of the Universe", icon: "👑" }
];

export function SpaceBlast({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [options, setOptions] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    const [isCompleted, setIsCompleted] = useState(false);
    const [wrongGuesses, setWrongGuesses] = useState<number[]>([]);
    
    const MAX_SCORE = 5;

    const playLaserSound = (isCorrect: boolean) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (isCorrect) {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    };

    const playChimeSound = () => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioCtx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + (index * 0.1));
            gain.gain.setValueAtTime(0.2, now + (index * 0.1));
            gain.gain.exponentialRampToValueAtTime(0.01, now + (index * 0.1) + 0.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + (index * 0.1));
            osc.stop(now + (index * 0.1) + 0.2);
        });
    };

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 5) + 3; // 3 to 7
        const n2 = Math.floor(Math.random() * (n1 + 1)); // 0 to n1
        const correctAnswer = n1 - n2;
        
        setWrongGuesses([]);
        
        const opts = new Set<number>();
        opts.add(correctAnswer);
        
        while (opts.size < 4) {
            let fake = Math.floor(Math.random() * 8); // 0 to 7
            opts.add(fake);
        }
        
        setNum1(n1);
        setNum2(n2);
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    };

    useEffect(() => {
        generateQuestion();
    }, []);

    const checkAnswer = (selected: number) => {
        const correctAnswer = num1 - num2;
        
        if (selected === correctAnswer) {
            playLaserSound(true);
            
            const newScore = score + 1;
            setScore(newScore);
            
            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    playChimeSound();
                    setIsCompleted(true);
                    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#f43f5e', '#0ea5e9', '#10b981', '#f59e0b'] });
                }, 800);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(generateQuestion, 1000);
            }
        } else {
            if (!wrongGuesses.includes(selected)) {
                playLaserSound(false);
                setWrongGuesses(prev => [...prev, selected]);
            }
        }
    };

    // Calculate rocket position based on score (0 to MAX_SCORE)
    const currentProgress = (score / MAX_SCORE) * 70;

    return (
        <div className="w-full max-w-lg mx-auto bg-gradient-to-b from-indigo-950 to-slate-900 p-4 md:p-8 rounded-[2rem] shadow-[0_0_20px_rgba(14,165,233,0.4)] flex flex-col items-center relative border-4 border-sky-500 min-h-[600px] overflow-hidden text-slate-100">
            
            {/* Header / HUD */}
            <div className="w-full flex justify-between items-center mb-4 bg-slate-900/80 p-3 rounded-2xl shadow-sm border border-slate-700">
                <div className="text-sm md:text-base font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-2xl">⭐</span> Score: {score}
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-sm md:text-base font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1">
                        <span className="text-2xl">🎯</span> Target: {MAX_SCORE}
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-slate-600 text-slate-300 font-bold hover:bg-slate-800 rounded-xl hidden md:flex h-9 px-3 bg-transparent" onClick={onComplete}>
                            Skip <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-sm flex-1">
                    
                    {/* Space Track */}
                    <div className="w-full h-20 bg-white/5 rounded-full my-4 relative flex items-center px-4 border border-sky-400/30 overflow-hidden">
                        <motion.div 
                            className="text-4xl absolute z-10"
                            animate={{ left: `${5 + currentProgress}%` }}
                            transition={{ type: "spring", stiffness: 50 }}
                        >
                            🚀
                        </motion.div>
                        <div className="text-4xl absolute right-[5%]">
                            🪐
                        </div>
                    </div>

                    <p className="font-bold text-slate-400 mb-2 text-center">Blast the star with the right answer!</p>

                    {/* Math Box */}
                    <div className="text-5xl md:text-6xl font-black text-white mb-8 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] tracking-wider">
                        {num1} - {num2}
                    </div>

                    {/* Answers Grid */}
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {options.map((opt, index) => {
                            const isWrong = wrongGuesses.includes(opt);
                            const isCorrect = score > 0 && opt === num1 - num2 && !wrongGuesses.includes(opt); 
                            
                            return (
                                <Button 
                                    key={`opt-${index}`}
                                    className={`
                                        h-20 text-4xl font-bold rounded-[1.5rem] transition-all bg-white/10
                                        ${isWrong 
                                            ? 'border-4 border-slate-600 text-slate-500 opacity-50 cursor-not-allowed transform scale-95' 
                                            : isCorrect
                                                ? 'border-4 border-emerald-500 bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)]'
                                                : 'border-4 border-rose-500 text-white hover:bg-white/20 shadow-[0_0_10px_rgba(244,63,94,0.3)] active:scale-95'
                                        }
                                    `}
                                    onClick={() => !isWrong && checkAnswer(opt)}
                                    disabled={isWrong || (isCorrect && currentQuestion > score)} // disabled briefly on correct
                                >
                                    {opt}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center w-full bg-slate-900/95 p-8 rounded-[2rem] shadow-xl relative z-20 border-4 border-emerald-500"
                >
                    <h2 className="text-3xl md:text-4xl font-black text-amber-500 drop-shadow-sm uppercase">🚀 Rank Unlocked! 🚀</h2>
                    <p className="text-lg md:text-xl text-slate-300 font-bold mb-4">{RANKS[Math.floor(Math.random() * RANKS.length)].name}</p>
                    
                    <motion.div 
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="text-8xl md:text-9xl my-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        {RANKS[Math.floor(Math.random() * RANKS.length)].icon}
                    </motion.div>
                    
                    <Button 
                            size="lg" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)] active:translate-y-1 active:shadow-none transition-all w-full border-none"
                            onClick={() => {
                                setScore(0);
                                setCurrentQuestion(1);
                                setIsCompleted(false);
                                generateQuestion();
                            }}
                        >
                            Repeat Game <Play className="ml-2 w-6 h-6 fill-current" />
                        </Button>
                </motion.div>
            )}
        </div>
    );
}