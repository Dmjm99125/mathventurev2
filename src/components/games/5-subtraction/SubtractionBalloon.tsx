import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star, Cloud } from 'lucide-react';

const BALLOON_COLORS = [
    'bg-red-400 border-red-500', 
    'bg-blue-400 border-blue-500', 
    'bg-green-400 border-green-500', 
    'bg-yellow-400 border-yellow-500',
    'bg-purple-400 border-purple-500',
    'bg-pink-400 border-pink-500'
];

export function SubtractionBalloon({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [options, setOptions] = useState<{ id: number, value: number, color: string }[]>([]);
    
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [isCompleted, setIsCompleted] = useState(false);
    
    const [poppedId, setPoppedId] = useState<number | null>(null);

    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 10) + 1; // 1 to 10
        const n2 = Math.floor(Math.random() * n1); // 0 to n1 - 1
        const correctAnswer = n1 - n2;
        
        // Generate options (4 options)
        const opts = new Set<number>();
        opts.add(correctAnswer);
        
        while (opts.size < 4) {
            let fake = Math.floor(Math.random() * 11); // 0 to 10
            opts.add(fake);
        }
        
        const newOptions = Array.from(opts)
            .sort(() => Math.random() - 0.5)
            .map((val, idx) => ({
                id: Date.now() + idx,
                value: val,
                color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]
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

    const checkAnswer = (opt: { id: number, value: number, color: string }) => {
        if (message.type !== '' || poppedId !== null) return;
        
        const correctAnswer = num1 - num2;
        setPoppedId(opt.id);
        
        if (opt.value === correctAnswer) {
            setMessage({ text: 'Pop! Great job! 🎈', type: 'success' });
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
            setMessage({ text: `Oops! Try another balloon!`, type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
                setPoppedId(null);
            }, 1200);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-sky-100 p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-sky-300 min-h-[500px] overflow-hidden">
            
            {/* Background Clouds */}
            <div className="absolute top-10 left-10 opacity-40"><Cloud className="w-24 h-24 text-white fill-white" /></div>
            <div className="absolute top-20 right-10 opacity-30"><Cloud className="w-32 h-32 text-white fill-white" /></div>
            <div className="absolute bottom-10 left-32 opacity-40"><Cloud className="w-20 h-20 text-white fill-white" /></div>
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-sky-200 flex-wrap gap-4 relative z-10">
                <h2 className="text-xl md:text-2xl font-bold font-display text-sky-600 uppercase tracking-wide flex items-center gap-2">
                    🎈 Balloon Pop Subtraction
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question {Math.min(currentQuestion, MAX_SCORE)} / {MAX_SCORE}</span>
                        <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-yellow-100 px-4 py-1 rounded-full shadow-sm mt-1 border-2 border-yellow-400">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            <span className="text-sky-800">{score}</span>
                        </div>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-sky-400 text-sky-700 font-bold hover:bg-sky-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                            Skip Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-2xl relative z-10">
                    
                    <div className="bg-white/90 border-4 border-sky-300 rounded-[2rem] p-6 md:p-8 w-full shadow-lg relative flex flex-col items-center mb-6">
                        
                        <p className="text-lg font-bold text-slate-500 mb-2 font-display text-center uppercase tracking-wider">Pop the balloon with the correct answer!</p>
                        
                        {/* Equation Text */}
                        <div className="text-6xl md:text-8xl font-black text-sky-600 drop-shadow-[3px_3px_0_#bae6fd] mb-8 tracking-wider">
                            {num1} - {num2} = ?
                        </div>

                        {/* Balloon Options */}
                        <div className="flex flex-wrap justify-center gap-6 w-full">
                            <AnimatePresence mode="popLayout">
                                {options.map((opt) => (
                                    poppedId !== opt.id && (
                                        <motion.button
                                            key={opt.id}
                                            initial={{ scale: 0, y: 50 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            whileHover={{ y: -10 }}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ type: 'spring', bounce: 0.5 }}
                                            onClick={() => checkAnswer(opt)}
                                            disabled={message.type !== ''}
                                            className={`
                                                relative flex items-center justify-center
                                                w-24 h-32 md:w-28 md:h-36 
                                                rounded-[50%_50%_50%_50%/40%_40%_60%_60%] 
                                                ${opt.color} border-4
                                                shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.1),0_8px_15px_rgba(0,0,0,0.1)]
                                                text-3xl md:text-4xl font-black text-white drop-shadow-md
                                                cursor-pointer
                                                before:content-[''] before:absolute before:-bottom-3 before:left-1/2 before:-translate-x-1/2 
                                                before:w-0 before:h-0 before:border-l-[6px] before:border-r-[6px] before:border-b-[10px] 
                                                before:border-l-transparent before:border-r-transparent before:border-b-current
                                            `}
                                        >
                                            {/* Balloon string */}
                                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-1 h-16 border-l-2 border-slate-300 border-dashed opacity-70"></div>
                                            {/* Balloon shine */}
                                            <div className="absolute top-2 left-3 w-4 h-8 bg-white/40 rounded-full rotate-[20deg]"></div>
                                            <span className="relative z-10">{opt.value}</span>
                                        </motion.button>
                                    )
                                ))}
                            </AnimatePresence>
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
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center w-full max-w-lg mx-auto bg-white/90 p-8 rounded-[3rem] border-4 border-sky-400 shadow-xl relative z-10"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-sky-600 drop-shadow-sm uppercase">Sky Master! ☁️</h1>
                    <p className="text-xl md:text-2xl text-slate-600 font-medium mb-4">You popped all the correct balloons!</p>
                    
                    <div className="text-8xl md:text-9xl my-4 filter drop-shadow-lg flex gap-4">
                        🎈🏆🎈
                    </div>
                    
                    {onComplete ? (
                        <Button 
                            size="lg" 
                            className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-2xl px-12 py-8 rounded-full shadow-[0_6px_0_0_#0ea5e9] active:translate-y-2 active:shadow-none transition-all w-full border-none"
                            onClick={onComplete}
                        >
                            Next Game <Play className="ml-2 w-8 h-8 fill-current" />
                        </Button>
                    ) : (
                        <Button 
                            size="lg" 
                            className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#0ea5e9] active:translate-y-1 active:shadow-none transition-all w-full border-none"
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