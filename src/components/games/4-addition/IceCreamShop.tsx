import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, Star, IceCream2, BellRing, CheckCircle2 } from 'lucide-react';

const SHOP_PRIZES = ['🍒', '🍫', '🍓', '🍌', '🍪', '🧇', '🍯', '✨'];

export function IceCreamShop({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);

    // Arrays representing scoops currently in the bowl
    const [leftScoops, setLeftScoops] = useState<number[]>([]);
    const [rightScoops, setRightScoops] = useState<number[]>([]);

    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);

    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [isCompleted, setIsCompleted] = useState(false);
    const [prize, setPrize] = useState('🍒');

    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 4) + 1; // 1 to 4
        const n2 = Math.floor(Math.random() * 4) + 1; // 1 to 4

        setNum1(n1);
        setNum2(n2);

        setLeftScoops([]);
        setRightScoops([]);
        setMessage({ text: '', type: '' });
    };

    useEffect(() => {
        generateQuestion();
        setPrize(SHOP_PRIZES[Math.floor(Math.random() * SHOP_PRIZES.length)]);
    }, []);

    const addScoop = (side: 'left' | 'right') => {
        if (message.type !== '') return;

        if (side === 'left') {
            if (leftScoops.length < 6) setLeftScoops([...leftScoops, Date.now()]);
        } else {
            if (rightScoops.length < 6) setRightScoops([...rightScoops, Date.now()]);
        }
    };

    const removeScoop = (side: 'left' | 'right', id: number) => {
        if (message.type !== '') return;

        if (side === 'left') {
            setLeftScoops(leftScoops.filter(s => s !== id));
        } else {
            setRightScoops(rightScoops.filter(s => s !== id));
        }
    };

    const checkAnswer = () => {
        if (message.type !== '') return;

        if (leftScoops.length === num1 && rightScoops.length === num2) {
            setMessage({ text: 'Perfect Sundae! 🍨', type: 'success' });
            const newScore = score + 1;
            setScore(newScore);

            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    setIsCompleted(true);
                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#f472b6', '#38bdf8', '#d97706', '#fef08a'] });
                }, 1000);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(generateQuestion, 1500);
            }
        } else {
            setMessage({ text: "Oops! Let's count the scoops again! ✨", type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 2500);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-purple-50 p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-purple-400 min-h-[500px]">

            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 bg-white/90 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-purple-200 flex-wrap gap-4">
                <h2 className="text-xl md:text-2xl font-bold font-display text-purple-700 uppercase tracking-wide flex items-center gap-2">
                    <IceCream2 className="w-8 h-8 text-purple-500" /> Ice Cream Shop
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Question {Math.min(currentQuestion, MAX_SCORE)} / {MAX_SCORE}</span>
                        <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-amber-100 px-4 py-1 rounded-full shadow-sm mt-1 border-2 border-amber-300">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            <span className="text-purple-700">{score}</span>
                        </div>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-purple-400 text-purple-700 font-bold hover:bg-purple-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                            Skip Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-2xl">

                    <div className="bg-white/90 border-4 border-purple-400 rounded-[2rem] p-6 md:p-8 w-full shadow-lg relative flex flex-col items-center mb-6">

                        <div className="text-5xl md:text-6xl font-black text-purple-600 drop-shadow-[2px_2px_0_#e9d5ff] mb-2 tracking-wider">
                            {num1} + {num2}
                        </div>
                        <p className="text-sm font-bold text-slate-500 mb-6 font-display text-center">Tap the tubs to add scoops! Tap scoops in the bowl to remove them.</p>

                        {/* Ice Cream Tubs */}
                        <div className="flex justify-center gap-4 w-full bg-slate-50 p-4 rounded-3xl border-2 border-dashed border-slate-300 mb-6">

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => addScoop('left')}
                                className="flex flex-col items-center bg-white border-4 border-pink-400 rounded-2xl p-4 shadow-sm w-32 hover:bg-pink-50 transition-colors"
                            >
                                <div className="text-5xl drop-shadow-sm mb-2">🍨</div>
                                <span className="text-xs font-black text-pink-500 tracking-wider">STRAWBERRY</span>
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => addScoop('right')}
                                className="flex flex-col items-center bg-white border-4 border-sky-400 rounded-2xl p-4 shadow-sm w-32 hover:bg-sky-50 transition-colors"
                            >
                                <div className="text-5xl drop-shadow-sm mb-2">🍦</div>
                                <span className="text-xs font-black text-sky-500 tracking-wider">MINT BLUE</span>
                            </motion.button>

                        </div>

                        {/* Serving Stage */}
                        <div className="flex flex-col items-center justify-end w-full bg-slate-100 p-6 pb-2 rounded-3xl border-4 border-slate-200 min-h-[160px] shadow-inner relative overflow-hidden">

                            {/* The Bowl */}
                            <div className="w-[240px] h-[80px] bg-white/70 border-4 border-slate-300 rounded-b-full flex relative z-10 shadow-lg backdrop-blur-sm overflow-visible items-end pb-2">

                                {/* Left Half */}
                                <div className="w-1/2 h-[120px] absolute bottom-0 left-0 border-r-2 border-dashed border-slate-300/50 flex flex-wrap-reverse justify-center items-start content-start p-2 gap-1 z-20">
                                    <AnimatePresence>
                                        {leftScoops.map(id => (
                                            <motion.button
                                                key={id}
                                                initial={{ y: -50, scale: 0.5, opacity: 0 }}
                                                animate={{ y: 0, scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                className="text-4xl -mb-4 drop-shadow-md hover:scale-110 transition-transform relative z-30"
                                                onClick={() => removeScoop('left', id)}
                                            >
                                                🍨
                                            </motion.button>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Right Half */}
                                <div className="w-1/2 h-[120px] absolute bottom-0 right-0 flex flex-wrap-reverse justify-center items-start content-start p-2 gap-1 z-20">
                                    <AnimatePresence>
                                        {rightScoops.map(id => (
                                            <motion.button
                                                key={id}
                                                initial={{ y: -50, scale: 0.5, opacity: 0 }}
                                                animate={{ y: 0, scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                className="text-4xl -mb-4 drop-shadow-md hover:scale-110 transition-transform relative z-30"
                                                onClick={() => removeScoop('right', id)}
                                            >
                                                🍦
                                            </motion.button>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {/* Bowl visual curve */}
                                <div className="absolute inset-0 rounded-b-full border-b-[8px] border-slate-300/50 pointer-events-none"></div>
                            </div>
                        </div>

                        <Button
                            className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold text-2xl h-16 px-8 rounded-full active:translate-y-1 active:shadow-none transition-all border-none shadow-[0_6px_0_0_#15803d]"
                            onClick={checkAnswer}
                            disabled={message.type !== ''}
                        >
                            Ring Bell & Serve! <BellRing className="ml-2 w-6 h-6" />
                        </Button>
                    </div>

                    {/* Feedback Message */}
                    <div className="h-16 flex items-center justify-center w-full">
                        <AnimatePresence mode="wait">
                            {message.text && (
                                <motion.div
                                    key="feedback"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-full font-bold text-xl border-4 shadow-md z-50 ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-400' : 'bg-red-50 text-red-600 border-red-400'
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
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center w-full max-w-lg mx-auto bg-white/90 p-8 rounded-[3rem] border-4 border-purple-400 shadow-xl relative overflow-hidden"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-purple-600 drop-shadow-sm uppercase">🍦 Ice Cream Master! 🍦</h1>
                    <p className="text-xl md:text-2xl text-slate-600 font-medium mb-2">You unlocked a special topping:</p>

                    <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [-10, 10, -10] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-8xl md:text-9xl my-4 filter drop-shadow-lg"
                    >
                        {prize}
                    </motion.div>

                    <div className="w-full bg-slate-100 rounded-2xl p-4 border-t-4 border-dashed border-purple-400 mt-4 mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Unlocked Topping</p>
                        <div className="flex justify-center items-center text-4xl">
                            {prize}
                        </div>
                    </div>

                    {onComplete ? (
                        <Button
                            size="lg"
                            className="bg-green-500 hover:bg-green-600 text-white font-bold text-2xl px-12 py-8 rounded-full shadow-[0_6px_0_0_#15803d] active:translate-y-2 active:shadow-none transition-all w-full"
                            onClick={onComplete}
                        >
                            Next Game <Play className="ml-2 w-8 h-8 fill-current" />
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#15803d] active:translate-y-1 active:shadow-none transition-all w-full"
                            onClick={() => {
                                setScore(0);
                                setCurrentQuestion(1);
                                setIsCompleted(false);
                                setPrize(SHOP_PRIZES[Math.floor(Math.random() * SHOP_PRIZES.length)]);
                                generateQuestion();
                            }}
                        >
                            Make Next Sundae! <Play className="ml-2 w-6 h-6 fill-current" />
                        </Button>
                    )}
                </motion.div>
            )}
        </div>
    );
}