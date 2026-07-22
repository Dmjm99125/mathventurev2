import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star, Ticket } from 'lucide-react';

const LEFT_BALLOONS = ['🎈', '💖', '🦄', '🌟'];
const RIGHT_BALLOONS = ['🔵', '🟢', '🟡', '🟠'];
const CARNIVAL_PRIZES = ['🍿', '🍦', '🎪', '🎡', '🎢', '🦁', '🐻', '🥨', '🍭'];

export function Carnival({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [icon1, setIcon1] = useState('🎈');
    const [icon2, setIcon2] = useState('🔵');
    const [options, setOptions] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    // Track popping state
    const [popped, setPopped] = useState(false);

    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [isCompleted, setIsCompleted] = useState(false);
    const [prize, setPrize] = useState('🍿');
    
    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const n2 = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const correctAnswer = n1 + n2;
        
        setIcon1(LEFT_BALLOONS[Math.floor(Math.random() * LEFT_BALLOONS.length)]);
        setIcon2(RIGHT_BALLOONS[Math.floor(Math.random() * RIGHT_BALLOONS.length)]);
        
        setPopped(false);
        
        // Generate options (3 options for Carnival)
        const opts = new Set<number>();
        opts.add(correctAnswer);
        
        while (opts.size < 3) {
            let fake = Math.floor(Math.random() * 9) + 2; // 2 to 10
            opts.add(fake);
        }
        
        setNum1(n1);
        setNum2(n2);
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
        setMessage({ text: '', type: '' });
    };

    useEffect(() => {
        generateQuestion();
        setPrize(CARNIVAL_PRIZES[Math.floor(Math.random() * CARNIVAL_PRIZES.length)]);
    }, []);

    const checkAnswer = (selected: number) => {
        if (message.type !== '') return;
        
        const correctAnswer = num1 + num2;
        
        if (selected === correctAnswer) {
            setMessage({ text: 'Pop! 🎈', type: 'success' });
            const newScore = score + 1;
            setScore(newScore);
            setPopped(true);
            
            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    setIsCompleted(true);
                    confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 }, colors: ['#ef4444', '#f59e0b', '#3b82f6', '#a855f7'] });
                }, 1000);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(generateQuestion, 1500);
            }
        } else {
            setMessage({ text: `Oops! Try again.`, type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 1500);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-amber-50 p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-red-400 min-h-[500px]">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 bg-white/90 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-red-200 flex-wrap gap-4">
                <h2 className="text-xl md:text-2xl font-bold font-display text-red-600 uppercase tracking-wide flex items-center gap-2">
                    <Ticket className="w-8 h-8 text-red-500 fill-red-500" /> Magic Carnival
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question {Math.min(currentQuestion, MAX_SCORE)} / {MAX_SCORE}</span>
                        <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-amber-100 px-4 py-1 rounded-full shadow-sm mt-1 border-2 border-amber-300">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            <span className="text-amber-700">{score}</span>
                        </div>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-red-400 text-red-700 font-bold hover:bg-red-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                            Skip Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            <p className="text-xl font-bold text-slate-600 mb-6 font-display drop-shadow-sm text-center">Count all the balloons together!</p>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-2xl">
                    
                    <div className="bg-white/90 border-4 border-red-400 rounded-[2rem] p-6 md:p-8 w-full shadow-lg relative flex flex-col items-center mb-6">
                        
                        {/* Sky Stage */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full bg-gradient-to-b from-sky-400 to-sky-200 p-6 rounded-3xl border-4 border-sky-500 min-h-[160px] shadow-inner mb-6">
                            
                            {/* Group 1 */}
                            <div className="flex gap-2 flex-wrap justify-center min-w-[100px]">
                                <AnimatePresence>
                                    {!popped && Array.from({ length: num1 }).map((_, i) => (
                                        <motion.div
                                            key={`b1-${i}`}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1, y: [5, -10, 5] }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 } }}
                                            className="text-5xl md:text-6xl drop-shadow-md"
                                        >
                                            {icon1}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            
                            <span className="text-5xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">+</span>
                            
                            {/* Group 2 */}
                            <div className="flex gap-2 flex-wrap justify-center min-w-[100px]">
                                <AnimatePresence>
                                    {!popped && Array.from({ length: num2 }).map((_, i) => (
                                        <motion.div
                                            key={`b2-${i}`}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1, y: [5, -10, 5] }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 + 0.5 } }}
                                            className="text-5xl md:text-6xl drop-shadow-md"
                                        >
                                            {icon2}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                        </div>

                        {/* Equation Text */}
                        <div className="text-5xl md:text-6xl font-black text-purple-600 drop-shadow-[2px_2px_0_#fbcfe8] mb-6 tracking-wider">
                            {num1} + {num2}
                        </div>

                        {/* Multiple Choice Options (3 choices for Carnival) */}
                        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                            {options.map((opt, index) => (
                                <Button 
                                    key={index}
                                    className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-4xl h-24 rounded-[1.5rem] active:translate-y-1 active:shadow-none transition-all border-none shadow-[0_6px_0_0_#0891b2]"
                                    onClick={() => checkAnswer(opt)}
                                    disabled={message.type !== '' || popped}
                                >
                                    {opt}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Feedback Message */}
                    <div className="h-20 mt-2 flex items-center justify-center w-full">
                        <AnimatePresence mode="wait">
                            {message.text && (
                                <motion.div
                                    key="feedback"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-2xl md:text-3xl border-4 shadow-lg z-50 ${
                                        message.type === 'success' ? 'bg-green-50 text-green-600 border-green-400' : 'bg-red-50 text-red-600 border-red-400'
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
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center w-full max-w-lg mx-auto bg-white/90 p-8 rounded-[3rem] border-4 border-amber-400 shadow-xl relative overflow-hidden"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-amber-500 drop-shadow-sm uppercase">🎟️ Golden Ticket! 🎟️</h1>
                    <p className="text-xl md:text-2xl text-slate-600 font-medium mb-2">You won a fun carnival prize:</p>
                    
                    <motion.div 
                        animate={{ scale: [1, 1.1, 1], rotate: [-5, 5, -5] }} 
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-8xl md:text-9xl my-4 filter drop-shadow-lg"
                    >
                        {prize}
                    </motion.div>

                    <div className="w-full bg-slate-100 rounded-2xl p-4 border-t-4 border-dashed border-amber-400 mt-4 mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Carnival Prizes</p>
                        <div className="flex justify-center items-center text-3xl">
                            {prize}
                        </div>
                    </div>
                    
                    <Button 
                            size="lg" 
                            className="bg-red-500 hover:bg-red-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#b91c1c] active:translate-y-1 active:shadow-none transition-all w-full"
                            onClick={() => {
                                setScore(0);
                                setCurrentQuestion(1);
                                setIsCompleted(false);
                                setPrize(CARNIVAL_PRIZES[Math.floor(Math.random() * CARNIVAL_PRIZES.length)]);
                                generateQuestion();
                            }}
                        > Repeat Game <Play className="ml-2 w-6 h-6 fill-current" />
                        </Button>
                </motion.div>
            )}
        </div>
    );
}