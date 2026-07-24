import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, ChevronRight } from 'lucide-react';

const playSlowFunSound = (type: 'pop' | 'success' | 'error' | 'fanfare') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;

  if (type === 'pop') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'success') {
    [0, 0.1].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + delay * 2000, now + delay);
      gain.gain.setValueAtTime(0.15, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + delay); osc.stop(now + delay + 0.15);
    });
  } else if (type === 'error') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'fanfare') {
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (idx * 0.1));
      gain.gain.setValueAtTime(0.2, now + (idx * 0.1));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.1) + 0.3);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + (idx * 0.1)); osc.stop(now + (idx * 0.1) + 0.3);
    });
  }
};

const items = ["✏️", "🍎", "🚗", "🦴", "🎁"];

interface SlowFunProps {
  onComplete?: () => void;
}

export function SlowFun({ onComplete }: SlowFunProps) {
  const MAX_SCORE = 5;

  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<"BIG" | "SMALL">("BIG");
  const [moles, setMoles] = useState<{ id: number; up: boolean; size: string; emoji: string }[]>(
    Array.from({ length: 6 }).map((_, i) => ({ id: i, up: false, size: '', emoji: '' }))
  );
  const [message, setMessage] = useState("Ready to play?");
  const [roundKey, setRoundKey] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const startGame = () => {
    setScore(0);
    setGameStarted(true);
    setGameActive(true);
    setIsCompleted(false);
  };

  const generateRound = () => {
    const isBig = Math.random() > 0.5;
    setCurrentGoal(isBig ? "BIG" : "SMALL");
    setMessage(`Find the ${isBig ? "BIG" : "SMALL"} one!`);
    
    const emoji = items[Math.floor(Math.random() * items.length)];
    const indices = [0, 1, 2, 3, 4, 5].sort(() => 0.5 - Math.random());
    
    const newMoles = Array.from({ length: 6 }).map((_, i) => ({ id: i, up: false, size: '', emoji: '' }));
    newMoles[indices[0]] = { id: indices[0], up: true, size: "BIG", emoji };
    newMoles[indices[1]] = { id: indices[1], up: true, size: "SMALL", emoji };
    
    setMoles(newMoles);
    playSlowFunSound('pop');
  };

  useEffect(() => {
    if (!gameActive) return;
    
    generateRound();
    const interval = setInterval(() => {
      generateRound();
    }, 3500);
    
    return () => clearInterval(interval);
  }, [gameActive, roundKey]);

  const handleWhack = (mole: typeof moles[0]) => {
    if (!gameActive || !mole.up) return;
    
    if (mole.size === currentGoal) {
      playSlowFunSound('success');
      const newScore = score + 1;
      setScore(newScore);
      
      // Hide the correct mole
      setMoles(prev => prev.map(m => m.id === mole.id ? { ...m, up: false } : m));
      setMessage("YES! That's it! ✨");
      
      if (newScore >= MAX_SCORE) {
        setGameActive(false);
        setIsCompleted(true);
        setTimeout(() => {
          playSlowFunSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 500);
      } else {
        // Pause briefly before the next round
        setGameActive(false);
        setTimeout(() => {
          setGameActive(true);
          setRoundKey(k => k + 1);
        }, 1000);
      }
    } else {
      playSlowFunSound('error');
      setMessage(`Try again! Look for ${currentGoal}.`);
    }
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-[#87CEEB] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative overflow-hidden text-[#334155] font-display">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#3e4e22] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-lg mt-auto mb-auto bg-[#7cfc00] border-[8px] border-[#556b2f] rounded-[40px] p-5 shadow-[0_10px_0_#3e4e22] relative flex flex-col items-center">
        
        {/* Header Display */}
        <div className="w-full bg-white p-4 rounded-[25px] border-4 border-[#556b2f] mb-4 min-h-[100px] flex flex-col justify-center text-center">
          <div className="text-2xl font-bold mb-1" style={{ color: currentGoal === 'BIG' ? '#d63031' : '#0984e3' }}>
            {message}
          </div>
          <div className="text-xl font-bold text-[#556b2f]">
            ⭐ Score: {score} / {MAX_SCORE}
          </div>
        </div>

        {/* Mole Grid */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {moles.map((mole) => (
            <div key={mole.id} className="relative bg-[#4b3621] h-[100px] rounded-[40px_40px_10px_10px] overflow-hidden">
              <motion.div 
                className="absolute left-0 w-full h-[120%] bg-[#a0522d] rounded-[30px_30px_0_0] flex items-center justify-center cursor-pointer border-4 border-[#633219] shadow-inner"
                initial={{ top: '100%' }}
                animate={{ top: mole.up ? '10%' : '100%' }}
                transition={{ type: "spring", stiffness: 120, damping: 15 }}
                onClick={() => handleWhack(mole)}
              >
                {mole.up && (
                  <div className={`bg-white border-2 border-[#333] rounded-xl flex items-center justify-center ${mole.size === 'BIG' ? 'w-16 h-16 text-5xl' : 'w-8 h-8 text-xl'}`}>
                    {mole.emoji}
                  </div>
                )}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Start / Continue Button */}
        {!gameStarted ? (
          <Button size="lg" onClick={startGame} className="mt-6 bg-[#ff4500] hover:bg-[#cc3700] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_6px_0_#b23300] hover:shadow-none hover:translate-y-1 transition-all">
            START! ▶️
          </Button>
        ) : isCompleted ? (
          <Button size="lg" onClick={startGame} className="mt-6 bg-[#ff4500] hover:bg-[#cc3700] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_6px_0_#b23300] hover:shadow-none hover:translate-y-1 transition-all">
            Play Again! 🔄
          </Button>
        ) : null}

      </div>
    </div>
  );
}