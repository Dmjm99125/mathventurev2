import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, Star, ChevronRight } from 'lucide-react';

const REWARDS = ['🍩', '🍦', '🍕', '🍟', '🎨', '🚀', '🦖', '🦄', '🏆', '🐼', '🦁', '👑'];

export function FeedTheHippo({ onComplete }: { onComplete?: () => void }) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [options, setOptions] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [hippoFace, setHippoFace] = useState('🦛');
    
    const [isCompleted, setIsCompleted] = useState(false);
    const [wrongGuesses, setWrongGuesses] = useState<number[]>([]);
    const [prize, setPrize] = useState('');
    
    const MAX_SCORE = 5;

    const playSound = (type: 'correct' | 'wrong' | 'reward') => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            let utterance = new SpeechSynthesisUtterance();
            
            if (type === 'correct') {
                utterance.text = "Yum!";
                utterance.pitch = 1.6;
                utterance.rate = 1.4;
            } else if (type === 'wrong') {
                utterance.text = "Uh oh!";
                utterance.pitch = 1;
                utterance.rate = 1.3;
            } else if (type === 'reward') {
                utterance.text = "Wow! Magnificent! You got a prize!";
                utterance.pitch = 1.4;
                utterance.rate = 1.1;
            }
            window.speechSynthesis.speak(utterance);
        }
    };

    const generateQuestion = () => {
        const n1 = Math.floor(Math.random() * 6) + 3; // 3 to 8
        const n2 = Math.floor(Math.random() * (n1 + 1)); // 0 to n1
        const correctAnswer = n1 - n2;
        
        setHippoFace('🦛');
        setWrongGuesses([]);
        
        const opts = new Set<number>();
        opts.add(correctAnswer);
        
        while (opts.size < 4) {
            let fake = Math.floor(Math.random() * 9); // 0 to 8
            opts.add(fake);
        }
        
        setNum1(n1);
        setNum2(n2);
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    };

    useEffect(() => {
        generateQuestion();
    }, []);

    const checkAnswer = (selected: number) => {
        const correctAnswer = num1 - num2;
        
        if (selected === correctAnswer) {
            playSound('correct');
            setHippoFace('😋');
            
            const newScore = score + 1;
            setScore(newScore);
            
            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    playSound('reward');
                    setPrize(REWARDS[Math.floor(Math.random() * REWARDS.length)]);
                    setIsCompleted(true);
                    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#9b5de5', '#f15bb5', '#fee440', '#00bbf9'] });
                }, 1000);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(generateQuestion, 1200);
            }
        } else {
            if (!wrongGuesses.includes(selected)) {
                playSound('wrong');
                setWrongGuesses(prev => [...prev, selected]);
            }
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto bg-gradient-to-br from-sky-100 to-sky-200 p-4 md:p-8 rounded-[2rem] shadow-2xl flex flex-col items-center relative border-8 border-sky-300 min-h-[600px] overflow-hidden text-slate-800">
            
            {/* Header / HUD */}
            <div className="w-full flex justify-between items-center mb-4 bg-white/80 p-3 rounded-2xl shadow-sm border-2 border-sky-100">
                <div className="text-sm md:text-base font-bold text-pink-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-2xl">⭐</span> Score: {score}
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-sm md:text-base font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <span className="text-2xl">🎯</span> Target: {MAX_SCORE}
                    </div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-sky-300 text-sky-700 font-bold hover:bg-sky-50 rounded-xl hidden md:flex h-9 px-3" onClick={onComplete}>
                            Skip <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>
            </div>

            {!isCompleted ? (
                <div className="flex flex-col items-center w-full max-w-sm flex-1">
                    
                    {/* Animated Character Area */}
                    <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="text-7xl md:text-8xl my-4 drop-shadow-md h-24 flex items-center justify-center"
                    >
                        {hippoFace}
                    </motion.div>

                    <p className="font-bold text-slate-500 mb-2 mt-4 text-center">Feed the Hippo! Choose the right snack value:</p>

                    {/* Math Box */}
                    <div className="text-5xl md:text-6xl font-black text-slate-800 mb-8 bg-white/60 px-8 py-4 rounded-3xl shadow-inner border-2 border-slate-200">
                        {num1} - {num2}
                    </div>

                    {/* Answers Grid */}
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {options.map((opt, index) => {
                            const isWrong = wrongGuesses.includes(opt);
                            const isCorrect = score > 0 && hippoFace === '😋' && opt === num1 - num2; // Briefly correct
                            
                            return (
                                <Button 
                                    key={`opt-${index}`}
                                    className={`
                                        h-20 text-4xl font-bold rounded-[1.5rem] border-none transition-all
                                        ${isWrong 
                                            ? 'bg-red-500 text-white shadow-[0_2px_0_0_#b91c1c] opacity-50 cursor-not-allowed transform translate-y-1' 
                                            : isCorrect
                                                ? 'bg-green-500 hover:bg-green-400 text-white shadow-[0_2px_0_0_#15803d] transform translate-y-1'
                                                : 'bg-sky-400 hover:bg-sky-300 text-white shadow-[0_8px_0_0_#0284c7] active:translate-y-2 active:shadow-[0_2px_0_0_#0284c7]'
                                        }
                                    `}
                                    onClick={() => !isWrong && checkAnswer(opt)}
                                    disabled={isWrong || hippoFace === '😋'}
                                >
                                    {opt}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center w-full bg-white/95 p-8 rounded-[2rem] shadow-xl relative z-20 border-4 border-pink-300"
                >
                    <h2 className="text-3xl md:text-4xl font-black text-pink-500 drop-shadow-sm uppercase">🌟 10 Points Reward! 🌟</h2>
                    <p className="text-lg md:text-xl text-slate-600 font-bold mb-4">You earned a new sticker for your book!</p>
                    
                    <motion.div 
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: "spring", bounce: 0.6, duration: 1 }}
                        className="text-8xl md:text-9xl my-6 drop-shadow-lg"
                    >
                        {prize}
                    </motion.div>
                    
                    <Button 
                            size="lg" 
                            className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#be185d] active:translate-y-1 active:shadow-none transition-all w-full border-none"
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