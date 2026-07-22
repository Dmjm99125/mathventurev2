import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star, Sparkles } from 'lucide-react';

const FRUITS = ["🍎", "🍌", "🍇", "🍓", "🍍"];

export function FruitSubtraction({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [fruit, setFruit] = useState("🍎");
    const [options, setOptions] = useState<number[]>([]);
    
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [isCompleted, setIsCompleted] = useState(false);

    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 5) + 3; // 3 to 7
        const n2 = Math.floor(Math.random() * (n1 + 1)); // 0 to n1
        const correctAnswer = n1 - n2;
        
        const f = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        
        // Generate options (3 options)
        const opts = new Set<number>();
        opts.add(correctAnswer);
        
        while (opts.size < 3) {
            let fake = Math.floor(Math.random() * 8); // 0 to 7
            opts.add(fake);
        }
        
        setNum1(n1);
        setNum2(n2);
        setFruit(f);
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
        setMessage({ text: '', type: '' });
    };

    useEffect(() => {
        generateQuestion();
    }, []);

    const checkAnswer = (selected: number) => {
        if (message.type !== '') return;
        
        const correctAnswer = num1 - num2;
        
        if (selected === correctAnswer) {
            setMessage({ text: 'Yummy! Correct! 😋', type: 'success' });
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
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 1200);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-gradient-to-t from-orange-100 to-cyan-50 p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-orange-300 min-h-[500px]">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 bg-white/70 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-orange-200 flex-wrap gap-4 relative z-10">
                <h2 className="text-xl md:text-2xl font-bold font-display text-orange-600 uppercase tracking-wide flex items-center gap-2">
                    🍎 Fruit Subtraction
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question {Math.min(currentQuestion, MAX_SCORE)} / {MAX_SCORE}</span>
                        <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-yellow-100 px-4 py-1 rounded-full shadow-sm mt-1 border-2 border-yellow-400">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            <span className="text-orange-800">{score}</span>
                        </div>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-orange-400 text-orange-700 font-bold hover:bg-orange-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                            Skip Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-3xl relative z-10">
                    
                    <div className="bg-white/80 border-4 border-orange-300 rounded-[2rem] p-6 md:p-10 w-full shadow-lg relative flex flex-col items-center mb-6">
                        
                        {/* Equation Text */}
                        <div className="text-5xl md:text-6xl font-black text-orange-600 drop-shadow-[2px_2px_0_#ffedd5] mb-8 tracking-wider">
                            {num1} - {num2} = ?
                        </div>

                        {/* Visual Fruits Area */}
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 w-full bg-orange-50/50 p-6 rounded-3xl border-2 border-orange-200 mb-8 min-h-[140px]">
                            
                            {/* Group 1 */}
                            <div className="flex flex-wrap justify-center gap-2 max-w-[200px]">
                                <AnimatePresence>
                                    {Array.from({ length: num1 }).map((_, i) => (
                                        <motion.div
                                            key={`g1-${i}-${currentQuestion}`}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: i * 0.1, type: "spring", bounce: 0.5 }}
                                            className="text-4xl md:text-5xl drop-shadow-md"
                                        >
                                            {fruit}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            
                            {/* Minus Sign */}
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: num1 * 0.1 }}
                                className="text-5xl font-black text-slate-400"
                            >
                                ➖
                            </motion.div>
                            
                            {/* Group 2 */}
                            <div className="flex flex-wrap justify-center gap-2 max-w-[200px]">
                                <AnimatePresence>
                                    {Array.from({ length: num2 }).map((_, i) => (
                                        <motion.div
                                            key={`g2-${i}-${currentQuestion}`}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: (num1 * 0.1) + (i * 0.1), type: "spring", bounce: 0.5 }}
                                            className="text-4xl md:text-5xl drop-shadow-md opacity-70 grayscale-[0.3]"
                                        >
                                            {fruit}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                            
                        </div>

                        {/* Options */}
                        <div className="flex flex-wrap justify-center gap-4 w-full max-w-md">
                            {options.map((opt, i) => (
                                <motion.button
                                    key={`opt-${i}-${currentQuestion}`}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => checkAnswer(opt)}
                                    disabled={message.type !== ''}
                                    className="bg-white hover:bg-orange-50 text-orange-700 border-4 border-orange-400 font-bold text-4xl w-24 h-24 md:w-32 md:h-24 rounded-2xl active:translate-y-1 active:shadow-none transition-all shadow-[0_6px_0_0_#f97316]"
                                >
                                    {opt}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Feedback Message */}
                    <div className="h-20 mt-2 flex items-center justify-center w-full">
                        <AnimatePresence mode="wait">
                            {message.text && (
                                <motion.div
                                    key="feedback"
                                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, y: -20 }}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-2xl border-4 shadow-lg z-50 ${
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
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center w-full max-w-lg mx-auto bg-white/90 p-8 rounded-[3rem] border-4 border-orange-400 shadow-xl relative z-10"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-orange-600 drop-shadow-sm uppercase">Fruit Ninja! 🍎</h1>
                    <p className="text-xl md:text-2xl text-slate-600 font-medium mb-4">You counted all the fruits perfectly!</p>
                    
                    <div className="text-7xl md:text-8xl my-4 filter drop-shadow-lg flex gap-2 flex-wrap justify-center max-w-[300px]">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <motion.span 
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1, type: "spring" }}
                            >
                                ⭐
                            </motion.span>
                        ))}
                    </div>
                    
                    {onComplete ? (
                        <Button 
                            size="lg" 
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-2xl px-12 py-8 rounded-full shadow-[0_6px_0_0_#ea580c] active:translate-y-2 active:shadow-none transition-all w-full border-none"
                            onClick={onComplete}
                        >
                            Next Game <Play className="ml-2 w-8 h-8 fill-current" />
                        </Button>
                    ) : (
                        <Button 
                            size="lg" 
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#ea580c] active:translate-y-1 active:shadow-none transition-all w-full border-none"
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