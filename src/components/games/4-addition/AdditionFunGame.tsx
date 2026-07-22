import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Calculator, Trophy, Star } from 'lucide-react';

export function AdditionFunGame({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [isCompleted, setIsCompleted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const MAX_SCORE = 5;

    useEffect(() => {
        newQuestion();
    }, []);

    const newQuestion = () => {
        // Random numbers between 1 and 9 (0 is a bit too easy/boring)
        setNum1(Math.floor(Math.random() * 9) + 1);
        setNum2(Math.floor(Math.random() * 9) + 1);
        setUserAnswer('');
        setMessage({ text: '', type: '' });
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    };

    const checkAnswer = () => {
        if (userAnswer === '' || message.type !== '') return;
        
        const answer = parseInt(userAnswer, 10);
        
        if (answer === num1 + num2) {
            setMessage({ text: 'Awesome! Correct! 🎉', type: 'success' });
            const newScore = score + 1;
            setScore(newScore);
            
            if (newScore >= MAX_SCORE) {
                setTimeout(() => {
                    setIsCompleted(true);
                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                }, 1000);
            } else {
                setTimeout(newQuestion, 1500);
            }
        } else {
            setMessage({ text: 'Oops! Let\'s try again!', type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
                setUserAnswer('');
                inputRef.current?.focus();
            }, 1500);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto bg-sky-50 p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-sky-300 min-h-[500px]">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-sky-200">
                <h2 className="text-xl md:text-2xl font-bold font-display text-sky-700 uppercase tracking-wide flex items-center gap-2">
                    <Calculator className="w-8 h-8 text-sky-500" /> Addition Fun
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-sky-100 px-4 py-2 rounded-full shadow-sm">
                        <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                        <span className="text-sky-600">{score} / {MAX_SCORE}</span>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-sky-400 text-sky-700 font-bold hover:bg-sky-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                            Skip Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-lg">
                    
                    <div className="bg-white border-4 border-sky-400 rounded-[2rem] p-8 w-full shadow-lg relative flex flex-col items-center">
                        {/* Math Equation */}
                        <div className="flex items-center justify-center gap-4 text-5xl md:text-7xl font-bold text-slate-700 mb-8 font-display">
                            <motion.span 
                                key={`n1-${num1}`}
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                            >
                                {num1}
                            </motion.span>
                            <span className="text-rose-500">+</span>
                            <motion.span 
                                key={`n2-${num2}`}
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                            >
                                {num2}
                            </motion.span>
                            <span className="text-sky-500">=</span>
                        </div>

                        {/* Input Area */}
                        <div className="flex gap-4 items-center w-full justify-center">
                            <input
                                ref={inputRef}
                                type="number"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={message.type !== ''}
                                className={`w-32 h-24 text-center text-5xl font-bold rounded-2xl border-4 shadow-inner outline-none transition-all
                                    ${message.type === 'error' ? 'border-rose-400 bg-rose-50 text-rose-500' : 
                                      message.type === 'success' ? 'border-emerald-400 bg-emerald-50 text-emerald-500' : 
                                      'border-slate-300 bg-slate-50 focus:border-sky-400 focus:ring-4 focus:ring-sky-200'}
                                `}
                                placeholder="?"
                            />
                        </div>

                        <Button 
                            className="mt-8 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#0284c7] active:translate-y-1 active:shadow-none transition-all w-full"
                            onClick={checkAnswer}
                            disabled={!userAnswer || message.type !== ''}
                        >
                            Check Answer
                        </Button>
                    </div>

                    {/* Feedback Message */}
                    <div className="h-20 mt-6 flex items-center justify-center w-full">
                        <AnimatePresence mode="wait">
                            {message.text && (
                                <motion.div
                                    key="feedback"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-full font-bold text-xl md:text-2xl border-2 shadow-sm ${
                                        message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
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
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center"
                >
                    <div className="text-7xl animate-bounce">🏆</div>
                    <h1 className="text-4xl md:text-5xl font-bold text-sky-700 drop-shadow-sm">Math Superstar!</h1>
                    <p className="text-xl md:text-2xl text-sky-600 font-medium mb-4">You solved all the addition problems!</p>
                    
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
                                setIsCompleted(false);
                                newQuestion();
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