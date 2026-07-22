import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star } from 'lucide-react';

const COLORS = [
    'bg-[#FF6B6B] border-[#e65c5c]', 
    'bg-[#4ECDC4] border-[#3eb8b0]', 
    'bg-[#FF9F43] border-[#e68a35]', 
    'bg-[#A29BFE] border-[#8c85e6]', 
    'bg-[#FF85A2] border-[#e6738f]', 
    'bg-[#74B9FF] border-[#65a3e6]'
];

const ICONS = ['🐶', '🐰', '🦒', '🐘', '🦋', '🎈', '🌻', '🍎', '🍰', '🍪'];

export function GentleMathDrift({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [options, setOptions] = useState<{ id: number, value: number, color: string, icon: string, delay: number, left: string }[]>([]);
    
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [isCompleted, setIsCompleted] = useState(false);
    
    const [poppedId, setPoppedId] = useState<number | null>(null);

    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 10) + 5; // 5 to 14
        const n2 = Math.floor(Math.random() * (n1 + 1)); // 0 to n1
        const correctAnswer = n1 - n2;
        
        // Generate options (3 options)
        const opts = new Set<number>();
        opts.add(correctAnswer);
        
        while (opts.size < 3) {
            let fake = Math.floor(Math.random() * 15); // 0 to 14
            opts.add(fake);
        }
        
        const positions = ['20%', '50%', '80%']; // Left, Center, Right columns approximately
        
        const newOptions = Array.from(opts)
            .sort(() => Math.random() - 0.5)
            .map((val, idx) => ({
                id: Date.now() + idx,
                value: val,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                icon: ICONS[Math.floor(Math.random() * ICONS.length)],
                delay: Math.random() * 2, // 0 to 2 seconds delay
                left: positions[idx]
            }));
            
        setNum1(n1);
        setNum2(n2);
        setOptions(newOptions);
        setMessage({ text: '', type: '' });
        setPoppedId(null);
    };

    useEffect(() => {
        generateQuestion();
    }, []);

    const checkAnswer = (opt: { id: number, value: number, color: string, icon: string, delay: number, left: string }) => {
        if (message.type !== '' || poppedId !== null) return;
        
        const correctAnswer = num1 - num2;
        setPoppedId(opt.id);
        
        if (opt.value === correctAnswer) {
            setMessage({ text: 'Pop! Beautiful! ✨', type: 'success' });
            const newScore = score + 1;
            setScore(newScore);
            
            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    setIsCompleted(true);
                    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#FF6B6B', '#4ECDC4', '#FF9F43', '#A29BFE'] });
                }, 1000);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(generateQuestion, 1200);
            }
        } else {
            setMessage({ text: `Oops! Try again!`, type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
                setPoppedId(null);
            }, 1200);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-gradient-to-b from-[#d1f2ff] via-[#d1f2ff] to-[#c1f0c1] p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-sky-200 min-h-[600px] overflow-hidden">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 bg-white/70 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white/50 flex-wrap gap-4 relative z-20">
                <h2 className="text-xl md:text-2xl font-bold font-display text-emerald-600 uppercase tracking-wide flex items-center gap-2">
                    🎈 Gentle Math Drift
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question {Math.min(currentQuestion, MAX_SCORE)} / {MAX_SCORE}</span>
                        <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-emerald-800 bg-white/80 px-4 py-1 rounded-full shadow-sm mt-1 border-2 border-emerald-200">
                            <Star className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                            <span>{score}</span>
                        </div>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-emerald-400 text-emerald-700 font-bold hover:bg-emerald-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                            Skip Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-2xl relative z-10 flex-1">
                    
                    <div className="bg-white border-4 border-yellow-400 rounded-3xl p-6 md:p-8 w-fit shadow-[0_10px_20px_rgba(0,0,0,0.15)] relative flex flex-col items-center mb-6 z-20 mx-auto">
                        
                        {/* Equation Text */}
                        <div className="text-5xl md:text-7xl font-black text-slate-700 tracking-wider font-display">
                            {num1} - {num2} = ?
                        </div>
                    </div>

                    {/* Game Area (Balloons) */}
                    <div className="w-full h-full min-h-[350px] relative">
                        <AnimatePresence>
                            {options.map((opt) => (
                                poppedId !== opt.id && (
                                    <motion.button
                                        key={opt.id}
                                        initial={{ y: 400, opacity: 0 }}
                                        animate={{ 
                                            y: -600,
                                            opacity: 1,
                                            x: [-15, 15, -15] 
                                        }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ 
                                            y: { duration: 12, ease: "linear", delay: opt.delay },
                                            opacity: { duration: 0.5, delay: opt.delay },
                                            x: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: opt.delay },
                                            exit: { duration: 0.2 }
                                        }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => checkAnswer(opt)}
                                        disabled={message.type !== ''}
                                        className={`
                                            absolute flex flex-col items-center justify-center
                                            w-[100px] h-[130px] md:w-[120px] md:h-[150px]
                                            rounded-[50%_50%_50%_50%/45%_45%_55%_55%] 
                                            ${opt.color} border-4
                                            shadow-[inset_-8px_-8px_15px_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.1)]
                                            text-3xl font-black text-white drop-shadow-md
                                            cursor-pointer
                                            before:content-[''] before:absolute before:-bottom-3 before:left-1/2 before:-translate-x-1/2 
                                            before:w-0 before:h-0 before:border-l-[6px] before:border-r-[6px] before:border-b-[10px] 
                                            before:border-l-transparent before:border-r-transparent before:border-b-current
                                        `}
                                        style={{ left: opt.left, transform: 'translateX(-50%)' }}
                                    >
                                        {/* Balloon string */}
                                        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-1 h-20 border-l-2 border-slate-300 border-dashed opacity-70 z-[-1]"></div>
                                        {/* Balloon shine */}
                                        <div className="absolute top-3 left-4 w-5 h-10 bg-white/40 rounded-full rotate-[20deg]"></div>
                                        
                                        <div className="text-4xl drop-shadow-sm mb-1">{opt.icon}</div>
                                        <div className="text-3xl md:text-4xl relative z-10 text-white font-black drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]">{opt.value}</div>
                                    </motion.button>
                                )
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Feedback Message */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-full flex justify-center">
                        <AnimatePresence mode="wait">
                            {message.text && (
                                <motion.div
                                    key="feedback"
                                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-2xl border-4 shadow-xl ${
                                        message.type === 'success' ? 'bg-green-50 text-green-700 border-green-500' : 'bg-red-50 text-red-600 border-red-400'
                                    }`}
                                >
                                    {message.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                                    {message.text}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center w-full max-w-lg mx-auto bg-white/90 p-8 rounded-[3rem] border-4 border-emerald-400 shadow-xl relative z-30"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-emerald-600 drop-shadow-sm uppercase">Peaceful Master! 🍃</h1>
                    <p className="text-xl md:text-2xl text-slate-600 font-medium mb-4">You gently drifted through the math!</p>
                    
                    <div className="text-8xl md:text-9xl my-4 filter drop-shadow-lg flex gap-4 justify-center">
                        🦋🎈🦋
                    </div>
                    
                    {onComplete ? (
                        <Button 
                            size="lg" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-2xl px-12 py-8 rounded-full shadow-[0_6px_0_0_#059669] active:translate-y-2 active:shadow-none transition-all w-full border-none"
                            onClick={onComplete}
                        >
                            Next Game <Play className="ml-2 w-8 h-8 fill-current" />
                        </Button>
                    ) : (
                        <Button 
                            size="lg" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#059669] active:translate-y-1 active:shadow-none transition-all w-full border-none"
                            onClick={() => {
                                setScore(0);
                                setCurrentQuestion(1);
                                setIsCompleted(false);
                                generateQuestion();
                            }}
                        >
                            Drift Again! <Play className="ml-2 w-6 h-6 fill-current" />
                        </Button>
                    )}
                </motion.div>
            )}
        </div>
    );
}