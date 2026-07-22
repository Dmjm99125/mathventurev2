import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star, Rocket, Sparkles } from 'lucide-react';

const GALAXY_PRIZES = ['🪐', '🌍', '☄️', '🛸', '👽', '☀️', '🌕'];

export function ComicStarCatcher({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    
    // Arrays representing stars currently in the tanks
    const [leftStars, setLeftStars] = useState<number[]>([]);
    const [rightStars, setRightStars] = useState<number[]>([]);
    
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
    const [isCompleted, setIsCompleted] = useState(false);
    const [prize, setPrize] = useState('🪐');
    
    // Animation state
    const [isLaunching, setIsLaunching] = useState(false);
    
    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 5) + 1; // 1 to 5
        const n2 = Math.floor(Math.random() * 5) + 1; // 1 to 5
        
        setNum1(n1);
        setNum2(n2);
        
        setLeftStars([]);
        setRightStars([]);
        setMessage({ text: '', type: '' });
        setIsLaunching(false);
    };

    useEffect(() => {
        generateQuestion();
        setPrize(GALAXY_PRIZES[Math.floor(Math.random() * GALAXY_PRIZES.length)]);
    }, []);

    const addStar = (side: 'left' | 'right') => {
        if (message.type !== '' || isLaunching) return;
        
        if (side === 'left') {
            if (leftStars.length < 6) setLeftStars([...leftStars, Date.now()]);
        } else {
            if (rightStars.length < 6) setRightStars([...rightStars, Date.now()]);
        }
    };

    const removeStar = (side: 'left' | 'right', id: number) => {
        if (message.type !== '' || isLaunching) return;
        
        if (side === 'left') {
            setLeftStars(leftStars.filter(s => s !== id));
        } else {
            setRightStars(rightStars.filter(s => s !== id));
        }
    };

    const checkAnswer = () => {
        if (message.type !== '' || isLaunching) return;
        
        if (leftStars.length === num1 && rightStars.length === num2) {
            setMessage({ text: 'Hyperdrive Engaged! 🚀', type: 'success' });
            setIsLaunching(true);
            const newScore = score + 1;
            setScore(newScore);
            
            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    setIsCompleted(true);
                    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#22d3ee', '#f59e0b', '#c084fc', '#ffffff'] });
                }, 1200);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(generateQuestion, 1500);
            }
        } else {
            setMessage({ text: "Engine check! Count the stars again! ✨", type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 2500);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-slate-900 p-6 md:p-10 rounded-[3rem] shadow-2xl flex flex-col items-center relative border-8 border-cyan-400 min-h-[500px]">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 bg-slate-800/90 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-cyan-500/30 flex-wrap gap-4">
                <h2 className="text-xl md:text-2xl font-bold font-display text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-cyan-400" /> Star Catcher
                </h2>
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Question {Math.min(currentQuestion, MAX_SCORE)} / {MAX_SCORE}</span>
                        <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-cyan-100 bg-cyan-900/50 px-4 py-1 rounded-full shadow-sm mt-1 border border-cyan-500/50">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span>{score}</span>
                        </div>
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-cyan-500/50 text-cyan-400 font-bold hover:bg-cyan-950 rounded-xl bg-slate-800 hidden md:flex" onClick={onComplete}>
                            Skip Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-2xl">
                    
                    <div className="bg-slate-800/90 border-4 border-cyan-500/50 rounded-[2rem] p-6 md:p-8 w-full shadow-[0_0_30px_rgba(34,211,238,0.15)] relative flex flex-col items-center mb-6">
                        
                        <div className="text-5xl md:text-6xl font-black text-white drop-shadow-[0_0_15px_#22d3ee] mb-2 tracking-wider">
                            {num1} + {num2}
                        </div>
                        <p className="text-sm font-bold text-slate-400 mb-6 font-display text-center">Tap a star to load fuel! Tap a star in the tank to delete it.</p>

                        {/* Star Dispensers */}
                        <div className="flex justify-center gap-4 w-full bg-slate-900/60 p-4 rounded-3xl border-2 border-dashed border-slate-600 mb-6">
                            
                            <motion.button 
                                whileTap={{ scale: 0.9 }}
                                onClick={() => addStar('left')}
                                className="flex flex-col items-center bg-slate-800 border-b-4 border-slate-950 rounded-2xl p-4 shadow-sm w-32 hover:bg-slate-700 transition-colors"
                            >
                                <div className="text-5xl drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] mb-2">⭐</div>
                                <span className="text-xs font-black text-amber-500 tracking-wider">ADD GOLD</span>
                            </motion.button>
                            
                            <motion.button 
                                whileTap={{ scale: 0.9 }}
                                onClick={() => addStar('right')}
                                className="flex flex-col items-center bg-slate-800 border-b-4 border-slate-950 rounded-2xl p-4 shadow-sm w-32 hover:bg-slate-700 transition-colors"
                            >
                                <div className="text-5xl drop-shadow-[0_0_10px_rgba(192,132,252,0.5)] mb-2">✨</div>
                                <span className="text-xs font-black text-purple-400 tracking-wider">ADD PURPLE</span>
                            </motion.button>

                        </div>

                        {/* Spaceship Stage */}
                        <div className="flex items-center justify-center gap-4 md:gap-8 w-full bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)] p-6 rounded-3xl border-4 border-slate-700 min-h-[160px] shadow-inner relative overflow-hidden">
                            
                            {/* Left Tank */}
                            <div className="w-[100px] h-[100px] bg-white/5 border-4 border-amber-500/70 rounded-2xl flex flex-wrap content-center justify-center gap-1 p-1">
                                <AnimatePresence>
                                    {leftStars.map(id => (
                                        <motion.button
                                            key={id}
                                            initial={{ scale: 0, filter: "brightness(3)" }}
                                            animate={{ scale: 1, filter: "brightness(1)" }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="text-2xl hover:scale-110 transition-transform cursor-pointer"
                                            onClick={() => removeStar('left', id)}
                                        >
                                            ⭐
                                        </motion.button>
                                    ))}
                                </AnimatePresence>
                            </div>
                            
                            {/* Rocket */}
                            <motion.div 
                                animate={isLaunching ? { y: -300, scale: 1.5 } : { y: 0, scale: 1 }}
                                transition={isLaunching ? { duration: 0.8, ease: "easeIn" } : { duration: 0 }}
                                className="text-6xl md:text-7xl z-10"
                            >
                                🚀
                            </motion.div>
                            
                            {/* Right Tank */}
                            <div className="w-[100px] h-[100px] bg-white/5 border-4 border-purple-400/70 rounded-2xl flex flex-wrap content-center justify-center gap-1 p-1">
                                <AnimatePresence>
                                    {rightStars.map(id => (
                                        <motion.button
                                            key={id}
                                            initial={{ scale: 0, filter: "brightness(3)" }}
                                            animate={{ scale: 1, filter: "brightness(1)" }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="text-2xl hover:scale-110 transition-transform cursor-pointer"
                                            onClick={() => removeStar('right', id)}
                                        >
                                            ✨
                                        </motion.button>
                                    ))}
                                </AnimatePresence>
                            </div>

                        </div>

                        <Button 
                            className="mt-6 bg-red-500 hover:bg-red-600 text-white font-black text-xl md:text-2xl h-16 px-8 rounded-full active:translate-y-1 active:shadow-none transition-all border-none shadow-[0_6px_0_0_#991b1b] uppercase tracking-wide"
                            onClick={checkAnswer}
                            disabled={message.type !== '' || isLaunching}
                        >
                            Launch Hyperdrive! <Rocket className="ml-2 w-6 h-6" />
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
                                    className={`flex items-center gap-3 px-6 py-3 rounded-full font-bold text-xl border-4 shadow-md z-50 ${
                                        message.type === 'success' ? 'bg-cyan-900/80 text-cyan-300 border-cyan-500' : 'bg-red-900/80 text-red-300 border-red-500'
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
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center w-full max-w-lg mx-auto bg-[radial-gradient(circle,_#1e1b4b_0%,_#090514_100%)] p-8 rounded-[3rem] border-4 border-cyan-500 shadow-[0_0_40px_rgba(34,211,238,0.3)] relative overflow-hidden"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-cyan-400 drop-shadow-[0_0_10px_#22d3ee] uppercase">🚀 Orbit Reached! 🚀</h1>
                    <p className="text-xl md:text-2xl text-slate-300 font-medium mb-2">Your hyperdrive discovered a planet:</p>
                    
                    <motion.div 
                        animate={{ scale: [1, 1.1, 1], rotate: [-5, 5, -5] }} 
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="text-8xl md:text-9xl my-4 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        {prize}
                    </motion.div>

                    <div className="w-full bg-slate-900/50 rounded-2xl p-4 border-t-4 border-dashed border-cyan-500/50 mt-4 mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Discovered Space Map</p>
                        <div className="flex justify-center items-center text-4xl">
                            {prize}
                        </div>
                    </div>
                    
                    <Button 
                            size="lg" 
                            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#0891b2] active:translate-y-1 active:shadow-none transition-all w-full uppercase"
                            onClick={() => {
                                setScore(0);
                                setCurrentQuestion(1);
                                setIsCompleted(false);
                                setPrize(GALAXY_PRIZES[Math.floor(Math.random() * GALAXY_PRIZES.length)]);
                                generateQuestion();
                            }}
                        >
                            Explore More! <Rocket className="ml-2 w-6 h-6" />
                        </Button>
                </motion.div>
            )}
        </div>
    );
}