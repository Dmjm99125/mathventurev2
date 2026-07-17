import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play } from 'lucide-react';

const SHAPES = ["⬛", "⭕", "🔺", "⭐", "🟩", "🔶"];

export function FindTheShape({ onComplete }: { onComplete?: () => void }) {
    const [targetShape, setTargetShape] = useState('');
    const [choices, setChoices] = useState<string[]>([]);
    const [message, setMessage] = useState('Tap the correct shape!');
    const [gameState, setGameState] = useState<'playing' | 'feedback'>('playing');
    const [score, setScore] = useState(0);

    const startRound = () => {
        const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        setTargetShape(target);
        setChoices([...SHAPES].sort(() => Math.random() - 0.5));
        setMessage('Tap the correct shape!');
        setGameState('playing');
    };
    //test
    useEffect(() => {
        startRound();
    }, []);

    const handleChoice = (shape: string) => {
        if (gameState === 'feedback') return;

        if (shape === targetShape) {
            setMessage('🎉 Correct!');
            setGameState('feedback');
            setScore(s => s + 1);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
            setMessage('❌ Try again!');
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-[#fce2b4] p-6 md:p-12 rounded-3xl shadow-xl flex flex-col items-center relative border-4 border-orange-200 shrink-0 h-fit">

            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex-wrap gap-4">
                <h2 className="text-2xl font-bold font-display text-orange-600 uppercase tracking-wide">Find the Shape</h2>
                <div className="flex gap-4 items-center">
                    <div className="text-xl font-bold text-gray-700">Score: <span className="text-orange-500">{score}</span></div>
                    {onComplete && (
                        <Button variant="outline" className="border-2 border-orange-300 text-orange-600 font-bold hover:bg-orange-100" onClick={onComplete}>
                            Next Game ➡️
                        </Button>
                    )}
                </div>
            </div>

            {/* Target Shape */}
            <Card className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center bg-white shadow-md border-4 border-white rounded-[3rem] mb-8 animate-in zoom-in duration-500">
                <span className="text-[100px] md:text-[140px] leading-none drop-shadow-md transition-transform hover:scale-110">{targetShape}</span>
            </Card>

            {/* Choices Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-2xl mb-8">
                {choices.map((shape, idx) => {
                    const isWinner = gameState === 'feedback' && shape === targetShape;

                    return (
                        <button
                            key={idx}
                            className={`h-32 md:h-40 bg-[#ffe0a3] hover:bg-[#ffd17a] border-4 border-[#ffcd66] rounded-3xl flex items-center justify-center text-7xl md:text-8xl shadow-[0_6px_0_0_#e6aa32] transition-all active:translate-y-2 active:shadow-none ${gameState === 'feedback' && !isWinner ? 'opacity-50 grayscale' : ''
                                } ${isWinner ? 'animate-bounce' : 'hover:-translate-y-2'}`}
                            onClick={() => handleChoice(shape)}
                            disabled={gameState === 'feedback'}
                        >
                            {shape}
                        </button>
                    );
                })}
            </div>

            {/* Message Area */}
            <div className="h-16 flex items-center justify-center mb-4">
                <p className={`text-3xl md:text-4xl font-bold transition-all duration-300 ${gameState === 'feedback' ? 'text-green-600 scale-110 drop-shadow-sm' : 'text-orange-800'}`}>
                    {message}
                </p>
            </div>

            {/* Next Round Button */}
            {gameState === 'feedback' && (
                <div className="mb-4 animate-in fade-in slide-in-from-bottom-8">
                    <Button
                        size="lg"
                        className="bg-[#86cb92] hover:bg-[#68a873] text-white font-bold text-2xl px-12 md:px-16 py-8 rounded-full shadow-[0_6px_0_0_#4e8257] active:translate-y-2 active:shadow-none transition-all hover:scale-105"
                        onClick={startRound}
                    >
                        Next Shape <Play className="ml-3 h-8 w-8 fill-current" />
                    </Button>
                </div>
            )}
        </div>
    );
}
