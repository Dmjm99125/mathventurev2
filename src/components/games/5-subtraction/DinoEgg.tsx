import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, Star } from 'lucide-react';

const BABY_DINOS = ['🦕', '🦖', '👶', '🐉', '🐊'];
const FOSSILS = ['🦴', '🦕', '🦖', '🌋', '🌴', '💎', '👑'];

export function DinoEgg({ onComplete }: { onComplete?: () => void }) {
    const [targetAnswer, setTargetAnswer] = useState(0);
    const [promptText, setPromptText] = useState('');
    const [nests, setNests] = useState<{ id: number, count: number, isHatched: boolean, baby: string, isWrong: boolean }[]>([]);
    
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [isCompleted, setIsCompleted] = useState(false);
    const [fossilPrize, setFossilPrize] = useState('');
    
    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const isSubtraction = Math.random() > 0.5;
        let answer = 0;
        let text = '';
        
        if (!isSubtraction) {
            answer = Math.floor(Math.random() * 6) + 2; // 2 to 7
            text = `Find the nest with ${answer} eggs!`;
        } else {
            const num1 = Math.floor(Math.random() * 4) + 5; // 5 to 8
            const num2 = Math.floor(Math.random() * 4) + 1; // 1 to 4
            answer = num1 - num2;
            text = `Which nest has ${num1} - ${num2} eggs?`;
        }
        
        const counts = new Set<number>();
        counts.add(answer);
        
        while (counts.size < 3) {
            counts.add(Math.floor(Math.random() * 7) + 1); // 1 to 7
        }
        
        const nestOptions = Array.from(counts)
            .sort(() => Math.random() - 0.5)
            .map((count, i) => ({
                id: i,
                count: count,
                isHatched: false,
                baby: BABY_DINOS[Math.floor(Math.random() * BABY_DINOS.length)],
                isWrong: false
            }));
            
        setTargetAnswer(answer);
        setPromptText(text);
        setNests(nestOptions);
    };

    useEffect(() => {
        generateQuestion();
    }, []);

    const handleTapNest = (id: number, count: number) => {
        if (nests.find(n => n.isHatched)) return; // Prevent clicking after correct answer
        
        if (count === targetAnswer) {
            // Correct
            setNests(prev => prev.map(n => n.id === id ? { ...n, isHatched: true } : n));
            const newScore = score + 1;
            setScore(newScore);
            
            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    setFossilPrize(FOSSILS[Math.floor(Math.random() * FOSSILS.length)]);
                    setIsCompleted(true);
                    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ['#f97316', '#15803d', '#fef08a'] });
                }, 1200);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(generateQuestion, 1600);
            }
        } else {
            // Wrong
            setNests(prev => prev.map(n => n.id === id ? { ...n, isWrong: true } : n));
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto bg-gradient-to-b from-sky-200 to-green-200 p-4 md:p-8 rounded-[2rem] shadow-2xl flex flex-col items-center relative border-8 border-green-700 min-h-[650px]">
            
            {/* HUD */}
            <div className="w-full flex justify-between items-center mb-4 bg-white/80 p-3 rounded-2xl shadow-sm border-2 border-green-700">
                <div className="text-sm md:text-base font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1">
                    <span className="text-2xl">🥚</span> Hatched: {score}
                </div>
                <div className="text-sm md:text-base font-bold text-green-700 uppercase tracking-widest flex items-center gap-1">
                    <span className="text-2xl">🦴</span> Target: {MAX_SCORE}
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex flex-col items-center w-full relative flex-1">
                
                {/* Dino Mom Dashboard */}
                <div className="bg-green-50 border-4 border-dashed border-green-700 rounded-3xl p-4 w-full shadow-md relative flex flex-col items-center mb-6">
                    <motion.div 
                        animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="text-6xl md:text-7xl drop-shadow-md mb-2"
                    >
                        🦖
                    </motion.div>
                    <div className="text-2xl md:text-3xl font-black text-green-600 text-center drop-shadow-[1px_1px_0px_#fef08a]">
                        {promptText}
                    </div>
                </div>

                <p className="text-slate-600 font-bold mb-4">Tap the correct nest to help them hatch!</p>

                {/* Nests Container */}
                <div className="flex flex-col gap-4 w-full mb-6">
                    {nests.map((nest) => (
                        <motion.button
                            key={nest.id}
                            whileHover={{ scale: nest.isWrong || nest.isHatched ? 1 : 1.02 }}
                            whileTap={{ scale: nest.isWrong || nest.isHatched ? 1 : 0.95 }}
                            onClick={() => handleTapNest(nest.id, nest.count)}
                            disabled={nest.isWrong || nests.some(n => n.isHatched)}
                            className={`
                                w-full min-h-[90px] rounded-[1.5rem] p-4 flex justify-center items-center gap-2 flex-wrap shadow-lg border-4 transition-all
                                ${nest.isWrong ? 'opacity-30 border-amber-900 bg-amber-900/50 cursor-not-allowed' : 'bg-gradient-to-b from-yellow-200 via-yellow-100 to-amber-900 border-amber-900 cursor-pointer'}
                            `}
                        >
                            <AnimatePresence mode="popLayout">
                                {Array.from({ length: nest.count }).map((_, i) => (
                                    <motion.span
                                        key={`item-${nest.id}-${i}`}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: nest.isHatched ? 1.2 : 1 }}
                                        transition={{ type: "spring", bounce: 0.5, delay: nest.isHatched ? i * 0.1 : 0 }}
                                        className="text-4xl drop-shadow-md inline-block"
                                    >
                                        {nest.isHatched ? nest.baby : '🥚'}
                                    </motion.span>
                                ))}
                            </AnimatePresence>
                        </motion.button>
                    ))}
                </div>

                {onComplete && (
                    <Button variant="ghost" className="text-green-800 font-bold hover:bg-green-300/50 rounded-xl" onClick={onComplete}>
                        Skip Game ➡️
                    </Button>
                )}
            </div>

            {/* Success Overlay Popups */}
            <AnimatePresence>
                {isCompleted && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 z-50 bg-white/95 rounded-[1.5rem] flex flex-col items-center justify-center p-8 text-center"
                    >
                        <h2 className="text-3xl md:text-4xl font-black text-orange-500 mb-2 drop-shadow-sm">🦖 Fossil Unlocked! 🦖</h2>
                        <p className="text-lg md:text-xl font-bold text-slate-600 mb-8">You are a certified Dino Expert!</p>
                        
                        <motion.div 
                            animate={{ y: [-15, 0, -15], scale: [1.1, 1, 1.1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="text-8xl md:text-9xl mb-10 drop-shadow-lg"
                        >
                            {fossilPrize}
                        </motion.div>
                        
                        <Button 
                                size="lg" 
                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#c2410c] active:translate-y-1 active:shadow-none transition-all w-full border-none"
                                onClick={() => {
                                    setScore(0);
                                    setCurrentQuestion(1);
                                    setIsCompleted(false);
                                    generateQuestion();
                                }}
                            >
                                Repeat Game <Play className="ml-2 w-6 h-6 fill-current" />
                            </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}