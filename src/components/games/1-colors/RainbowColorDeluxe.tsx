import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

const DIFFICULTY_COLORS = {
  easy: ["#ef4444", "#3b82f6", "#22c55e", "#eab308"],
  medium: ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316"],
  hard: ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#ec4899", "#8b4513"]
};

const COLOR_NAMES: Record<string, string> = {
  "#ef4444": "RED",
  "#3b82f6": "BLUE",
  "#22c55e": "GREEN",
  "#eab308": "YELLOW",
  "#a855f7": "PURPLE",
  "#f97316": "ORANGE",
  "#ec4899": "PINK",
  "#8b4513": "BROWN"
};

const TIME_CONFIG = { easy: 45, medium: 30, hard: 20 };

interface RainbowColorDeluxeProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

export function RainbowColorDeluxe({ onComplete, allowSkip = true }: RainbowColorDeluxeProps) {
  const [screen, setScreen] = useState<'pet' | 'difficulty' | 'game'>('pet');
  const [pet, setPet] = useState("");
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  
  const [targetColor, setTargetColor] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stars, setStars] = useState<{ id: string, x: number, y: number }[]>([]);
  const attemptsRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("rainbowHighScoreDeluxe");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = (level: 'easy' | 'medium' | 'hard') => {
    setDifficulty(level);
    setScore(0);
    setTimeLeft(TIME_CONFIG[level]);
    setIsGameOver(false);
    setIsCompleted(false);
    setMessage("");
    attemptsRef.current = 0;
    generateBoard(level);
    setScreen('game');
  };

  const generateBoard = useCallback((level: 'easy' | 'medium' | 'hard') => {
    const colors = DIFFICULTY_COLORS[level];
    const shuffled = [...colors].sort(() => Math.random() - 0.5);
    setOptions(shuffled);
    setTargetColor(colors[Math.floor(Math.random() * colors.length)]);
  }, []);

  useEffect(() => {
    if (screen !== 'game' || isGameOver) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, isGameOver]);

  const handleColorClick = (color: string, e: React.MouseEvent) => {
    if (screen !== 'game' || isGameOver || isCompleted) return;

    attemptsRef.current += 1;

    if (color === targetColor) {
      const newScore = score + 1;
      setScore(newScore);
      setMessage("✨ Correct! ✨");
      setMessageColor("text-green-600");
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const newStar = {
        id: Math.random().toString(36).substring(7),
        x: rect.left + rect.width / 2 - 20,
        y: rect.top + rect.height / 2 - 20
      };
      setStars(prev => [...prev, newStar]);
      setTimeout(() => {
        setStars(prev => prev.filter(s => s.id !== newStar.id));
      }, 600);
      
      generateBoard(difficulty);

      if (allowSkip === false && newScore >= 10) {
        setIsCompleted(true);
        setIsGameOver(true);
      }
    } else {
      setMessage("❌ Try Again!");
      setMessageColor("text-red-500");
    }
  };

  const correctItems = score;
  const totalItems = Math.max(1, attemptsRef.current);

  useEffect(() => {
    if (isGameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem("rainbowHighScoreDeluxe", score.toString());
    }
  }, [isGameOver, score, highScore]);

  return (
    <div className="w-full max-w-4xl mx-auto min-h-[700px] flex flex-col relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-gradient-to-b from-[#87CEEB] via-[#E0F7FF] to-[#FFF9D6]">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatCloud {
          from { left: -200px; }
          to { left: 110%; }
        }
        @keyframes starFly {
          0% { opacity: 1; transform: scale(1) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.5) rotate(180deg); }
          100% { opacity: 0; transform: scale(0.3) rotate(360deg); }
        }
        .rcd-cloud {
          position: absolute;
          font-size: 70px;
          opacity: 0.8;
          pointer-events: none;
          animation: floatCloud 40s linear infinite;
        }
        .rcd-cloud::before { content: "☁️"; }
        .rcd-cloud.c2 { top: 120px; animation-duration: 55s; }
        .rcd-cloud.c3 { top: 220px; animation-duration: 70s; }
        .rcd-star {
          position: fixed;
          font-size: 40px;
          z-index: 100;
          pointer-events: none;
          animation: starFly 0.6s ease-in-out forwards;
        }
      `}} />

      <div className="rcd-cloud" style={{ top: '20px' }}></div>
      <div className="rcd-cloud c2"></div>
      <div className="rcd-cloud c3"></div>

      {onComplete && allowSkip !== false && (
        <Button 
          variant="default" 
          className="absolute top-4 right-4 hidden md:flex bg-orange-500 hover:bg-orange-600 font-bold rounded-xl shadow-[0_4px_0_0_#e68a00] text-white px-4 py-2 z-50"
          onClick={() => onComplete()}
        >
          Next Game ➡️
        </Button>
      )}

      <div className="relative z-10 w-full flex-1 flex flex-col items-center px-4 py-6 md:pt-8">
        {onComplete && allowSkip !== false && (
          <Button
            variant="default"
            className="mb-4 w-full max-w-sm justify-center bg-orange-500 hover:bg-orange-600 font-bold rounded-xl shadow-[0_4px_0_0_#e68a00] text-white px-4 py-2 z-50 md:hidden"
            onClick={() => onComplete()}
          >
            Next Game ➡️
          </Button>
        )}
        
        {screen === 'pet' && (
          <div className="mt-6 flex w-full max-w-lg flex-col items-center rounded-3xl bg-white/60 p-6 text-center shadow-lg backdrop-blur-sm animate-in fade-in zoom-in md:mt-12 md:p-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-800 mb-8">Choose Your Pet Friend</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full justify-items-center">
              {['🐶', '🐱', '🦄', '🐼', '🐯'].map(p => (
                <button
                  key={p}
                  className="text-6xl p-4 bg-white rounded-3xl shadow-md hover:scale-110 hover:bg-gray-50 transition-all border-4 border-transparent hover:border-orange-300"
                  onClick={() => { setPet(p); setScreen('difficulty'); }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 'difficulty' && (
          <div className="mt-6 flex w-full max-w-lg flex-col items-center rounded-3xl bg-white/60 p-6 text-center shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-right md:mt-12 md:p-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-800 mb-8">Choose Difficulty</h1>
            <div className="flex flex-col gap-4 w-full">
              <button className="text-xl md:text-2xl font-bold py-4 px-6 bg-white rounded-2xl shadow-md hover:scale-105 hover:bg-green-50 transition-all text-green-600 border-2 border-green-200" onClick={() => startGame('easy')}>
                🌟 Preschool Mode
              </button>
              <button className="text-xl md:text-2xl font-bold py-4 px-6 bg-white rounded-2xl shadow-md hover:scale-105 hover:bg-blue-50 transition-all text-blue-600 border-2 border-blue-200" onClick={() => startGame('medium')}>
                🌈 Elementary Mode
              </button>
              <button className="text-xl md:text-2xl font-bold py-4 px-6 bg-white rounded-2xl shadow-md hover:scale-105 hover:bg-purple-50 transition-all text-purple-600 border-2 border-purple-200" onClick={() => startGame('hard')}>
                🚀 Adventure Mode
              </button>
            </div>
            <button className="mt-8 text-gray-500 font-bold hover:text-gray-700" onClick={() => setScreen('pet')}>
              ← Back
            </button>
          </div>
        )}

        {screen === 'game' && (
          <div className="w-full max-w-2xl flex flex-col items-center animate-in fade-in">
            {allowSkip !== false && (
              <div className="mb-4 flex w-full justify-start">
                <Button
                  variant="outline"
                  className="rounded-xl bg-white/90 font-bold text-gray-700"
                  onClick={() => setScreen('difficulty')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              </div>
            )}
            {/* Top Bar */}
            <div className="mb-4 grid w-full grid-cols-1 gap-3 text-lg font-bold text-gray-700 sm:grid-cols-3 sm:text-xl">
              <div className="rounded-2xl bg-white/90 px-4 py-3 text-center shadow-sm sm:px-6 sm:py-2">Score: <span className="text-orange-500">{score}</span></div>
              <div className="rounded-2xl bg-white/90 px-4 py-3 text-center shadow-sm sm:px-6 sm:py-2">Best: <span className="text-blue-500">{highScore}</span></div>
              <div className="rounded-2xl bg-white/90 px-4 py-3 text-center shadow-sm sm:px-6 sm:py-2">Time: <span className="text-red-500">{timeLeft}</span></div>
            </div>

            <div className="transition-all duration-300 ease-out leading-none" style={{ fontSize: `${Math.min(150, 80 + score * 2)}px` }}>
              {pet}
            </div>

            <div className="my-4 w-full rounded-2xl bg-white/70 px-5 py-4 text-center text-2xl font-bold shadow-sm sm:px-8 md:text-4xl">
              <span className="block sm:inline">Find:</span>{" "}
              <span className="break-words" style={{ color: targetColor }}>{COLOR_NAMES[targetColor]}</span>
            </div>
            
            <div className={`min-h-10 text-center text-xl font-bold sm:text-2xl ${messageColor}`}>{message}</div>

            <div className="mt-6 grid w-full max-w-[420px] grid-cols-2 gap-4 sm:max-w-[460px]">
              {options.map((color, i) => (
                <button
                  key={i}
                  className="aspect-square w-full rounded-3xl border-8 border-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: color }}
                  onClick={(e) => handleColorClick(color, e)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Game Over Modal */}
      {isGameOver && !isCompleted && (
        <div className="absolute inset-0 bg-black/50 z-50 flex justify-center items-center backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 md:p-12 rounded-3xl text-center max-w-sm w-[90%] shadow-2xl zoom-in animate-in duration-300">
            <h2 className="text-4xl font-display font-bold text-gray-800 mb-4">Time's Up!</h2>
            <p className="text-2xl font-bold text-gray-600 mb-8">Final Score: <span className="text-orange-500 text-3xl">{score}</span></p>
            
            <div className="flex flex-col gap-3">
              <Button size="lg" variant="jungle" className="text-xl py-6 rounded-2xl" onClick={() => startGame(difficulty)}>
                Play Again
              </Button>
              <Button size="lg" variant="outline" className="text-xl py-6 rounded-2xl border-2 hover:bg-gray-50" onClick={() => setScreen('pet')}>
                Menu
              </Button>
              {onComplete && allowSkip === false && (
                <Button size="lg" variant="default" className="text-xl py-6 rounded-2xl bg-orange-500 hover:bg-orange-600 shadow-md text-white mt-4" onClick={() => onComplete(correctItems, totalItems)}>
                  Continue
                </Button>
              )}
              {onComplete && allowSkip !== false && (
                <Button size="lg" variant="default" className="text-xl py-6 rounded-2xl bg-orange-500 hover:bg-orange-600 shadow-md text-white mt-4" onClick={() => onComplete()}>
                  Next Game ➡️
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="absolute inset-0 bg-white/95 z-50 flex justify-center items-center backdrop-blur-sm animate-in fade-in">
          <div className="p-8 md:p-12 rounded-3xl text-center max-w-sm w-[90%] shadow-2xl">
            <h2 className="text-4xl font-display font-bold text-green-600 mb-4">Great job!</h2>
            <p className="text-2xl font-bold text-gray-600 mb-8">You found 10 colors!</p>
            {onComplete && (
              <Button size="lg" variant="default" className="text-xl py-6 rounded-2xl bg-orange-500 hover:bg-orange-600 shadow-md text-white" onClick={() => onComplete(correctItems, totalItems)}>
                Continue
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Flying Stars */}
      {stars.map(s => (
        <div key={s.id} className="rcd-star" style={{ left: s.x, top: s.y }}>⭐</div>
      ))}

    </div>
  );
}
