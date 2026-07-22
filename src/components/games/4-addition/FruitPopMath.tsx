import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star, Cherry } from 'lucide-react';

const FRUITS = ['🍎', '🍌', '🍓', '🍊', '🍇', '🍒'];

export function FruitPopMath({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [fruit, setFruit] = useState('🍎');
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
        // Keep sum <= 10
        const n1 = Math.floor(Math.random() * 6);
        const n2 = Math.floor(Math.random() * (11 - n1));
        
        // Pick a random fruit
        setFruit(FRUITS[Math.floor(Math.random() * FRUITS.length)]);
        setNum1(n1);
        setNum2(n2);
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
            setMessage({ text: 'Great Job! 🎉', type: 'success' });
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
            setMessage({ text: `Try again! You can count the ${fruit}!`, type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
                setUserAnswer('');
                inputRef.current?.focus();
            }, 1500);
        }
    };

    const renderFruits = (count: number) => {
        return (
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-[200px] min-h-[50px]">
                {Array.from({ length: count }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, y: -20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', delay: i * 0.05, bounce: 0.5 }}
                        className="text-4xl md:text-5xl drop-shadow-sm"
                    >
                        {fruit}
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-fuchsia-50 p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-fuchsia-300 min-h-[500px]">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-fuchsia-200 flex-wrap gap-4">
                <h2 className="text-xl md:text-2xl font-bold font-display text-fuchsia-700 uppercase tracking-wide flex items-center gap-2">
                    <Cherry className="w-8 h-8 text-fuchsia-500 fill-fuchsia-500" /> Fruit Pop Math
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-fuchsia-100 px-4 py-2 rounded-full shadow-sm">
                        <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                        <span className="text-fuchsia-700">{score} / {MAX_SCORE}</span>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-fuchsia-400 text-fuchsia-700 font-bold hover:bg-fuchsia-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                            Skip Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-2xl">
                    
                    <div className="bg-white border-4 border-fuchsia-400 rounded-[2rem] p-8 w-full shadow-lg relative flex flex-col items-center">
                        
                        {/* Top Fruits */}
                        <div className="bg-fuchsia-50/50 p-4 rounded-3xl border-2 border-fuchsia-100 mb-6 flex justify-center w-full max-w-xs">
                            {renderFruits(num1)}
                        </div>
                        
                        {/* Math Equation */}
                        <div className="flex items-center justify-center gap-4 text-5xl md:text-6xl font-bold text-slate-700 mb-6 font-display">
                            <span className="text-fuchsia-600">{num1}</span>
                            <span className="text-pink-400">+</span>
                            <span className="text-fuchsia-600">{num2}</span>
                            <span className="text-purple-400">=</span>
                            <input
                                ref={inputRef}
                                type="number"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={message.type !== ''}
                                className={`w-28 h-20 text-center text-4xl md:text-5xl font-bold rounded-2xl border-4 shadow-inner outline-none transition-all
                                    ${message.type === 'error' ? 'border-rose-400 bg-rose-50 text-rose-500' : 
                                      message.type === 'success' ? 'border-emerald-400 bg-emerald-50 text-emerald-500' : 
                                      'border-slate-300 bg-slate-50 focus:border-fuchsia-400 focus:ring-4 focus:ring-fuchsia-200 text-slate-700'}
                                `}
                                placeholder="?"
                            />
                        </div>

                        {/* Bottom Fruits */}
                        <div className="bg-fuchsia-50/50 p-4 rounded-3xl border-2 border-fuchsia-100 flex justify-center w-full max-w-xs">
                            {renderFruits(num2)}
                        </div>

                        <Button 
                            className="mt-8 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#c026d3] active:translate-y-1 active:shadow-none transition-all w-full md:w-auto min-w-[250px]"
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
                    <div className="text-8xl mb-4">🍇🍊🍓</div>
                    <h1 className="text-4xl md:text-5xl font-bold text-fuchsia-700 drop-shadow-sm">Fruit Pop Genius!</h1>
                    <p className="text-xl md:text-2xl text-fuchsia-600 font-medium mb-4">You solved all the fruit math problems!</p>
                    
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