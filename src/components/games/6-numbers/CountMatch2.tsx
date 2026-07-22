import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, ChevronRight } from 'lucide-react';

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

interface CountMatch2Props {
  onComplete?: () => void;
}

export function CountMatch2({ onComplete }: CountMatch2Props) {
  const NUMBERS = [6, 7, 8, 9, 10];
  
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [matches, setMatches] = useState<number[]>([]);
  const [shuffledAnimals, setShuffledAnimals] = useState<number[]>([]);
  const [wrongShake, setWrongShake] = useState<number | null>(null);
  const [message, setMessage] = useState("Tap number → Tap animals");

  useEffect(() => {
    setShuffledAnimals([...NUMBERS].sort(() => Math.random() - 0.5));
  }, []);

  const handleNumberClick = (num: number) => {
    if (matches.includes(num)) return;
    playSound('pop');
    setSelectedNumber(num);
    setMessage(`Hanapin ang ${num} na hayop!`);
  };

  const handleAnimalsClick = (num: number) => {
    if (matches.includes(num)) return;
    
    if (selectedNumber === null) {
      setMessage("Pindutin muna ang numero!");
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
          setMessage("Tama! Ang galing! 🏆");
        }
        return newMatches;
      });
      setSelectedNumber(null);
    } else {
      playSound('wrong');
      setMessage("Mali, bilangin muli! 🙈");
      setWrongShake(num);
      setTimeout(() => setWrongShake(null), 500);
      setSelectedNumber(null);
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
          <div className="text-6xl mb-6 animate-spin-slow">⭐</div>
          <h2 className="text-4xl font-display font-bold text-orange-600 mb-4">
            ANG GALING!
          </h2>
          <p className="text-xl text-slate-600 font-bold mb-8">
            Natapos mo na ang 6 hanggang 10!
          </p>
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
    <div className="w-full max-w-4xl flex flex-col items-center p-6 md:p-8 bg-[#b8e1d4] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative overflow-hidden">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-teal-900 font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-2xl bg-[#fef9e7] border-4 border-[#e5b45b] rounded-[2rem] p-6 shadow-lg flex flex-col items-center z-10">
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-[#2e4c3c] mb-4 text-center">
          🐼 6 7 8 9 10 🐨
        </h1>

        <div className="flex flex-col md:flex-row gap-4 w-full">
          
          {/* Numbers Panel */}
          <div className="flex-1 bg-[#fffae9] p-4 rounded-3xl border-2 border-[#d6a469] flex flex-col gap-3 shadow-inner">
            <h2 className="text-lg font-bold text-center text-[#8f5827] bg-[#fbdea4] py-1 rounded-xl">Numbers</h2>
            <div className="flex flex-col gap-2">
              {NUMBERS.map(num => {
                const isMatched = matches.includes(num);
                const isSelected = selectedNumber === num;
                
                return (
                  <motion.div
                    key={`num-${num}`}
                    whileHover={!isMatched ? { scale: 1.05 } : {}}
                    whileTap={!isMatched ? { scale: 0.95 } : {}}
                    onClick={() => handleNumberClick(num)}
                    className={`h-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl font-bold border-b-4 cursor-pointer transition-colors ${
                      isMatched 
                        ? 'bg-[#c7e7c7] text-[#1b7530] border-[#1b7530] opacity-50 scale-95 cursor-default'
                        : isSelected
                          ? 'bg-amber-300 text-amber-900 border-amber-500 shadow-inner'
                          : 'bg-[#facc6f] text-amber-900 border-[#b27226] shadow-md hover:bg-[#fbdea4]'
                    }`}
                  >
                    {num}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Animals Panel */}
          <div className="flex-1 bg-[#fffae9] p-4 rounded-3xl border-2 border-[#d6a469] flex flex-col gap-3 shadow-inner">
            <h2 className="text-lg font-bold text-center text-[#8f5827] bg-[#fbdea4] py-1 rounded-xl">Animals</h2>
            <div className="flex flex-col gap-2">
              {shuffledAnimals.map(num => {
                const isMatched = matches.includes(num);
                
                return (
                  <motion.div
                    key={`animals-${num}`}
                    animate={wrongShake === num ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    whileHover={!isMatched ? { scale: 1.05 } : {}}
                    whileTap={!isMatched ? { scale: 0.95 } : {}}
                    onClick={() => handleAnimalsClick(num)}
                    className={`min-h-[64px] rounded-2xl flex flex-wrap gap-2 items-center justify-center p-3 border-b-4 cursor-pointer transition-colors ${
                      isMatched 
                        ? 'bg-[#c7e7c7] border-[#1b7530] opacity-50 scale-95 cursor-default'
                        : 'bg-[#b6d9c7] border-[#42855e] shadow-md hover:bg-[#c8e8d8]'
                    }`}
                  >
                    {Array.from({ length: num }).map((_, i) => {
                      const bgColor = i % 2 === 0 ? "#b3ddf2" : i % 3 === 0 ? "#f8b88b" : "#fbe176";
                      return (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="w-6 h-6 rounded-full border-2 border-[#8b5a2b] relative shadow-sm"
                          style={{ backgroundColor: bgColor }}
                        >
                          {/* Animal Ears */}
                          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full border border-[#8b5a2b]" style={{ backgroundColor: bgColor }} />
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-[#8b5a2b]" style={{ backgroundColor: bgColor }} />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>

        <motion.div 
          key={message}
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-6 bg-[#fbeab6] text-amber-900 border-2 border-[#ca9a5a] px-6 py-3 rounded-xl font-bold text-center w-full shadow-sm"
        >
          {message}
        </motion.div>
      </div>

    </div>
  );
}