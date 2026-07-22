import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, CheckCircle2, XCircle, Star, Map } from 'lucide-react';

const CHARACTERS = ['🐻', '🐱', '🐸'];
const FRUITS = ['🍎', '🍌', '🍇', '🍓', '🍍'];

export function AdditionAdventure({ onComplete }: { onComplete?: () => void }) {
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu');
    const [character, setCharacter] = useState('🐻');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    
    // Question state
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [fruit, setFruit] = useState('🍎');
    const [options, setOptions] = useState<number[]>([]);
    
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
    
    const MAX_SCORE = 5;

    const generateQuestion = () => {
        const max = 5 + level;
        const n1 = Math.floor(Math.random() * max) + 1;
        const n2 = Math.floor(Math.random() * max) + 1;
        const correctAnswer = n1 + n2;
        const selectedFruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
        
        // Generate options
        const opts = new Set<number>();
        opts.add(correctAnswer);
        while (opts.size < 4) {
            opts.add(Math.floor(Math.random() * (max * 2)) + 1);
        }
        
        setNum1(n1);
        setNum2(n2);
        setFruit(selectedFruit);
        setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
        setMessage({ text: '', type: '' });
    };

    const startGame = (char: string) => {
        setCharacter(char);
        setScore(0);
        setLevel(1);
        setGameState('playing');
        generateQuestion();
    };

    const checkAnswer = (selected: number) => {
        if (message.type !== '') return;
        
        const correctAnswer = num1 + num2;
        
        if (selected === correctAnswer) {
            setMessage({ text: 'Tama! (Correct!) 🎉', type: 'success' });
            const newScore = score + 1;
            setScore(newScore);
            
            if (newScore >= MAX_SCORE) {
                setTimeout(() => {
                    setGameState('completed');
                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                }, 1000);
            } else {
                if (newScore % 2 === 0) setLevel(l => l + 1); // Level up every 2 questions
                setTimeout(generateQuestion, 1500);
            }
        } else {
            setMessage({ text: 'Oops! Subukan muli.', type: 'error' });
            setTimeout(() => {
                setMessage({ text: '', type: '' });
            }, 1500);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-indigo-50 p-6 md:p-10 rounded-[3rem] shadow-xl flex flex-col items-center relative border-8 border-indigo-300 min-h-[500px]">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-indigo-200 flex-wrap gap-4">
                <h2 className="text-xl md:text-2xl font-bold font-display text-indigo-700 uppercase tracking-wide flex items-center gap-2">
                    <Map className="w-8 h-8 text-indigo-500" /> Addition Adventure
                </h2>
                {gameState === 'playing' && (
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-700 bg-indigo-100 px-4 py-2 rounded-full shadow-sm">
                            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                            <span className="text-indigo-700">{score} / {MAX_SCORE}</span>
                        </div>
                        {onComplete && (
                            <Button variant="outline" className="border-2 border-indigo-400 text-indigo-700 font-bold hover:bg-indigo-50 rounded-xl bg-white hidden md:flex" onClick={onComplete}>
                                Skip Game ➡️
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {gameState === 'menu' && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center bg-white border-4 border-indigo-400 rounded-[2rem] p-8 w-full shadow-lg"
                >
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-700 mb-2 font-display text-center">Piliin ang iyong karakter:</h3>
                    <p className="text-lg text-slate-500 mb-8 text-center">(Choose your character)</p>
                    
                    <div className="flex gap-6 mb-8 flex-wrap justify-center">
                        {CHARACTERS.map(c => (
                            <button
                                key={c}
                                onClick={() => startGame(c)}
                                className="text-7xl md:text-8xl p-6 bg-indigo-50 rounded-3xl border-4 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {gameState === 'playing' && (
                <div className="flex flex-col items-center w-full max-w-3xl">
                    
                    <div className="bg-white border-4 border-indigo-400 rounded-[2rem] p-6 md:p-8 w-full shadow-lg relative flex flex-col items-center">
                        
                        {/* Story Prompt */}
                        <div className="bg-indigo-50/50 p-4 md:p-6 rounded-3xl border-2 border-indigo-100 mb-8 w-full">
                            <p className="text-xl md:text-2xl font-medium text-slate-700 text-center leading-relaxed">
                                <span className="text-4xl align-middle mx-1">{character}</span> ay mayroong <strong className="text-indigo-600">{num1}</strong> {fruit} at nakakita ng <strong className="text-indigo-600">{num2}</strong> pa. Ilang prutas lahat ang nakita niya?
                            </p>
                        </div>
                        
                        {/* Visual Equation */}
                        <div className="flex items-center justify-center flex-wrap gap-4 text-4xl md:text-5xl mb-10 w-full drop-shadow-sm">
                            <div className="flex flex-wrap justify-center max-w-[200px] gap-1 bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100 min-h-[80px]">
                                {Array.from({ length: num1 }).map((_, i) => <motion.span key={`a-${i}`} initial={{scale:0}} animate={{scale:1}}>{fruit}</motion.span>)}
                            </div>
                            <span className="text-3xl font-bold text-indigo-400 mx-2">➕</span>
                            <div className="flex flex-wrap justify-center max-w-[200px] gap-1 bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100 min-h-[80px]">
                                {Array.from({ length: num2 }).map((_, i) => <motion.span key={`b-${i}`} initial={{scale:0}} animate={{scale:1}}>{fruit}</motion.span>)}
                            </div>
                        </div>

                        {/* Multiple Choice Options */}
                        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                            {options.map((opt, index) => (
                                <Button 
                                    key={index}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-3xl md:text-4xl h-20 rounded-2xl shadow-[0_4px_0_0_#4338ca] active:translate-y-1 active:shadow-none transition-all"
                                    onClick={() => checkAnswer(opt)}
                                    disabled={message.type !== ''}
                                >
                                    {opt}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Feedback Message */}
                    <div className="h-20 mt-6 flex items-center justify-center w-full">
                        <AnimatePresence mode="wait">
                            {message.text && (
                                <motion.div
                                    key="feedback"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-full font-bold text-xl md:text-2xl border-2 shadow-sm ${
                                        message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                                    }`}
                                >
                                    {message.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                                    {message.text}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {gameState === 'completed' && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-full flex-1 gap-6 text-center"
                >
                    <div className="text-8xl mb-4">{character}</div>
                    <h1 className="text-4xl md:text-5xl font-bold text-indigo-700 drop-shadow-sm">Adventure Complete!</h1>
                    <p className="text-xl md:text-2xl text-indigo-600 font-medium mb-4">You and {character} found all the fruits!</p>
                    
                    {onComplete ? (
                        <Button 
                            size="lg" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-2xl px-12 py-8 rounded-full shadow-[0_6px_0_0_#047857] active:translate-y-2 active:shadow-none transition-all"
                            onClick={onComplete}
                        >
                            Next Game <Play className="ml-2 w-8 h-8 fill-current" />
                        </Button>
                    ) : (
                        <Button 
                            size="lg" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xl px-12 py-6 rounded-full shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-none transition-all"
                            onClick={() => setGameState('menu')}
                        >
                            Play Again <Play className="ml-2 w-6 h-6 fill-current" />
                        </Button>
                    )}
                </motion.div>
            )}
        </div>
    );
}