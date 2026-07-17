import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';

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
  onComplete?: () => void;
}

export function RainbowColorDeluxe({ onComplete }: RainbowColorDeluxeProps) {
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
  const [stars, setStars] = useState<{ id: string, x: number, y: number }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("rainbowHighScoreDeluxe");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = (level: 'easy' | 'medium' | 'hard') => {
    setDifficulty(level);
    setScore(0);
    setTimeLeft(TIME_CONFIG[level]);
    setIsGameOver(false);
    setMessage("");
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
    if (isGameOver) return;

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
    } else {
      setMessage("❌ Try Again!");
      setMessageColor("text-red-500");
    }
  };

  useEffect(() => {
    if (isGameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem("rainbowHighScoreDeluxe", score.toString());
    }
  }, [isGameOver, score, highScore]);

  return (
    <div className="w-full max-w-4xl mx-auto h-[700px] flex flex-col relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-gradient-to-b from-[#87CEEB] via-[#E0F7FF] to-[#FFF9D6]">
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

      {onComplete && (
        <Button 
          variant="default" 
          className="absolute top-16 right-4 md:top-4 md:right-4 bg-orange-500 hover:bg-orange-600 font-bold rounded-xl shadow-[0_4px_0_0_#e68a00] text-white px-4 py-2 z-50"
          onClick={onComplete}
        >
          Next Game ➡️
        </Button>
      )}

      <div className="relative z-10 w-full h-full flex flex-col items-center pt-8 px-4">
        
        {screen === 'pet' && (
          <div className="flex flex-col items-center w-full max-w-lg mt-12 bg-white/60 p-8 rounded-3xl backdrop-blur-sm shadow-lg text-center animate-in fade-in zoom-in">
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
          <div className="flex flex-col items-center w-full max-w-lg mt-12 bg-white/60 p-8 rounded-3xl backdrop-blur-sm shadow-lg text-center animate-in fade-in slide-in-from-right">
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
            {/* Top Bar */}
            <div className="flex flex-wrap justify-center gap-4 text-xl font-bold text-gray-700 mb-4">
              <div className="bg-white/90 px-6 py-2 rounded-2xl shadow-sm">Score: <span className="text-orange-500">{score}</span></div>
              <div className="bg-white/90 px-6 py-2 rounded-2xl shadow-sm">Best: <span className="text-blue-500">{highScore}</span></div>
              <div className="bg-white/90 px-6 py-2 rounded-2xl shadow-sm">Time: <span className="text-red-500">{timeLeft}</span></div>
            </div>

            <div className="transition-all duration-300 ease-out" style={{ fontSize: `${Math.min(150, 80 + score * 2)}px` }}>
              {pet}
            </div>

            <div className="text-3xl md:text-4xl font-bold my-4 bg-white/70 px-8 py-3 rounded-2xl shadow-sm">
              Find: <span style={{ color: targetColor }}>{COLOR_NAMES[targetColor]}</span>
            </div>
            
            <div className={`h-10 text-2xl font-bold ${messageColor}`}>{message}</div>

            <div className="flex flex-wrap justify-center gap-4 mt-6 max-w-[400px]">
              {options.map((color, i) => (
                <button
                  key={i}
                  className="w-[120px] h-[120px] md:w-[150px] md:h-[150px] rounded-3xl cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-lg border-8 border-white"
                  style={{ backgroundColor: color }}
                  onClick={(e) => handleColorClick(color, e)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
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
              {onComplete && (
                <Button size="lg" variant="default" className="text-xl py-6 rounded-2xl bg-orange-500 hover:bg-orange-600 shadow-md text-white mt-4" onClick={onComplete}>
                  Next Game ➡️
                </Button>
              )}
            </div>
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
