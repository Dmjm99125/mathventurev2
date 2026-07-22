import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star, Waves } from 'lucide-react';

const OCEAN_ITEMS = ['🫧', '🐠', '🐙', '🦀', '🐳', '🐢'];

export function UnderTheSea({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [icon1, setIcon1] = useState('🐠');
    const [icon2, setIcon2] = useState('🫧');
    const [options, setOptions] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    // Track which items have been counted by the user
    const [counted1, setCounted1] = useState<boolean[]>([]);
    const [counted2, setCounted2] = useState<boolean[]>([]);

    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [isCompleted, setIsCompleted] = useState(false);
    
    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const n2 = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const correctAnswer = n1 + n2;
        
        // Pick random ocean items
        const themeIcon1 = OCEAN_ITEMS[Math.floor(Math.random() * OCEAN_ITEMS.length)];
        let themeIcon2 = OCEAN_ITEMS[Math.floor(Math.random() * OCEAN_ITEMS.length)];
        if (themeIcon1 === themeIcon2) themeIcon2 = '🫧'; // Ensure a bit of variety
        
        setIcon1(themeIcon1);
        setIcon2(themeIcon2);
        
        // Reset counting states
        setCounted1(new Array(n1).fill(false));
        setCounted2(new Array(n2).fill(false));
        
        // Generate options
        const opts = new Set<number>();
        opts.add(correctAnswer);
        
        while (opts.size < 4) {
            let wrong = correctAnswer + (Math.floor(Math.random() * 5) - 2);
            if (wrong > 0 && wrong <= 10 && !opts.has(wrong)) {
                opts.add(wrong);
            }
        }
        
        setNum1(n1);
        setNum2(n2);
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
        setMessage({ text: '', type: '' });
    };

    useEffect(() => {
        generateQuestion();
    }, []);

    const toggleCounted = (group: 1 | 2, index: number) => {
        if (group === 1) {
            const newCounted = [...counted1];
            newCounted[index] = !newCounted[index];
            setCounted1(newCounted);
        } else {
            const newCounted = [...counted2];
            newCounted[index] = !newCounted[index];
            setCounted2(newCounted);
        }
    };

    const checkAnswer = (selected: number) => {
        if (message.type !== '') return;
        
        const correctAnswer = num1 + num2;
        
        if (selected === correctAnswer) {
            setMessage({ text: 'Wonderful! 🧜', type: 'success' });
            const newScore = score + 1;
            setScore(newScore);
            
            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    setIsCompleted(true);
                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#38bdf8', '#818cf8', '#ffffff'] });
                }, 1000);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(generateQuestion, 2000);
            }
        } else {
            setMessage({ text: `Try counting again! It's ${correctAnswer} 🐠`, type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 2000);
        }
    };

    const btnColors = [
        'bg-cyan-500 hover:bg-cyan-600 shadow-[0_6px_0_0_#0891b2]',
        'bg-sky-600 hover:bg-sky-700 shadow-[0_6px_0_0_#0369a1]',
        'bg-rose-500 hover:bg-rose-600 shadow-[0_6px_0_0_#be123c]',
        'bg-emerald-500 hover:bg-emerald-600 shadow-[0_6px_0_0_#047857]'
    ];

    return (
        <div className="w-full max-w-4xl mx-auto bg-sky-100 p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-sky-400 min-h-[500px]">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-sky-200 flex-wrap gap-4">
                <h2 className="text-xl md:text-2xl font-bold font-display text-sky-800 uppercase tracking-wide flex items-center gap-2">
                    <Waves className="w-8 h-8 text-sky-600" /> Under the Sea
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question {Math.min(currentQuestion, MAX_SCORE)} / {MAX_SCORE}</span>
                        <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-yellow-100 px-4 py-1 rounded-full shadow-sm mt-1 border-2 border-yellow-300">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            <span className="text-yellow-700">{score}</span>
                        </div>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-sky-400 text-sky-700 font-bold hover:bg-sky-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                            Skip Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            <p className="text-xl font-bold text-sky-800 mb-6 font-display drop-shadow-sm">Tap and pop all the ocean bubbles! 🫧🐳</p>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-2xl">
                    
                    <div className="bg-white/80 border-4 border-sky-400 rounded-[2rem] p-6 md:p-8 w-full shadow-lg relative flex flex-col items-center mb-6">
                        
                        {/* Ocean Field */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full bg-gradient-to-b from-sky-100 to-sky-300 p-6 rounded-3xl border-4 border-dashed border-sky-500 min-h-[160px] shadow-inner">
                            
                            {/* Group 1 */}
                            <div className="flex gap-4 flex-wrap justify-center p-3 min-w-[100px]">
                                {Array.from({ length: num1 }).map((_, i) => (
                                    <motion.button
                                        key={`s1-${i}`}
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 2 + (i % 2) * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                                        whileTap={{ scale: 1.3 }}
                                        onClick={() => toggleCounted(1, i)}
                                        className="relative text-5xl md:text-6xl cursor-pointer hover:scale-110 transition-transform"
                                    >
                                        <span className={counted1[i] ? 'opacity-50 grayscale scale-90 inline-block drop-shadow-[0_0_8px_#38bdf8]' : ''}>{icon1}</span>
                                        {counted1[i] && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 text-2xl drop-shadow-md">
                                                ✨
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                            
                            <span className="text-4xl font-bold text-sky-800">💧 + 💧</span>
                            
                            {/* Group 2 */}
                            <div className="flex gap-4 flex-wrap justify-center p-3 min-w-[100px]">
                                {Array.from({ length: num2 }).map((_, i) => (
                                    <motion.button
                                        key={`s2-${i}`}
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 2 + (i % 2) * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                                        whileTap={{ scale: 1.3 }}
                                        onClick={() => toggleCounted(2, i)}
                                        className="relative text-5xl md:text-6xl cursor-pointer hover:scale-110 transition-transform"
                                    >
                                        <span className={counted2[i] ? 'opacity-50 grayscale scale-90 inline-block drop-shadow-[0_0_8px_#38bdf8]' : ''}>{icon2}</span>
                                        {counted2[i] && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 text-2xl drop-shadow-md">
                                                ✨
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                        </div>
                    </div>

                    {/* Multiple Choice Options */}
                    <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-md">
                        {options.map((opt, index) => (
                            <Button 
                                key={index}
                                className={`${btnColors[index]} text-white font-bold text-4xl h-24 rounded-3xl active:translate-y-1 active:shadow-none transition-all border-none`}
                                onClick={() => checkAnswer(opt)}
                                disabled={message.type !== ''}
                            >
                                {opt}
                            </Button>
                        ))}
                    </div>

                    {/* Feedback Message */}
                    <div className="h-20 mt-6 flex items-center justify-center w-full">
                        <AnimatePresence mode="wait">
                            {message.text && (
                                <motion.div
                                    key="feedback"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-2xl md:text-3xl border-4 shadow-lg z-50 ${
                                        message.type === 'success' ? 'bg-sky-50 text-sky-700 border-sky-400' : 'bg-rose-50 text-rose-600 border-rose-400'
                                    }`}
                                >
                                    {message.type === 'success' ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
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
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center"
                >
                    <div className="text-8xl mb-4 animate-bounce">👑</div>
                    <h1 className="text-4xl md:text-5xl font-bold text-sky-800 drop-shadow-sm">Ocean Adventure Clear!</h1>
                    <p className="text-xl md:text-2xl text-sky-700 font-medium mb-4">Score: {score}/{MAX_SCORE}</p>
                    
                    <Button 
                            size="lg" 
                            className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#0284c7] active:translate-y-1 active:shadow-none transition-all"
                            onClick={() => {
                                setScore(0);
                                setCurrentQuestion(1);
                                setIsCompleted(false);
                                generateQuestion();
                            }}
                        > Repeat Game <Play className="ml-2 w-6 h-6 fill-current" />
                        </Button>
                </motion.div>
            )}
        </div>
    );
}
