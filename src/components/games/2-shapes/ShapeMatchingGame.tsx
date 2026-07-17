import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';

const SHAPES = [
    { name: 'CIRCLE/BILOG', color: '#f94144', symbol: '●' },
    { name: 'SQUARE/PARISUKAT', color: '#228B22', symbol: '■' },
    { name: 'TRIANGLE/TATSULOK', color: '#2196F3', symbol: '▲' },
    { name: 'STAR/BITUIN', color: '#FFD700', symbol: '★' },
    { name: 'HEART/HUGIS-PUSO', color: '#FF69B4', symbol: '♥' }
];

const ICONS = ['☀️', '🎈', '🐱', '⭐', '🌈', '🍦', '🐶', '🐝'];

interface Character {
    id: number;
    icon: string;
    x: number;
    y: number;
    dx: number;
    dy: number;
}

export function ShapeMatchingGame({ onComplete }: { onComplete?: () => void }) {
    const [score, setScore] = useState(0);
    const [targetShape, setTargetShape] = useState(SHAPES[0]);
    const [options, setOptions] = useState<typeof SHAPES>([]);
    const [characters, setCharacters] = useState<Character[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const charRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const physicsChars = useRef<Character[]>([]);
    const requestRef = useRef<number>();
    const audioCtxRef = useRef<AudioContext | null>(null);

    const playBeep = (isCorrect: boolean) => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isCorrect ? 800 : 200, ctx.currentTime);
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.log('Audio disabled');
        }
    };

    const generateRound = () => {
        const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        setTargetShape(target);

        const others = SHAPES.filter(s => s.name !== target.name).sort(() => 0.5 - Math.random());
        const newOptions = [target, others[0], others[1], others[2]].sort(() => 0.5 - Math.random());
        setOptions(newOptions);
    };

    useEffect(() => {
        generateRound();
    }, []);

    useEffect(() => {
        const updatePhysics = () => {
            if (!containerRef.current) {
                requestRef.current = requestAnimationFrame(updatePhysics);
                return;
            }
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;

            physicsChars.current.forEach(c => {
                c.x += c.dx;
                c.y += c.dy;
                if (c.x < 0 || c.x > w - 60) { c.dx *= -1; c.x = c.x < 0 ? 0 : w - 60; }
                if (c.y < 0 || c.y > h - 60) { c.dy *= -1; c.y = c.y < 0 ? 0 : h - 60; }

                const node = charRefs.current[c.id];
                if (node) {
                    node.style.transform = `translate(${c.x}px, ${c.y}px)`;
                }
            });
            requestRef.current = requestAnimationFrame(updatePhysics);
        };
        requestRef.current = requestAnimationFrame(updatePhysics);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const addCharacter = () => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;

        // Start somewhere random, but not on the edges
        const newChar: Character = {
            id: Date.now() + Math.random(),
            icon: ICONS[Math.floor(Math.random() * ICONS.length)],
            x: Math.random() * (w - 100) + 20,
            y: Math.random() * (h - 200) + 100, // keep away from top header initially
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6
        };
        physicsChars.current.push(newChar);
        setCharacters([...physicsChars.current]);
    };

    const handleChoice = (shape: typeof SHAPES[0], e: React.MouseEvent<HTMLButtonElement>) => {
        if (score >= 10) return;

        if (shape.name === targetShape.name) {
            playBeep(true);
            setScore(s => s + 1);
            addCharacter();

            if (score + 1 >= 10) {
                confetti({ particleCount: 150, spread: 80, zIndex: 9999 });
            } else {
                generateRound();
            }
        } else {
            playBeep(false);
            const target = e.currentTarget;
            target.style.opacity = '0.3';
            setTimeout(() => { target.style.opacity = '1'; }, 500);
        }
    };

    return (
        <div ref={containerRef} className="w-full max-w-4xl mx-auto bg-[#fffae3] rounded-3xl shadow-xl overflow-hidden min-h-[600px] flex flex-col relative border-4 border-yellow-200 shrink-0">

            {/* HUD & Header */}
            <div className="bg-white p-4 md:p-6 shadow-sm flex flex-col items-center z-20 relative w-full border-b-2 border-gray-100">
                {onComplete && score < 10 && (
                    <Button
                        variant="outline"
                        className="absolute right-4 top-4 md:right-6 md:top-6 border-2 border-orange-200 text-orange-600 font-bold hover:bg-orange-50 hidden sm:flex"
                        onClick={onComplete}
                    >
                        Next Game ➡️
                    </Button>
                )}
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-2 font-display uppercase tracking-widest text-center">Shape Matching</h1>

                <div
                    className="text-4xl md:text-6xl font-extrabold my-2 text-center drop-shadow-sm transition-colors duration-300 tracking-wider"
                    style={{ color: targetShape?.color, textShadow: '2px 2px #ddd' }}
                >
                    {targetShape?.name}
                </div>

                <div className="text-2xl md:text-3xl font-bold text-orange-500 mt-2 flex items-center gap-2">
                    Stars: {score} / 10 <Star className="fill-orange-500 text-orange-500 h-8 w-8" />
                </div>

                {/* Mobile Next Game */}
                {onComplete && score < 10 && (
                    <Button
                        variant="outline"
                        className="mt-4 border-2 border-orange-200 text-orange-600 font-bold hover:bg-orange-50 flex sm:hidden"
                        onClick={onComplete}
                    >
                        Next Game ➡️
                    </Button>
                )}
            </div>

            {/* Play Area */}
            <div className="flex-1 p-6 md:p-12 flex items-center justify-center relative z-20">
                <div className="flex flex-wrap justify-center gap-6 md:gap-10 max-w-2xl w-full">
                    {options.map((opt, i) => (
                        <button
                            key={i}
                            className="w-32 h-32 md:w-44 md:h-44 rounded-[2rem] text-7xl md:text-[7rem] flex items-center justify-center text-white shadow-[0_8px_0_0_rgba(0,0,0,0.2)] transition-all hover:-translate-y-2 hover:shadow-[0_12px_0_0_rgba(0,0,0,0.2)] active:translate-y-2 active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)]"
                            style={{ backgroundColor: opt.color }}
                            onClick={(e) => handleChoice(opt, e)}
                        >
                            {opt.symbol}
                        </button>
                    ))}
                </div>
            </div>

            {/* Floating Characters */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                {characters.map(c => (
                    <div
                        key={c.id}
                        ref={el => { charRefs.current[c.id] = el; }}
                        className="absolute text-5xl md:text-6xl will-change-transform"
                        style={{ left: 0, top: 0, transform: `translate(${c.x}px, ${c.y}px)` }}
                    >
                        {c.icon}
                    </div>
                ))}
            </div>

            {/* Congratulations Overlay */}
            {score >= 10 && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
                    <div className="text-9xl mb-6 animate-[bounce_1s_ease-in-out_infinite_alternate]">⭐</div>
                    <h1 className="text-5xl md:text-7xl font-display font-extrabold text-[#ff4500] mb-4 drop-shadow-sm">
                        GREAT JOB!
                    </h1>
                    <p className="text-3xl font-bold text-gray-700 mb-12">You know your shapes!</p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white font-bold text-xl md:text-2xl rounded-full px-12 py-8 shadow-[0_6px_0_0_#2e7d32]" onClick={() => {
                            setScore(0);
                            physicsChars.current = [];
                            setCharacters([]);
                            generateRound();
                        }}>
                            Play Again
                        </Button>
                        {onComplete && (
                            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl md:text-2xl rounded-full px-12 py-8 shadow-[0_6px_0_0_#e68a00] animate-[pulse_2s_ease-in-out_infinite]" onClick={onComplete}>
                                Next Game ➡️
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
