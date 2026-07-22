import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';

// Simple sound synthesis
const playSound = (type: 'correct' | 'wrong' | 'pop') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  if (type === 'correct') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } else if (type === 'wrong') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } else {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }
};

interface CountMatchProps {
  onComplete?: () => void;
}

export function CountMatch({ onComplete }: CountMatchProps) {
  const NUMBERS = [1, 2, 3, 4, 5];
  
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [matches, setMatches] = useState<number[]>([]);
  const [shuffledDots, setShuffledDots] = useState<number[]>([]);
  const [wrongShake, setWrongShake] = useState<number | null>(null);
  const [message, setMessage] = useState("Tap a number, then tap the matching dots!");

  useEffect(() => {
    setShuffledDots([...NUMBERS].sort(() => Math.random() - 0.5));
  }, []);

  const handleNumberClick = (num: number) => {
    if (matches.includes(num)) return;
    playSound('pop');
    setSelectedNumber(num);
    setMessage(`Nahanap mo ba ang ${num} dots?`);
  };

  const handleDotsClick = (num: number) => {
    if (matches.includes(num)) return;
    
    if (selectedNumber === null) {
      setMessage("Pindutin muna ang numero sa kaliwa!");
      return;
    }

    if (selectedNumber === num) {
      playSound('correct');
      setMatches(prev => {
        const newMatches = [...prev, num];
        if (newMatches.length === NUMBERS.length) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
          setMessage("🎉 WOW! TAPOS NA! 🎉");
        } else {
          setMessage("Tama! Ang galing! 🌟");
        }
        return newMatches;
      });
      setSelectedNumber(null);
    } else {
      playSound('wrong');
      setMessage("Mali, subukan muli! 🤔");
      setWrongShake(num);
      setTimeout(() => setWrongShake(null), 500);
      setSelectedNumber(null); // Deselect on wrong answer
    }
  };

  if (matches.length === NUMBERS.length) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[500px]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-6">🏆</div>
          <h2 className="text-4xl font-display font-bold text-amber-800 mb-8">
            You matched them all!
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
    <div className="w-full max-w-4xl flex flex-col items-center p-6 md:p-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative overflow-hidden">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-amber-800 font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <h1 className="text-3xl md:text-4xl font-display font-extrabold text-amber-900 mb-2 text-center z-10">
        Hanapin ang tamang bilang
      </h1>
      <div className="bg-amber-200/50 text-amber-900 px-6 py-2 rounded-full font-bold mb-8 z-10 border-2 border-amber-300">
        Tap number → Tap dots
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl z-10">
        
        {/* Numbers Panel */}
        <div className="flex-1 bg-white/60 p-4 rounded-3xl border-2 border-amber-200 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center text-amber-800 bg-amber-100 py-2 rounded-xl">Numbers</h2>
          <div className="flex flex-col gap-3">
            {NUMBERS.map(num => {
              const isMatched = matches.includes(num);
              const isSelected = selectedNumber === num;
              
              return (
                <motion.div
                  key={`num-${num}`}
                  whileHover={!isMatched ? { scale: 1.05 } : {}}
                  whileTap={!isMatched ? { scale: 0.95 } : {}}
                  onClick={() => handleNumberClick(num)}
                  className={`h-16 md:h-20 rounded-2xl flex items-center justify-center text-3xl font-bold border-b-4 cursor-pointer transition-colors ${
                    isMatched 
                      ? 'bg-green-200 text-green-700 border-green-300 opacity-60 scale-95 cursor-default'
                      : isSelected
                        ? 'bg-amber-400 text-white border-amber-500 shadow-inner'
                        : 'bg-orange-200 text-orange-900 border-orange-300 shadow-md hover:bg-orange-300'
                  }`}
                >
                  {num}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Dots Panel */}
        <div className="flex-1 bg-white/60 p-4 rounded-3xl border-2 border-amber-200 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center text-amber-800 bg-amber-100 py-2 rounded-xl">Dots</h2>
          <div className="flex flex-col gap-3">
            {shuffledDots.map(num => {
              const isMatched = matches.includes(num);
              
              return (
                <motion.div
                  key={`dots-${num}`}
                  animate={wrongShake === num ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  whileHover={!isMatched ? { scale: 1.05 } : {}}
                  whileTap={!isMatched ? { scale: 0.95 } : {}}
                  onClick={() => handleDotsClick(num)}
                  className={`h-16 md:h-20 rounded-2xl flex flex-wrap gap-2 items-center justify-center p-2 border-b-4 cursor-pointer transition-colors ${
                    isMatched 
                      ? 'bg-green-200 border-green-300 opacity-60 scale-95 cursor-default'
                      : 'bg-emerald-100 border-emerald-300 shadow-md hover:bg-emerald-200'
                  }`}
                >
                  {Array.from({ length: num }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-5 h-5 md:w-6 md:h-6 bg-red-400 rounded-full border-2 border-white shadow-sm"
                    />
                  ))}
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>

      <motion.div 
        key={message}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mt-8 bg-amber-800 text-amber-50 px-8 py-4 rounded-2xl font-bold text-lg text-center shadow-lg w-full max-w-xl z-10"
      >
        {message}
      </motion.div>

    </div>
  );
}