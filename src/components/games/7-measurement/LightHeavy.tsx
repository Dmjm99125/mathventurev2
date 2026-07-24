import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight, Star } from 'lucide-react';

const playSound = (type: 'correct' | 'wrong' | 'creak' | 'fanfare') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;

  if (type === 'correct') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'wrong') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'creak') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.5);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.5);
  } else if (type === 'fanfare') {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (idx * 0.1));
      gain.gain.setValueAtTime(0.2, now + (idx * 0.1));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.1) + 0.4);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + (idx * 0.1)); osc.stop(now + (idx * 0.1) + 0.4);
    });
  }
};

interface Item {
  name: string;
  emoji: string;
  w: number;
}

const items: Item[] = [
  {name: "Elephant", emoji: "🐘", w: 10},
  {name: "Feather", emoji: "🪶", w: 1},
  {name: "Butterfly", emoji: "🦋", w: 1},
  {name: "Truck", emoji: "🚛", w: 10},
  {name: "Balloon", emoji: "🎈", w: 1},
  {name: "Hippo", emoji: "🦛", w: 10},
  {name: "Leaf", emoji: "🍃", w: 1},
  {name: "Plane", emoji: "✈️", w: 10}
];

interface LightHeavyProps {
  onComplete?: () => void;
}

export function LightHeavy({ onComplete }: LightHeavyProps) {
  const MAX_SCORE = 10;
  
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState<"HEAVY" | "LIGHT">("HEAVY");
  const [currentPair, setCurrentPair] = useState<Item[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Interaction state
  const [isRevealed, setIsRevealed] = useState(false);
  const [message, setMessage] = useState("Which one is HEAVY?");
  
  const setupRound = () => {
    const heavyItems = items.filter(i => i.w === 10);
    const lightItems = items.filter(i => i.w === 1);
    
    const heavy = heavyItems[Math.floor(Math.random() * heavyItems.length)];
    const light = lightItems[Math.floor(Math.random() * lightItems.length)];
    
    setCurrentPair([heavy, light].sort(() => Math.random() - 0.5));
    const newTarget = Math.random() > 0.5 ? "HEAVY" : "LIGHT";
    setTarget(newTarget);
    setMessage(`Which one is ${newTarget}?`);
    setIsRevealed(false);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const handleChoice = (item: Item) => {
    if (isRevealed) return;
    setIsRevealed(true);
    playSound('creak');

    const correct = (target === "HEAVY" && item.w === 10) || (target === "LIGHT" && item.w === 1);

    if (correct) {
      setTimeout(() => playSound('correct'), 500);
      setMessage(`YES! ${item.name} is ${target}! ✨`);
      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 3000);
      } else {
        setTimeout(setupRound, 3000);
      }
    } else {
      setTimeout(() => playSound('wrong'), 500);
      setMessage(`Look! ${item.w === 10 ? "Heavy goes down." : "Light stays up."}`);
      setTimeout(setupRound, 3000);
    }
  };

  const resetGame = () => {
    setScore(0);
    setIsCompleted(false);
    setupRound();
  };

  const rotation = isRevealed ? (currentPair[0].w > currentPair[1].w ? -15 : 15) : 0;

  if (currentPair.length === 0) return null;

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-[#e1f5fe] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#0288d1] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-2xl mt-auto mb-auto flex flex-col items-center p-6 bg-white rounded-[40px] border-[8px] border-[#81d4fa] shadow-[0_10px_0_#4fc3f7]">
        
        <div className="w-full bg-[#fff9c4] px-6 py-4 rounded-[20px] border-4 border-[#fbc02d] text-2xl md:text-3xl font-bold text-center mb-8 min-h-[80px] flex items-center justify-center transition-colors"
             style={{ color: target === 'HEAVY' ? '#d32f2f' : '#1976d2' }}>
          {message}
        </div>

        {/* Seesaw Area */}
        <div className="relative w-full h-[180px] flex justify-center items-end mb-10">
          <motion.div 
            className="absolute w-[280px] md:w-[360px] h-[15px] bg-[#a1887f] bottom-[35px] rounded-xl flex justify-between px-6 z-10"
            animate={{ rotate: rotation }}
            transition={{ type: "spring", stiffness: 60, damping: 12 }}
          >
            <motion.div 
              className="text-[4rem] md:text-[5rem] -mt-[70px] md:-mt-[85px] drop-shadow-md origin-bottom transform"
              animate={{ rotate: -rotation }}
              transition={{ type: "spring", stiffness: 60, damping: 12 }}
            >
              {isRevealed ? currentPair[0].emoji : '❓'}
            </motion.div>
            <motion.div 
              className="text-[4rem] md:text-[5rem] -mt-[70px] md:-mt-[85px] drop-shadow-md origin-bottom transform"
              animate={{ rotate: -rotation }}
              transition={{ type: "spring", stiffness: 60, damping: 12 }}
            >
              {isRevealed ? currentPair[1].emoji : '❓'}
            </motion.div>
          </motion.div>
          <div className="w-[60px] h-[40px] bg-[#795548] z-20" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          {currentPair.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={!isRevealed ? { scale: 1.05 } : {}}
              whileTap={!isRevealed ? { scale: 0.95 } : {}}
              onClick={() => handleChoice(item)}
              className={`bg-white border-[5px] border-[#81c784] rounded-3xl p-4 flex flex-col items-center cursor-pointer shadow-[0_6px_0_#4caf50] transition-opacity ${isRevealed ? 'opacity-50 cursor-default shadow-none translate-y-1' : ''}`}
            >
              <span className="text-5xl mb-2">{item.emoji}</span>
              <span className="text-xl font-bold text-[#333]">{item.name}</span>
            </motion.div>
          ))}
        </div>

        <div className="font-bold text-[#fbc02d] text-xl flex items-center gap-2">
          <Star className="w-6 h-6 fill-current" /> Score: <span className="text-[#f57f17]">{score}</span> / 10
        </div>
      </div>

      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#fff9c4]/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="text-[8rem] leading-none mb-4 drop-shadow-lg"
            >
              🏆✨
            </motion.div>
            <h1 className="text-[#5d4037] text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-sm">WEIGHT STAR!</h1>
            <p className="text-2xl text-[#8d6e63] font-bold mb-8">You balanced 10 scales!</p>
            
            <div className="flex gap-4">
              <Button size="lg" onClick={resetGame} className="bg-[#4caf50] hover:bg-[#388e3c] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_6px_0_#2e7d32] hover:shadow-[0_2px_0_#2e7d32] hover:translate-y-1 transition-all">
                Play Again! 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}