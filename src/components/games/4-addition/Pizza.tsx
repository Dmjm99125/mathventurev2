import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star, ChefHat } from 'lucide-react';

const LEFT_TOPPINGS = ['🍕', '🍅', '🍄', '🫑'];
const RIGHT_TOPPINGS = ['🍍', '🧀', '🧅', '🌽'];
const KITCHEN_PRIZES = ['🍳', '🧑‍🍳', '🥣', '🥤', '🧂', '🔪', '🥖', '🍩'];

export function Pizza({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [icon1, setIcon1] = useState('🍅');
    const [icon2, setIcon2] = useState('🧀');
    const [options, setOptions] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [isCompleted, setIsCompleted] = useState(false);
    const [prize, setPrize] = useState('🍳');
    
    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const n2 = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const correctAnswer = n1 + n2;
        
        setIcon1(LEFT_TOPPINGS[Math.floor(Math.random() * LEFT_TOPPINGS.length)]);
        setIcon2(RIGHT_TOPPINGS[Math.floor(Math.random() * RIGHT_TOPPINGS.length)]);
        
        // Generate options (3 options)
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
        setPrize(KITCHEN_PRIZES[Math.floor(Math.random() * KITCHEN_PRIZES.length)]);
    }, []);

    const checkAnswer = (selected: number) => {
        if (message.type !== '') return;
        
        const correctAnswer = num1 + num2;
        
        if (selected === correctAnswer) {
            setMessage({ text: 'Bellissimo! 👨‍🍳', type: 'success' });
            const newScore = score + 1;
            setScore(newScore);
            
            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    setIsCompleted(true);
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#dc2626', '#eab308', '#2563eb', '#ffffff'] });
                }, 1000);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(generateQuestion, 1500);
            }
        } else {
            setMessage({ text: `Mamma mia! Try again.`, type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 1500);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-orange-50 p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-blue-600 min-h-[500px]">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 bg-white/90 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-blue-200 flex-wrap gap-4">
                <h2 className="text-xl md:text-2xl font-bold font-display text-blue-700 uppercase tracking-wide flex items-center gap-2">
                    <ChefHat className="w-8 h-8 text-blue-600" /> Magic Pizza Chef
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question {Math.min(currentQuestion, MAX_SCORE)} / {MAX_SCORE}</span>
                        <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-yellow-100 px-4 py-1 rounded-full shadow-sm mt-1 border-2 border-yellow-400">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            <span className="text-blue-800">{score}</span>
                        </div>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-blue-400 text-blue-700 font-bold hover:bg-blue-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                            Skip Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            <p className="text-xl font-bold text-slate-600 mb-6 font-display drop-shadow-sm text-center">Count all the toppings on the pizza!</p>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-2xl">
                    
                    <div className="bg-white/90 border-4 border-blue-600 rounded-[2rem] p-6 md:p-8 w-full shadow-lg relative flex flex-col items-center mb-6">
                        
                        {/* Kitchen Stage */}
                        <div className="flex items-center justify-center w-full bg-slate-50 p-8 rounded-3xl border-4 border-slate-300 min-h-[220px] shadow-inner mb-6 relative overflow-hidden">
                            
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-6xl drop-shadow-md z-0 opacity-20 hidden md:block">👨‍🍳</div>
                            
                            {/* Pizza Crust */}
                            <div className="w-[180px] h-[180px] bg-yellow-100 border-[12px] border-yellow-500 rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.15)] flex relative overflow-hidden z-10">
                                
                                {/* Left Half */}
                                <div className="w-1/2 h-full bg-red-600/10 border-r-4 border-dashed border-yellow-500/50 flex flex-wrap content-center justify-center gap-2 p-2 relative">
                                    <AnimatePresence>
                                        {Array.from({ length: num1 }).map((_, i) => (
                                            <motion.div
                                                key={`top1-${i}-${currentQuestion}`}
                                                initial={{ scale: 0, y: -50, rotate: -20 }}
                                                animate={{ scale: 1, y: 0, rotate: 0 }}
                                                transition={{ type: 'spring', bounce: 0.6, delay: i * 0.1 }}
                                                className="text-3xl filter drop-shadow-sm"
                                            >
                                                {icon1}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                
                                {/* Right Half */}
                                <div className="w-1/2 h-full bg-red-600/5 flex flex-wrap content-center justify-center gap-2 p-2 relative">
                                    <AnimatePresence>
                                        {Array.from({ length: num2 }).map((_, i) => (
                                            <motion.div
                                                key={`top2-${i}-${currentQuestion}`}
                                                initial={{ scale: 0, y: -50, rotate: 20 }}
                                                animate={{ scale: 1, y: 0, rotate: 0 }}
                                                transition={{ type: 'spring', bounce: 0.6, delay: (i * 0.1) + 0.3 }}
                                                className="text-3xl filter drop-shadow-sm"
                                            >
                                                {icon2}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                
                            </div>

                        </div>

                        {/* Equation Text */}
                        <div className="text-5xl md:text-6xl font-black text-red-600 drop-shadow-[2px_2px_0_#fee2e2] mb-6 tracking-wider">
                            {num1} + {num2}
                        </div>

                        {/* Multiple Choice Options (3 choices) */}
                        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                            {options.map((opt, index) => (
                                <Button 
                                    key={index}
                                    className="bg-orange-200 hover:bg-orange-300 text-amber-900 border-4 border-amber-700 font-bold text-4xl h-24 rounded-[1.5rem] active:translate-y-1 active:shadow-none transition-all shadow-[0_6px_0_0_#92400e]"
                                    onClick={() => checkAnswer(opt)}
                                    disabled={message.type !== ''}
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
                                        message.type === 'success' ? 'bg-green-50 text-green-700 border-green-500' : 'bg-slate-100 text-slate-600 border-slate-400'
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
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center w-full max-w-lg mx-auto bg-white/90 p-8 rounded-[3rem] border-4 border-blue-500 shadow-xl relative overflow-hidden"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-blue-600 drop-shadow-sm uppercase">👩‍🍳 Star Chef! 👨‍🍳</h1>
                    <p className="text-xl md:text-2xl text-slate-600 font-medium mb-2">You unlocked a golden kitchen tool:</p>
                    
                    <motion.div 
                        animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }} 
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-8xl md:text-9xl my-4 filter drop-shadow-lg"
                    >
                        {prize}
                    </motion.div>

                    <div className="w-full bg-slate-100 rounded-2xl p-4 border-t-4 border-dashed border-blue-500 mt-4 mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Golden Kitchen Collection</p>
                        <div className="flex justify-center items-center text-4xl">
                            {prize}
                        </div>
                    </div>
                    
                    <Button 
                            size="lg" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#1d4ed8] active:translate-y-1 active:shadow-none transition-all w-full border-none"
                            onClick={() => {
                                setScore(0);
                                setCurrentQuestion(1);
                                setIsCompleted(false);
                                setPrize(KITCHEN_PRIZES[Math.floor(Math.random() * KITCHEN_PRIZES.length)]);
                                generateQuestion();
                            }}
                        > Repeat Game <Play className="ml-2 w-6 h-6 fill-current" />
                        </Button>
                </motion.div>
            )}
        </div>
    );
}