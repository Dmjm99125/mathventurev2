import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';

const COLORS = [
  { name: "RED", value: "#ef4444" },
  { name: "BLUE", value: "#3b82f6" },
  { name: "GREEN", value: "#22c55e" },
  { name: "YELLOW", value: "#eab308" },
  { name: "PURPLE", value: "#a855f7" },
  { name: "ORANGE", value: "#f97316" },
  { name: "PINK", value: "#ec4899" },
  { name: "BROWN", value: "#8b4513" }
];

const WALKERS_POOL = ["🦄","🐶","🐱","🐰","🐼","🦊","🐸","🐵","🦁","🐯","🎈","🚂","🐧","🐨"];

interface Walker {
  id: string;
  char: string;
  bottom: number;
}

interface RainbowColorCatcherProps {
  onComplete?: () => void;
}

export function RainbowColorCatcher({ onComplete }: RainbowColorCatcherProps) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameRunning, setGameRunning] = useState(true);
  const [answer, setAnswer] = useState(COLORS[0]);
  const [options, setOptions] = useState<typeof COLORS>([]);
  const [message, setMessage] = useState("");
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [collectedAnimals, setCollectedAnimals] = useState<string[]>([]);
  const [showRainbow, setShowRainbow] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("colorHighScore");
    if (saved) setHighScore(parseInt(saved, 10));
    newRound();
  }, []);

  const newRound = useCallback(() => {
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
    const roundOptions = shuffled.slice(0, 4);
    setOptions(roundOptions);
    setAnswer(roundOptions[Math.floor(Math.random() * 4)]);
  }, []);

  // Timer effect
  useEffect(() => {
    if (!gameRunning) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameRunning]);

  // Background walkers spawner
  useEffect(() => {
    if (!gameRunning) return;
    const interval = setInterval(() => {
      const char = WALKERS_POOL[Math.floor(Math.random() * WALKERS_POOL.length)];
      const newWalker: Walker = {
        id: Math.random().toString(36).substring(2, 9),
        char,
        bottom: Math.random() * 120
      };
      setWalkers(prev => [...prev, newWalker]);
      
      // Auto remove after animation completes (12s)
      setTimeout(() => {
        setWalkers(prev => prev.filter(w => w.id !== newWalker.id));
      }, 12000);
    }, 4000);
    return () => clearInterval(interval);
  }, [gameRunning]);

  const checkAnswer = (color: typeof COLORS[0]) => {
    if (!gameRunning) return;

    if (color.name === answer.name) {
      const newScore = score + 1;
      setScore(newScore);
      setMessage("✅ Great Job!");
      
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem("colorHighScore", newScore.toString());
      }
      
      if (newScore % 5 === 0) {
        setCollectedAnimals(prev => [...prev, WALKERS_POOL[Math.floor(Math.random() * WALKERS_POOL.length)]]);
      }
      
      if (newScore % 10 === 0) {
        setShowRainbow(false);
        setTimeout(() => setShowRainbow(true), 50);
      }
      
      setTimeout(newRound, 400);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setMessage("❌ Oops!");
      
      if (newLives <= 0) {
        setGameRunning(false);
      } else {
        setTimeout(newRound, 400);
      }
    }
  };

  const restartGame = () => {
    setScore(0);
    setLives(3);
    setTimeLeft(30);
    setGameRunning(true);
    setCollectedAnimals([]);
    setMessage("");
    newRound();
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[600px] flex flex-col relative rounded-3xl overflow-hidden shadow-xl border-4 border-white" style={{ background: 'linear-gradient(#dff6ff, #fffde8)' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes walk {
            from { left: -100px; }
            to { left: 110%; }
        }
        @keyframes rainbowMove {
            0% { left: -100%; opacity: 0; }
            30% { opacity: 1; }
            100% { left: 100%; opacity: 0; }
        }
        .rcc-walker {
            position: absolute;
            font-size: 60px;
            animation: walk 12s linear forwards;
            pointer-events: none;
        }
        .rcc-rainbow {
            position: absolute;
            top: 20%;
            left: -100%;
            width: 100%;
            font-size: 120px;
            pointer-events: none;
            opacity: 0;
            white-space: nowrap;
        }
        .rcc-rainbow.show {
            animation: rainbowMove 3s ease;
        }
      `}} />

      {/* Top Bar */}
      <div className="relative w-full flex flex-wrap justify-center items-center gap-4 p-4 text-lg md:text-xl font-bold text-gray-700 bg-white/50 backdrop-blur-sm z-20 shrink-0">
        <div>⭐ Score: {score}</div>
        <div>🏆 High Score: {highScore}</div>
        <div>⏱️ {timeLeft}</div>
        <div>{'❤️'.repeat(lives)}</div>
        
        {onComplete && (
          <Button 
            variant="default" 
            className="absolute top-3 right-4 bg-orange-500 hover:bg-orange-600 font-bold rounded-xl shadow-[0_4px_0_0_#e68a00] text-white px-4 py-2 z-20 hidden sm:flex"
            onClick={onComplete}
          >
            Next Game ➡️
          </Button>
        )}
      </div>
      
      {/* Mobile Next button */}
      {onComplete && (
        <Button 
          variant="default" 
          className="bg-orange-500 hover:bg-orange-600 font-bold rounded-xl shadow-[0_4px_0_0_#e68a00] text-white px-4 py-2 z-20 sm:hidden mx-auto mt-2"
          onClick={onComplete}
        >
          Next Game ➡️
        </Button>
      )}

      {/* Game Header & Target */}
      <div className="text-center mt-6 z-10 px-4">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-800 mb-4 drop-shadow-md">🌈 Rainbow Color Catcher</h1>
        
        {gameRunning ? (
          <div className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-sm">
            Find: <span style={{ color: answer.value }}>{answer.name}</span>
          </div>
        ) : (
          <div className="text-3xl md:text-4xl font-bold mb-4 flex flex-col items-center bg-white/80 p-6 rounded-2xl drop-shadow-lg mx-auto max-w-sm">
            🎉 Game Over!<br/>
            <span className="text-2xl mt-2 text-gray-600">Final Score: {score}</span>
            <Button size="lg" variant="jungle" className="mt-4 rounded-full px-8 text-xl" onClick={restartGame}>Play Again</Button>
          </div>
        )}
        
        <div className="h-10 text-2xl font-bold drop-shadow-sm">{message}</div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex justify-center items-center z-10 px-4 pb-20">
        {gameRunning && (
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs md:max-w-sm">
            {options.map((opt, i) => (
              <button
                key={i}
                className="h-28 md:h-32 rounded-3xl cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-[0_6px_0_0_rgba(0,0,0,0.15)] border-4 border-white/50"
                style={{ backgroundColor: opt.value }}
                onClick={() => checkAnswer(opt)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Collected Animals */}
      <div className="absolute bottom-[100px] left-0 w-full text-center text-5xl min-h-[60px] z-10 pointer-events-none px-4 drop-shadow-lg">
        {collectedAnimals.join('')}
      </div>

      {/* Walkers */}
      {walkers.map(w => (
        <div key={w.id} className="rcc-walker drop-shadow-xl" style={{ bottom: `${w.bottom}px` }}>
          {w.char}
        </div>
      ))}

      {/* Rainbow */}
      <div className={`rcc-rainbow ${showRainbow ? 'show' : ''} z-30 drop-shadow-2xl`}>
        🌈🌈🌈🌈🌈🌈🌈🌈
      </div>

    </div>
  );
}
