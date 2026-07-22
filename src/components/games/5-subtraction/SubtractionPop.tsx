import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star, Sparkles } from 'lucide-react';

const EMOJIS = ['🎈', '🍎', '⭐', '🐻', '🚗', '🦆'];

export function SubtractionPop({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [emoji, setEmoji] = useState('🎈');
    const [options, setOptions] = useState<number[]>([]);
    
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [isCompleted, setIsCompleted] = useState(false);
    
    const [disabledOptions, setDisabledOptions] = useState<Set<number>>(new Set());

    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 6) + 4; // 4 to 9
        const n2 = Math.floor(Math.random() * (n1 + 1)); // 0 to n1
        const correctAnswer = n1 - n2;
        
        const e = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        
        // Generate options (3 options)
        const opts = new Set<number>();
        opts.add(correctAnswer);
        
        while (opts.size < 3) {
            let fake = Math.floor(Math.random() * 10);
            opts.add(fake);
        }
        
        setNum1(n1);
        setNum2(n2);
        setEmoji(e);
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
        setMessage({ text: '', type: '' });
        setDisabledOptions(new Set());
    };

    useEffect(() => {
        generateQuestion();
    }, []);

    const checkAnswer = (selected: number) => {
        if (message.type === 'success' || disabledOptions.has(selected)) return;
        
        const correctAnswer = num1 - num2;
        
        if (selected === correctAnswer) {
            setMessage({ text: 'Great Job! 🎉', type: 'success' });
            const newScore = score + 1;
            setScore(newScore);
            
            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    setIsCompleted(true);
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                }, 1000);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(generateQuestion, 1200);
            }
        } else {
            setMessage({ text: `Oops! Try again!`, type: 'error' });
            setDisabledOptions(prev => new Set(prev).add(selected));
            setTimeout(() => {
                if (message.type !== 'success') {
                    setMessage({ text: '', type: '' });
                }
            }, 1200);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto bg-green-50 p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-teal-400 min-h-[500px]">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 bg-white/90 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-teal-200 flex-wrap gap-4">
                <h2 className="text-xl md:text-2xl font-bold font-display text-teal-600 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-teal-400" /> Subtraction Pop!
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question {Math.min(currentQuestion, MAX_SCORE)} / {MAX_SCORE}</span>
                        <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-yellow-100 px-4 py-1 rounded-full shadow-sm mt-1 border-2 border-yellow-400">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            <span className="text-teal-800">{score}</span>
                        </div>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-teal-400 text-teal-700 font-bold hover:bg-teal-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                            Skip ➡️
                        </Button>
                    )}
                </div>
            </div>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-xl">
                    
                    <div className="bg-white border-4 border-teal-300 rounded-[2rem] p-6 w-full shadow-md relative flex flex-col items-center mb-6">
                        
                        {/* Equation Text */}
                        <div className="text-5xl md:text-6xl font-black text-slate-700 tracking-[0.2em] font-display mb-6">
                            {num1} - {num2} = ?
                        </div>

                        {/* Visual Area */}
                        <div className="flex justify-center items-center flex-wrap gap-3 md:gap-4 w-full bg-green-50/50 p-6 rounded-3xl border-2 border-dashed border-teal-400 mb-6 min-h-[140px]">
                            <AnimatePresence>
                                {Array.from({ length: num1 }).map((_, i) => {
                                    const isCrossed = i >= num1 - num2;
                                    return (
                                        <motion.div
                                            key={`item-${i}-${currentQuestion}`}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ 
                                                scale: isCrossed ? 0.7 : 1, 
                                                opacity: isCrossed ? 0.3 : 1 
                                            }}
                                            transition={{ type: "spring", bounce: 0.5, delay: i * 0.1 }}
                                            className="text-5xl md:text-6xl drop-shadow-sm relative"
                                        >
                                            {emoji}
                                            {isCrossed && (
                                                <motion.div 
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                    transition={{ duration: 0.3, delay: (i * 0.1) + 0.3 }}
                                                    className="absolute inset-0 flex items-center justify-center text-red-500 z-10 font-black text-6xl"
                                                >
                                                    <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute top-0 left-0">
                                                        <motion.line x1="10" y1="10" x2="90" y2="90" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
                                                        <motion.line x1="90" y1="10" x2="10" y2="90" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
                                                    </svg>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Options */}
                        <div className="flex justify-center gap-4 w-full">
                            {options.map((opt, i) => (
                                <Button
                                    key={`opt-${i}-${currentQuestion}`}
                                    onClick={() => checkAnswer(opt)}
                                    disabled={message.type === 'success' || disabledOptions.has(opt)}
                                    className={`
                                        bg-teal-400 hover:bg-teal-500 text-white font-bold text-4xl w-24 h-20 md:w-32 md:h-24 rounded-2xl active:translate-y-1 active:shadow-none transition-all shadow-[0_6px_0_0_#14b8a6] border-none
                                        ${disabledOptions.has(opt) ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                                    `}
                                >
                                    {opt}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Feedback Message */}
                    <div className="h-16 mt-2 flex items-center justify-center w-full">
                        <AnimatePresence mode="wait">
                            {message.text && (
                                <motion.div
                                    key="feedback"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-full font-bold text-xl md:text-2xl border-4 shadow-lg z-50 ${
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
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center w-full max-w-lg mx-auto bg-white/90 p-8 rounded-[3rem] border-4 border-teal-400 shadow-xl"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-teal-500 drop-shadow-sm uppercase">Math Popper! 🎈</h1>
                    <p className="text-xl md:text-2xl text-slate-600 font-medium mb-4">You popped all the correct answers!</p>
                    
                    <div className="text-7xl md:text-8xl my-4 filter drop-shadow-lg flex gap-2 justify-center">
                        🏆🎈🏆
                    </div>
                    
                    {onComplete ? (
                        <Button 
                            size="lg" 
                            className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-2xl px-12 py-8 rounded-full shadow-[0_6px_0_0_#0d9488] active:translate-y-2 active:shadow-none transition-all w-full border-none"
                            onClick={onComplete}
                        >
                            Next Game <Play className="ml-2 w-8 h-8 fill-current" />
                        </Button>
                    ) : (
                        <Button 
                            size="lg" 
                            className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#0d9488] active:translate-y-1 active:shadow-none transition-all w-full border-none"
                            onClick={() => {
                                setScore(0);
                                setCurrentQuestion(1);
                                setIsCompleted(false);
                                generateQuestion();
                            }}
                        >
                            Play Again! <Play className="ml-2 w-6 h-6 fill-current" />
                        </Button>
                    )}
                </motion.div>
            )}
        </div>
    );
}