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

interface CountMatch3Props {
  onComplete?: () => void;
}

export function CountMatch3({ onComplete }: CountMatch3Props) {
  const NUMBERS = [11, 12, 13, 14, 15];
  
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [matches, setMatches] = useState<number[]>([]);
  const [shuffledCupcakes, setShuffledCupcakes] = useState<number[]>([]);
  const [wrongShake, setWrongShake] = useState<number | null>(null);
  const [message, setMessage] = useState("Tap number → Tap cupcakes");

  useEffect(() => {
    setShuffledCupcakes([...NUMBERS].sort(() => Math.random() - 0.5));
  }, []);

  const resetGame = () => {
    setMatches([]);
    setShuffledCupcakes([...NUMBERS].sort(() => Math.random() - 0.5));
    setMessage("Tap number → Tap cupcakes");
    setSelectedNumber(null);
  };

  const handleNumberClick = (num: number) => {
    if (matches.includes(num)) return;
    playSound('pop');
    setSelectedNumber(num);
    setMessage(`Hanapin ang ${num} na cupcake!`);
  };

  const handleCupcakesClick = (num: number) => {
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
          setMessage("Yum! Tama ka! 🧁");
        }
        return newMatches;
      });
      setSelectedNumber(null);
    } else {
      playSound('wrong');
      setMessage("Subukan muli ang pagbilang! 🧐");
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
            Natapos mo na ang 11 hanggang 15!
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="jungle" onClick={resetGame} className="text-xl px-8 h-16 rounded-full shadow-lg">
              Play Again! 🔄
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 md:p-8 bg-[#fde2c4] bg-[repeating-linear-gradient(45deg,#ffd7a7_0px,#ffd7a7_20px,#ffeac5_20px,#ffeac5_40px)] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-[#f2b279] relative overflow-hidden">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#633c1e] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-2xl bg-[#fff0da] border-4 border-[#f2b279] rounded-[2rem] p-6 shadow-[0_10px_0_#cb7f4a] flex flex-col items-center z-10">
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-[#633c1e] mb-4 text-center">
          🧁 11 • 12 • 13 • 14 • 15 🧁
        </h1>

        <div className="flex flex-col md:flex-row gap-4 w-full">
          
          {/* Numbers Panel */}
          <div className="flex-1 bg-[#fffbf0] p-4 rounded-3xl border-2 border-[#dfa86a] flex flex-col gap-3">
            <h2 className="text-lg font-bold text-center text-[#3f2e16] bg-[#ffd89a] py-1 rounded-xl">Numbers</h2>
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
                        ? 'bg-[#c8e6b5] text-[#307530] border-[#307530] opacity-50 scale-95 cursor-default'
                        : isSelected
                          ? 'bg-[#ff953b] text-white border-[#d36e22] shadow-inner'
                          : 'bg-[#ffb26b] text-[#5e2e0d] border-[#b05f26] shadow-[0_4px_0_#8e4d23] hover:bg-[#ffc68f]'
                    }`}
                  >
                    {num}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Cupcakes Panel */}
          <div className="flex-1 bg-[#fffbf0] p-4 rounded-3xl border-2 border-[#dfa86a] flex flex-col gap-3">
            <h2 className="text-lg font-bold text-center text-[#3f2e16] bg-[#ffd89a] py-1 rounded-xl">Cupcakes</h2>
            <div className="flex flex-col gap-2">
              {shuffledCupcakes.map(num => {
                const isMatched = matches.includes(num);
                
                return (
                  <motion.div
                    key={`cupcakes-${num}`}
                    animate={wrongShake === num ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    whileHover={!isMatched ? { scale: 1.05 } : {}}
                    whileTap={!isMatched ? { scale: 0.95 } : {}}
                    onClick={() => handleCupcakesClick(num)}
                    className={`min-h-[64px] rounded-2xl flex flex-wrap gap-2 items-center justify-center p-3 border-b-4 cursor-pointer transition-colors ${
                      isMatched 
                        ? 'bg-[#c8e6b5] border-[#307530] opacity-50 scale-95 cursor-default'
                        : 'bg-[#f8cfbc] border-[#b3544b] shadow-[0_4px_0_#943e36] hover:bg-[#fce6dc]'
                    }`}
                  >
                    {Array.from({ length: num }).map((_, i) => {
                      return (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="w-5 h-4 bg-[#f7c1a4] rounded-[4px_4px_10px_10px] border border-[#ab5f3f] relative mt-2 shadow-sm"
                        >
                          {/* Frosting */}
                          <div className="absolute -top-2 -left-[1px] w-5 h-2.5 bg-[#ffb3c6] rounded-[10px_10px_0_0] border border-[#bc5f7a]" />
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
          className="mt-6 bg-[#fff3c9] text-[#633c1e] border-2 border-[#cc9f64] px-6 py-3 rounded-xl font-bold text-center w-full shadow-sm"
        >
          {message}
        </motion.div>
      </div>

    </div>
  );
}