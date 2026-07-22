import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star, Apple } from 'lucide-react';

export function AppleAddition({ onComplete }: { onComplete?: () => void }) {
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
        // Random numbers between 1 and 6
        setNum1(Math.floor(Math.random() * 6) + 1);
        setNum2(Math.floor(Math.random() * 6) + 1);
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
            setMessage({ text: '🎉 Correct! You counted well!', type: 'success' });
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
            setMessage({ text: '❌ Try again! Count carefully.', type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
                setUserAnswer('');
                inputRef.current?.focus();
            }, 1500);
        }
    };

    const renderApples = (count: number) => {
        return (
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-[150px]">
                {Array.from({ length: count }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', delay: i * 0.05 }}
                        className="text-4xl md:text-5xl drop-shadow-sm"
                    >
                        🍎
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-orange-50 p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-orange-300 min-h-[500px]">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-orange-200 flex-wrap gap-4">
                <h2 className="text-xl md:text-2xl font-bold font-display text-orange-700 uppercase tracking-wide flex items-center gap-2">
                    <Apple className="w-8 h-8 text-orange-500 fill-orange-500" /> Count the Apples
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-orange-100 px-4 py-2 rounded-full shadow-sm">
                        <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                        <span className="text-orange-700">{score} / {MAX_SCORE}</span>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-orange-400 text-orange-700 font-bold hover:bg-orange-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                            Skip Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-2xl">
                    
                    <div className="bg-white border-4 border-orange-400 rounded-[2rem] p-8 w-full shadow-lg relative flex flex-col items-center">
                        
                        {/* Apple Display */}
                        <div className="flex items-center justify-center gap-4 md:gap-8 mb-8 w-full">
                            <div className="flex-1 flex justify-end bg-orange-50/50 p-4 rounded-3xl border-2 border-orange-100 min-h-[120px]">
                                {renderApples(num1)}
                            </div>
                            
                            <div className="text-5xl font-bold text-orange-400 drop-shadow-sm">+</div>
                            
                            <div className="flex-1 flex justify-start bg-orange-50/50 p-4 rounded-3xl border-2 border-orange-100 min-h-[120px]">
                                {renderApples(num2)}
                            </div>
                        </div>

                        <h3 className="text-2xl md:text-3xl font-bold text-slate-600 mb-6 font-display text-center">
                            How many apples in total?
                        </h3>

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
                                      'border-slate-300 bg-slate-50 focus:border-orange-400 focus:ring-4 focus:ring-orange-200 text-slate-700'}
                                `}
                                placeholder="?"
                            />
                        </div>

                        <Button 
                            className="mt-8 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#ea580c] active:translate-y-1 active:shadow-none transition-all w-full md:w-auto min-w-[250px]"
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
                    <div className="text-8xl mb-4">🍎🍏🍎</div>
                    <h1 className="text-4xl md:text-5xl font-bold text-orange-700 drop-shadow-sm">Apple Master!</h1>
                    <p className="text-xl md:text-2xl text-orange-600 font-medium mb-4">You counted all the apples perfectly!</p>
                    
                    <Button 
                            size="lg" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-none transition-all"
                            onClick={() => {
                                setScore(0);
                                setIsCompleted(false);
                                newQuestion();
                            }}
                        > Repeat Game <Play className="ml-2 w-6 h-6 fill-current" />
                        </Button>
                </motion.div>
            )}
        </div>
    );
}