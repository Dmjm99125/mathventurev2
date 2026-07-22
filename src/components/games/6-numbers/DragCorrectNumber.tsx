import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui';

// Simple sound synthesis so we don't need external audio files
const playSound = (type: 'correct' | 'wrong') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  if (type === 'correct') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } else {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }
};

interface DragCorrectNumberProps {
  onComplete?: () => void;
}

export function DragCorrectNumber({ onComplete }: DragCorrectNumberProps) {
  const [targetNumber, setTargetNumber] = useState(1);
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [wrongShake, setWrongShake] = useState(false);
  
  const MAX_SCORE = 5;

  const generateGame = () => {
    const answer = Math.floor(Math.random() * 10) + 1;
    setTargetNumber(answer);
    
    const opts = new Set<number>();
    opts.add(answer);
    while (opts.size < 4) {
      opts.add(Math.floor(Math.random() * 10) + 1);
    }
    
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    generateGame();
  }, []);

  const handleAnswer = (selected: number) => {
    if (selected === targetNumber) {
      playSound('correct');
      setScore(s => s + 1);
      setStars(s => s + 1);
      
      if (score + 1 >= MAX_SCORE) {
        setIsCompleted(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        generateGame();
      }
    } else {
      playSound('wrong');
      setWrongShake(true);
      setTimeout(() => setWrongShake(false), 500);
    }
  };

  const handleDragStart = (e: React.DragEvent, num: number) => {
    setDraggedItem(num);
    e.dataTransfer.setData('text/plain', num.toString());
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem !== null) {
      handleAnswer(draggedItem);
      setDraggedItem(null);
    }
  };

  if (isCompleted) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[500px]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-6">🏆</div>
          <h2 className="text-4xl font-display font-bold text-slate-800 mb-8">
            You're a Number Master!
          </h2>
          <div className="flex gap-4 justify-center">
            {onComplete && (
              <Button size="lg" variant="jungle" onClick={onComplete} className="text-xl px-8 h-16 rounded-full shadow-lg">
                Continue <Play className="ml-2 w-6 h-6 fill-current" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-8 bg-gradient-to-b from-teal-100 to-green-100 rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 text-4xl opacity-50 blur-[2px]">🎈</div>
      <div className="absolute bottom-20 right-10 text-5xl opacity-50 blur-[2px]">🎈</div>
      <div className="absolute top-40 right-20 text-3xl opacity-50 blur-[1px]">☁️</div>
      <div className="absolute bottom-40 left-20 text-4xl opacity-50 blur-[1px]">☁️</div>

      <div className="flex justify-between w-full mb-8 z-10 px-8">
        <div className="text-2xl font-bold text-slate-600 bg-white/70 px-6 py-2 rounded-2xl shadow-sm">
          Score: {score}/{MAX_SCORE}
        </div>
        <div className="text-2xl font-bold bg-white/70 px-6 py-2 rounded-2xl shadow-sm tracking-widest">
          {Array.from({ length: Math.min(stars, 5) }).map((_, i) => '⭐')}
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl font-display font-extrabold text-teal-800 mb-12 drop-shadow-sm text-center z-10">
        🎈 Drag the Correct Number 🎈
      </h1>

      <div className="flex flex-col items-center gap-12 w-full max-w-2xl z-10">
        
        {/* Apples Container */}
        <motion.div 
          key={`apples-${targetNumber}`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-wrap justify-center gap-2 min-h-[100px] bg-white/50 p-6 rounded-3xl shadow-sm border-2 border-white"
        >
          {Array.from({ length: targetNumber }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="text-5xl md:text-6xl drop-shadow-md"
            >
              🍎
            </motion.div>
          ))}
        </motion.div>

        {/* Dropzone */}
        <motion.div
          animate={wrongShake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`w-64 h-32 border-4 border-dashed rounded-3xl flex items-center justify-center text-2xl font-bold transition-colors ${
            wrongShake ? 'border-red-400 bg-red-50 text-red-500' : 'border-teal-400 bg-white/80 text-teal-600 hover:bg-teal-50'
          }`}
        >
          Drop Here 👇
        </motion.div>

        {/* Options */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          <AnimatePresence mode="popLayout">
            {options.map((num) => (
              <motion.div
                key={`${num}-${score}`}
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
                draggable
                onDragStart={(e: any) => handleDragStart(e, num)}
                onClick={() => handleAnswer(num)}
                className="w-20 h-20 md:w-24 md:h-24 bg-rose-300 rounded-2xl flex items-center justify-center text-4xl md:text-5xl font-bold text-white shadow-lg cursor-grab active:cursor-grabbing border-b-4 border-rose-400"
              >
                {num}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}