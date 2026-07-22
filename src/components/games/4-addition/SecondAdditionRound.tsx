import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star, Target } from 'lucide-react';

export function SecondAdditionRound({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [options, setOptions] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [isCompleted, setIsCompleted] = useState(false);
    
    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const n2 = Math.floor(Math.random() * 4) + 1; // 1 to 4
        const correctAnswer = n1 + n2;
        
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

    const checkAnswer = (selected: number) => {
        if (message.type !== '') return;
        
        const correctAnswer = num1 + num2;
        
        if (selected === correctAnswer) {
            setMessage({ text: 'Great Job! 🎈', type: 'success' });
            const newScore = score + 1;
            setScore(newScore);
            
            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    setIsCompleted(true);
                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                }, 1000);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(generateQuestion, 1500);
            }
        } else {
            setMessage({ text: `Oops! It was ${correctAnswer}`, type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 1500);
        }
    };

    const balloonColors = [
        'bg-red-400 hover:bg-red-500 shadow-[0_6px_0_0_#ef4444]',
        'bg-teal-400 hover:bg-teal-500 shadow-[0_6px_0_0_#14b8a6]',
        'bg-sky-400 hover:bg-sky-500 shadow-[0_6px_0_0_#0ea5e9]',
        'bg-pink-400 hover:bg-pink-500 shadow-[0_6px_0_0_#ec4899]'
    ];

    return (
        <div className="w-full max-w-4xl mx-auto bg-cyan-50 p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-cyan-300 min-h-[500px]">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-cyan-200 flex-wrap gap-4">
                <h2 className="text-xl md:text-2xl font-bold font-display text-cyan-700 uppercase tracking-wide flex items-center gap-2">
                    <Target className="w-8 h-8 text-cyan-500" /> Addition Round 2
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Question {Math.min(currentQuestion, MAX_SCORE)} / {MAX_SCORE}</span>
                        <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-cyan-100 px-4 py-1 rounded-full shadow-sm mt-1">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            <span className="text-cyan-700">{score}</span>
                        </div>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-cyan-400 text-cyan-700 font-bold hover:bg-cyan-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                            Skip Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-2xl">
                    
                    <div className="bg-white border-4 border-cyan-400 rounded-[2rem] p-6 md:p-8 w-full shadow-lg relative flex flex-col items-center mb-6">
                        
                        {/* Math Equation */}
                        <div className="flex items-center justify-center gap-4 text-6xl md:text-7xl font-bold text-slate-700 mb-8 font-display">
                            <span className="text-indigo-700">{num1}</span>
                            <span className="text-slate-400">+</span>
                            <span className="text-indigo-700">{num2}</span>
                            <span className="text-slate-400">=</span>
                            <span className="text-slate-300">?</span>
                        </div>

                        {/* Visual Dots */}
                        <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap w-full bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 min-h-[100px]">
                            <div className="flex gap-2">
                                {Array.from({ length: num1 }).map((_, i) => (
                                    <motion.div
                                        key={`n1-${i}`}
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-400 shadow-inner"
                                        style={{ boxShadow: 'inset -3px -3px 0 rgba(0,0,0,0.15)' }}
                                    />
                                ))}
                            </div>
                            <span className="text-2xl font-bold text-slate-300">and</span>
                            <div className="flex gap-2">
                                {Array.from({ length: num2 }).map((_, i) => (
                                    <motion.div
                                        key={`n2-${i}`}
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-500 shadow-inner"
                                        style={{ boxShadow: 'inset -3px -3px 0 rgba(0,0,0,0.15)' }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Multiple Choice Options */}
                    <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-md">
                        {options.map((opt, index) => (
                            <Button 
                                key={index}
                                className={`${balloonColors[index]} text-white font-bold text-4xl h-24 rounded-3xl active:translate-y-1 active:shadow-none transition-all border-none`}
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
                                        message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-400' : 'bg-rose-50 text-rose-600 border-rose-400'
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
                    <div className="text-8xl mb-4">🏆</div>
                    <h1 className="text-4xl md:text-5xl font-bold text-cyan-700 drop-shadow-sm">You Finished!</h1>
                    <p className="text-xl md:text-2xl text-cyan-600 font-medium mb-4">Score: {score}/{MAX_SCORE}</p>
                    
                    {onComplete ? (
                        <Button 
                            size="lg" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-2xl px-12 py-8 rounded-full shadow-[0_6px_0_0_#047857] active:translate-y-2 active:shadow-none transition-all"
                            onClick={onComplete}
                        >
                            Next Game <Play className="ml-2 w-8 h-8 fill-current" />
                        </Button>
                    ) : (
                        <Button 
                            size="lg" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-none transition-all"
                            onClick={() => {
                                setScore(0);
                                setCurrentQuestion(1);
                                setIsCompleted(false);
                                generateQuestion();
                            }}
                        >
                            Play Again <Play className="ml-2 w-6 h-6 fill-current" />
                        </Button>
                    )}
                </motion.div>
            )}
        </div>
    );
}