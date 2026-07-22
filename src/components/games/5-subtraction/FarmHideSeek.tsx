import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, Star, ChevronRight } from 'lucide-react';

const FARM_ANIMALS = ['🐄', '🐖', '🐑', '🐓', '🦆', '🐎'];

export function FarmHideSeek({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [activeAnimal, setActiveAnimal] = useState('🐄');
    const [options, setOptions] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    // State to trigger the walk-away animation
    const [hideAnimals, setHideAnimals] = useState(false);
    
    const [isCompleted, setIsCompleted] = useState(false);
    const [wrongGuesses, setWrongGuesses] = useState<number[]>([]);
    
    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 5) + 4; // 4 to 8
        const n2 = Math.floor(Math.random() * n1) + 1; // 1 to n1
        const correctAnswer = n1 - n2;
        
        setActiveAnimal(FARM_ANIMALS[Math.floor(Math.random() * FARM_ANIMALS.length)]);
        setHideAnimals(false);
        setWrongGuesses([]);
        
        const opts = new Set<number>();
        opts.add(correctAnswer);
        
        while (opts.size < 3) {
            let fake = Math.floor(Math.random() * 9); // 0 to 8
            opts.add(fake);
        }
        
        setNum1(n1);
        setNum2(n2);
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
        
        // Trigger animation after short delay
        setTimeout(() => {
            setHideAnimals(true);
        }, 600);
    };

    useEffect(() => {
        generateQuestion();
    }, []);

    const checkAnswer = (selected: number) => {
        const correctAnswer = num1 - num2;
        
        if (selected === correctAnswer) {
            const newScore = score + 1;
            setScore(newScore);
            
            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    setIsCompleted(true);
                    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#4ad66d', '#ef4444', '#f59e0b', '#bae6fd'] });
                }, 800);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(generateQuestion, 1200);
            }
        } else {
            if (!wrongGuesses.includes(selected)) {
                setWrongGuesses(prev => [...prev, selected]);
            }
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto bg-gradient-to-b from-sky-200 via-green-100 to-green-50 p-4 md:p-8 rounded-[2rem] shadow-2xl flex flex-col items-center relative border-8 border-amber-700 min-h-[650px] overflow-hidden">
            
            {/* Header / HUD */}
            <div className="w-full flex justify-between items-center mb-4 bg-white/90 p-3 rounded-2xl shadow-sm border-2 border-amber-600">
                <div className="text-sm md:text-base font-bold text-green-600 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-2xl">⭐</span> Score: {score}
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-sm md:text-base font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
                        <span className="text-2xl">🏆</span> Target: {MAX_SCORE}
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-amber-400 text-amber-700 font-bold hover:bg-amber-50 rounded-xl hidden md:flex h-9 px-3" onClick={onComplete}>
                            Skip <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>

            <p className="font-bold text-slate-600 mb-2 drop-shadow-sm text-center">Count how many stay in the grass!</p>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-sm flex-1">
                    
                    {/* The Meadow and Barn Stage */}
                    <div className="w-full h-48 bg-gradient-to-b from-sky-300 via-sky-200 to-green-500 rounded-3xl relative border-4 border-green-600 overflow-hidden shadow-inner mb-6">
                        {/* Barn Emoji */}
                        <div className="absolute right-2 top-2 text-6xl drop-shadow-lg z-10">
                            🏡
                        </div>
                        
                        {/* Pasture Animals */}
                        <div className="absolute left-2 top-16 right-24 bottom-2 flex flex-wrap gap-2 content-start z-0">
                            {Array.from({ length: num1 }).map((_, i) => {
                                const isHiding = hideAnimals && i < num2;
                                return (
                                    <motion.div
                                        key={`animal-${i}-${num1}`}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={
                                            isHiding 
                                            ? { x: 220, y: -40, scale: 0.5, opacity: 0.3 } 
                                            : { x: 0, y: 0, scale: 1, opacity: 1 }
                                        }
                                        transition={{ 
                                            type: isHiding ? "tween" : "spring", 
                                            duration: isHiding ? 2 : 0.5,
                                            ease: isHiding ? "easeInOut" : undefined,
                                            delay: isHiding ? i * 0.1 : i * 0.05
                                        }}
                                        className="text-4xl drop-shadow-md"
                                    >
                                        {activeAnimal}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Math Problem Text */}
                    <div className="text-5xl md:text-6xl font-black text-red-600 drop-shadow-[2px_2px_0px_#fef08a] mb-8 tracking-wider font-display">
                        {num1} - {num2}
                    </div>

                    {/* Answer Choices */}
                    <div className="grid grid-cols-3 gap-4 w-full">
                        {options.map((opt, index) => {
                            const isWrong = wrongGuesses.includes(opt);
                            return (
                                <Button 
                                    key={`opt-${index}`}
                                    className={`
                                        h-20 text-3xl font-bold rounded-[1.5rem] border-none transition-all
                                        ${isWrong 
                                            ? 'bg-slate-400 text-slate-200 shadow-[0_2px_0_0_#475569] opacity-50 cursor-not-allowed transform translate-y-1' 
                                            : 'bg-amber-500 hover:bg-amber-400 text-white shadow-[0_6px_0_0_#b45309] active:translate-y-1 active:shadow-none'
                                        }
                                    `}
                                    onClick={() => !isWrong && checkAnswer(opt)}
                                    disabled={isWrong}
                                >
                                    {opt}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center w-full bg-white/95 p-8 rounded-[2rem] border-4 border-yellow-400 shadow-xl relative"
                >
                    <h2 className="text-3xl md:text-4xl font-black text-yellow-500 drop-shadow-sm uppercase">🏆 Farm Master! 🏆</h2>
                    <p className="text-lg md:text-xl text-slate-600 font-bold mb-4">Amazing! You unlocked a Golden Trophy!</p>
                    
                    <motion.div 
                        animate={{ scale: [1, 1.15, 1] }} 
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="text-8xl md:text-9xl my-6 drop-shadow-lg"
                    >
                        🏆
                    </motion.div>
                    
                    <Button 
                            size="lg" 
                            className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#15803d] active:translate-y-1 active:shadow-none transition-all w-full border-none"
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
        </div>
    );
}