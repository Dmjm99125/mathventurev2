import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star, LogIn } from 'lucide-react';

const CHARACTERS = ['🐻', '🐱', '🐸'];
const FRUITS = ["🍎", "🍌", "🍇", "🍓", "🍍"];

export function SubtractionAdventure({ onComplete }: { onComplete?: () => void }) {
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
    const [character, setCharacter] = useState('🐻');
    
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [fruit, setFruit] = useState("🍎");
    const [options, setOptions] = useState<number[]>([]);
    
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });

    const MAX_SCORE = 5;

    const generateQuestion = (currentLevel: number = 1) => {
        const max = 5 + currentLevel; // Slight difficulty scaling
        const n1 = Math.floor(Math.random() * max) + 2;
        const n2 = Math.floor(Math.random() * (n1 + 1));
        const correctAnswer = n1 - n2;
        
        const f = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        
        // Generate options (4 options)
        const opts = new Set<number>();
        opts.add(correctAnswer);
        
        while (opts.size < 4) {
            let fake = Math.floor(Math.random() * 10);
            opts.add(fake);
        }
        
        setNum1(n1);
        setNum2(n2);
        setFruit(f);
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
        setMessage({ text: '', type: '' });
    };

    const startGame = () => {
        setScore(0);
        setCurrentQuestion(1);
        generateQuestion(1);
        setGameState('playing');
    };

    const checkAnswer = (selected: number) => {
        if (message.type !== '') return;
        
        const correctAnswer = num1 - num2;
        
        if (selected === correctAnswer) {
            setMessage({ text: 'Tama! (Correct!) 🎉', type: 'success' });
            const newScore = score + 1;
            setScore(newScore);
            
            if (currentQuestion >= MAX_SCORE) {
                setTimeout(() => {
                    setGameState('completed');
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                }, 1000);
            } else {
                setCurrentQuestion(q => q + 1);
                setTimeout(() => generateQuestion(Math.floor(newScore / 2) + 1), 1200);
            }
        } else {
            setMessage({ text: `Oops! Subukan muli! (Try again!)`, type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 1200);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-gradient-to-t from-[#c2e9fb] to-[#a1c4fd] p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-blue-300 min-h-[500px]">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 bg-white/70 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-blue-200 flex-wrap gap-4 relative z-10">
                <h2 className="text-xl md:text-2xl font-bold font-display text-blue-700 uppercase tracking-wide flex items-center gap-2">
                    🎮 Subtraction Adventure
                </h2>
                {gameState === 'playing' && (
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
                                Skip ➡️
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {gameState === 'menu' && (
                    <motion.div 
                        key="menu"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center w-full max-w-xl bg-white/90 p-8 rounded-[3rem] shadow-lg border-4 border-blue-400"
                    >
                        <h1 className="text-3xl md:text-4xl font-black text-blue-600 drop-shadow-sm mb-6 text-center">Choose Your Hero!</h1>
                        
                        <div className="flex gap-6 mb-10">
                            {CHARACTERS.map((char) => (
                                <motion.button
                                    key={char}
                                    whileHover={{ scale: 1.1, y: -5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setCharacter(char)}
                                    className={`text-6xl md:text-7xl p-4 rounded-3xl transition-colors border-4 ${character === char ? 'bg-blue-100 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-transparent border-transparent hover:bg-slate-100'}`}
                                >
                                    {char}
                                </motion.button>
                            ))}
                        </div>

                        <Button 
                            size="lg" 
                            className="bg-blue-500 hover:bg-blue-600 text-white font-black text-2xl px-12 py-8 rounded-full shadow-[0_6px_0_0_#2563eb] active:translate-y-2 active:shadow-none transition-all w-full border-none"
                            onClick={startGame}
                        >
                            Start Game <Play className="ml-2 w-8 h-8 fill-current" />
                        </Button>
                    </motion.div>
                )}

                {gameState === 'playing' && (
                    <motion.div 
                        key="playing"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center w-full max-w-3xl relative z-10"
                    >
                        <div className="bg-white/80 border-4 border-blue-300 rounded-[2rem] p-6 md:p-8 w-full shadow-lg relative flex flex-col items-center mb-6">
                            
                            {/* Character & Story */}
                            <div className="flex flex-col items-center mb-6">
                                <motion.div 
                                    animate={{ y: [0, -10, 0] }} 
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-6xl md:text-7xl drop-shadow-md mb-4"
                                >
                                    {character}
                                </motion.div>
                                <p className="text-xl md:text-2xl font-bold text-slate-700 text-center px-4">
                                    {character} ay mayroong <span className="text-blue-600">{num1} {fruit}</span>. Kinain niya ang <span className="text-red-500">{num2}</span>. Ilan ang natira?
                                </p>
                            </div>

                            {/* Visual Representation */}
                            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 w-full bg-blue-50/60 p-4 rounded-3xl border-2 border-blue-200 mb-8 min-h-[100px]">
                                <div className="text-3xl md:text-4xl drop-shadow-sm flex flex-wrap max-w-[200px] justify-center gap-1">
                                    {Array.from({ length: num1 }).map((_, i) => <span key={i}>{fruit}</span>)}
                                </div>
                                <div className="text-4xl font-black text-slate-400 mx-2">➖</div>
                                <div className="text-3xl md:text-4xl drop-shadow-sm flex flex-wrap max-w-[200px] justify-center gap-1 opacity-60 grayscale-[0.3]">
                                    {Array.from({ length: num2 }).map((_, i) => <span key={i}>{fruit}</span>)}
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
                                        className="bg-white hover:bg-blue-50 text-blue-700 border-4 border-blue-400 font-bold text-4xl w-20 h-20 md:w-24 md:h-24 rounded-2xl active:translate-y-1 active:shadow-none transition-all shadow-[0_6px_0_0_#60a5fa]"
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
                                        className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-xl md:text-2xl border-4 shadow-lg z-50 ${
                                            message.type === 'success' ? 'bg-green-50 text-green-700 border-green-500' : 'bg-red-50 text-red-600 border-red-400'
                                        }`}
                                    >
                                        {message.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                                        {message.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <Button 
                            variant="ghost" 
                            className="mt-2 text-slate-500 hover:bg-white/50 font-bold"
                            onClick={() => setGameState('menu')}
                        >
                            <LogIn className="w-5 h-5 mr-2 rotate-180" /> Change Character
                        </Button>
                    </motion.div>
                )}

                {gameState === 'completed' && (
                    <motion.div 
                        key="completed"
                        initial={{ opacity: 0, scale: 0.8 }} 
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center w-full max-w-lg mx-auto bg-white/90 p-8 rounded-[3rem] border-4 border-blue-400 shadow-xl relative z-10"
                    >
                        <h1 className="text-4xl md:text-5xl font-black text-blue-600 drop-shadow-sm uppercase">Adventure Complete!</h1>
                        <p className="text-xl md:text-2xl text-slate-600 font-medium mb-4">Your hero saved the day!</p>
                        
                        <div className="text-8xl md:text-9xl my-4 filter drop-shadow-lg flex items-center gap-4">
                            🏆
                        </div>
                        
                        <Button 
                                size="lg" 
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_6px_0_0_#2563eb] active:translate-y-1 active:shadow-none transition-all w-full border-none"
                                onClick={() => setGameState('menu')}
                            >
                                Repeat Game <Play className="ml-2 w-6 h-6 fill-current" />
                            </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}