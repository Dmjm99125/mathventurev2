import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const playSound = (type: 'eat' | 'crash' | 'levelup') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;

  if (type === 'eat') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'crash') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.3);
  } else if (type === 'levelup') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554.37, now + 0.1);
    osc.frequency.setValueAtTime(659.25, now + 0.2);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.4);
  }
};

interface SnakeGameProps {
  onComplete?: () => void;
}

export function SnakeGame({ onComplete }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(1);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Game state refs (we use refs instead of state to avoid react re-render loops in canvas tick)
  const snakeRef = useRef([{ x: 7, y: 7 }]);
  const foodRef = useRef({ x: 3, y: 3 });
  const dirRef = useRef({ x: 1, y: 0 });
  const speedRef = useRef(400);
  const gameLoopRef = useRef<number | null>(null);
  
  const gridSize = 20;
  const tileCount = 15; // 300 / 20

  const placeFood = useCallback(() => {
    let valid = false;
    let newFood = { x: 0, y: 0 };
    while (!valid) {
      newFood.x = Math.floor(Math.random() * tileCount);
      newFood.y = Math.floor(Math.random() * tileCount);
      valid = true;
      for (const part of snakeRef.current) {
        if (part.x === newFood.x && part.y === newFood.y) valid = false;
      }
    }
    foodRef.current = newFood;
  }, []);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#a5d6a7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food
    ctx.fillStyle = '#ff5252';
    ctx.beginPath();
    ctx.arc(foodRef.current.x * gridSize + gridSize/2, foodRef.current.y * gridSize + gridSize/2, gridSize/2.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw snake
    const snake = snakeRef.current;
    for (let i = 0; i < snake.length; i++) {
      ctx.fillStyle = i === 0 ? '#1b5e20' : '#4caf50';
      ctx.beginPath();
      ctx.roundRect(snake[i].x * gridSize + 1, snake[i].y * gridSize + 1, gridSize - 2, gridSize - 2, 5);
      ctx.fill();
    }
  }, []);

  const resetGame = useCallback(() => {
    snakeRef.current = [{ x: 7, y: 7 }];
    dirRef.current = { x: 1, y: 0 };
    speedRef.current = 400;
    setScore(1);
    setSpeedLevel(1);
    setIsGameOver(false);
    placeFood();
    
    if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    
    const tick = () => {
      const snake = [...snakeRef.current];
      const head = { x: snake[0].x + dirRef.current.x, y: snake[0].y + dirRef.current.y };

      // Collision checks
      let collided = false;
      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        collided = true;
      }
      for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) collided = true;
      }

      if (collided) {
        setIsGameOver(true);
        playSound('crash');
        return;
      }

      snake.unshift(head);

      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        playSound('eat');
        placeFood();
        setScore(s => {
          const newScore = s + 1;
          if (newScore % 5 === 0) {
            playSound('levelup');
            setSpeedLevel(Math.floor(newScore / 5) + 1);
            speedRef.current = Math.max(150, speedRef.current - 50);
          }
          return newScore;
        });
      } else {
        snake.pop();
      }

      snakeRef.current = snake;
      drawGame();

      gameLoopRef.current = window.setTimeout(tick, speedRef.current);
    };

    tick();
  }, [drawGame, placeFood]);

  useEffect(() => {
    resetGame();
    return () => {
      if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    };
  }, [resetGame]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { x: dx, y: dy } = dirRef.current;
    switch(e.key) {
      case 'ArrowUp': if (dy !== 1) dirRef.current = { x: 0, y: -1 }; break;
      case 'ArrowDown': if (dy !== -1) dirRef.current = { x: 0, y: 1 }; break;
      case 'ArrowLeft': if (dx !== 1) dirRef.current = { x: -1, y: 0 }; break;
      case 'ArrowRight': if (dx !== -1) dirRef.current = { x: 1, y: 0 }; break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const setDirection = (nx: number, ny: number) => {
    const { x: dx, y: dy } = dirRef.current;
    if (nx === -dx && dx !== 0) return;
    if (ny === -dy && dy !== 0) return;
    dirRef.current = { x: nx, y: ny };
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-[#e8f5e9] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display select-none touch-none">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#1b5e20] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-lg mt-auto mb-auto flex flex-col items-center">
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#2e7d32] mb-4 drop-shadow-sm text-center">🐛 Growing Inchworm! 🐛</h1>
        
        <div className="w-full flex justify-between px-8 mb-4 text-xl font-bold text-[#1b5e20]">
          <div>Length: <span className="text-[#388e3c]">{score}</span> unit</div>
          <div>Speed: Level <span className="text-[#388e3c]">{speedLevel}</span></div>
        </div>

        {/* Game Canvas */}
        <div className="relative p-3 bg-white rounded-2xl shadow-[0_5px_15px_rgba(0,0,0,0.2)] mb-6">
          <canvas 
            ref={canvasRef} 
            width={300} 
            height={300} 
            className="bg-[#a5d6a7] border-4 border-[#4caf50] rounded-xl"
          />

          <AnimatePresence>
            {isGameOver && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/70 rounded-2xl flex flex-col items-center justify-center text-white z-10 backdrop-blur-[2px]"
              >
                <div className="text-3xl font-bold mb-2 text-[#ff5252]">Oh no! Bumped!</div>
                <div className="text-lg mb-6">Your worm grew to <span className="text-[#ffeb3b] font-black text-2xl">{score}</span> units!</div>
                
                <Button size="lg" onClick={resetGame} className="bg-[#ffeb3b] hover:bg-[#fbc02d] text-[#333] text-xl font-bold h-14 px-8 rounded-full shadow-[0_4px_0_#f57f17] hover:shadow-[0_2px_0_#f57f17] hover:translate-y-1 transition-all">
                  Play Again! 🔄
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* D-Pad for Mobile */}
        <div className="grid grid-cols-3 grid-rows-2 gap-3 mb-4">
          <Button 
            className="col-start-2 row-start-1 h-16 w-16 rounded-2xl bg-[#4caf50] hover:bg-[#43a047] text-white shadow-[0_6px_0_#2e7d32] active:shadow-[0_2px_0_#2e7d32] active:translate-y-1 p-0"
            onPointerDown={() => setDirection(0, -1)}
          >
            <ArrowUp className="w-10 h-10" strokeWidth={3} />
          </Button>
          <Button 
            className="col-start-1 row-start-2 h-16 w-16 rounded-2xl bg-[#4caf50] hover:bg-[#43a047] text-white shadow-[0_6px_0_#2e7d32] active:shadow-[0_2px_0_#2e7d32] active:translate-y-1 p-0"
            onPointerDown={() => setDirection(-1, 0)}
          >
            <ArrowLeft className="w-10 h-10" strokeWidth={3} />
          </Button>
          <Button 
            className="col-start-2 row-start-2 h-16 w-16 rounded-2xl bg-[#4caf50] hover:bg-[#43a047] text-white shadow-[0_6px_0_#2e7d32] active:shadow-[0_2px_0_#2e7d32] active:translate-y-1 p-0"
            onPointerDown={() => setDirection(0, 1)}
          >
            <ArrowDown className="w-10 h-10" strokeWidth={3} />
          </Button>
          <Button 
            className="col-start-3 row-start-2 h-16 w-16 rounded-2xl bg-[#4caf50] hover:bg-[#43a047] text-white shadow-[0_6px_0_#2e7d32] active:shadow-[0_2px_0_#2e7d32] active:translate-y-1 p-0"
            onPointerDown={() => setDirection(1, 0)}
          >
            <ArrowRight className="w-10 h-10" strokeWidth={3} />
          </Button>
        </div>

      </div>
    </div>
  );
}