import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
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

interface CountMatch4Props {
  onComplete?: () => void;
}

export function CountMatch4({ onComplete }: CountMatch4Props) {
  const NUMBERS = [16, 17, 18, 19, 20];
  
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [matches, setMatches] = useState<number[]>([]);
  const [shuffledSmileys, setShuffledSmileys] = useState<number[]>([]);
  const [wrongShake, setWrongShake] = useState<number | null>(null);
  const [message, setMessage] = useState("Tap a number, then tap its group!");

  // Refs for drawing lines
  const containerRef = useRef<HTMLDivElement>(null);
  const numRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const imgRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [lines, setLines] = useState<{ x1: number, y1: number, x2: number, y2: number }[]>([]);

  useEffect(() => {
    setShuffledSmileys([...NUMBERS].sort(() => Math.random() - 0.5));
  }, []);

  const updateLines = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines = matches.map(num => {
      const numEl = numRefs.current[num];
      const imgEl = imgRefs.current[num];
      if (numEl && imgEl) {
        const numRect = numEl.getBoundingClientRect();
        const imgRect = imgEl.getBoundingClientRect();
        return {
          x1: numRect.right - containerRect.left,
          y1: numRect.top + numRect.height / 2 - containerRect.top,
          x2: imgRect.left - containerRect.left,
          y2: imgRect.top + imgRect.height / 2 - containerRect.top,
        };
      }
      return null;
    }).filter(Boolean) as { x1: number, y1: number, x2: number, y2: number }[];
    setLines(newLines);
  };

  useEffect(() => {
    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [matches]);

  const handleNumberClick = (num: number) => {
    if (matches.includes(num)) return;
    playSound('pop');
    setSelectedNumber(num);
    setMessage(`Hanapin ang group na may ${num}!`);
  };

  const handleSmileysClick = (num: number) => {
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
          setMessage("🎉 AWESOME! TAPOS NA! 🎉");
        } else {
          setMessage("Tama! Ang galing! 🌟");
        }
        return newMatches;
      });
      setSelectedNumber(null);
    } else {
      playSound('wrong');
      setMessage("Mali, bilangin muli! 🧐");
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
            AWESOME!
          </h2>
          <p className="text-xl text-slate-600 font-bold mb-8">
            Natapos mo na ang 16 hanggang 20!
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
    <div className="w-full max-w-4xl flex flex-col items-center p-6 md:p-8 bg-[#b8dff0] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative overflow-hidden">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#2d5128] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-3xl bg-[#feebcc] border-4 border-[#e09d5e] rounded-[2rem] p-6 shadow-[0_10px_0_#b17438] flex flex-col items-center z-10">
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-[#2d5128] mb-4 text-center">
          16 • 17 • 18 • 19 • 20
        </h1>
        <div className="bg-[#fff0cc] text-[#bb833f] border-2 border-[#bb833f] px-6 py-2 rounded-full font-bold mb-6">
          ✏️ Match number and group
        </div>

        <div className="relative flex justify-between w-full p-4 bg-[#f8dbb0] border-4 border-dashed border-[#b87a40] rounded-3xl min-h-[400px]" ref={containerRef}>
          
          {/* SVG Overlay for Lines */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
            {lines.map((line, idx) => (
              <motion.line
                key={idx}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#2e7d32"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </svg>

          {/* Numbers Column */}
          <div className="flex flex-col justify-between gap-3 w-[40%] z-30">
            {NUMBERS.map(num => {
              const isMatched = matches.includes(num);
              const isSelected = selectedNumber === num;
              
              return (
                <motion.div
                  key={`num-${num}`}
                  ref={el => numRefs.current[num] = el}
                  whileHover={!isMatched ? { scale: 1.05 } : {}}
                  whileTap={!isMatched ? { scale: 0.95 } : {}}
                  onClick={() => handleNumberClick(num)}
                  className={`h-[60px] md:h-[70px] rounded-2xl flex items-center justify-center text-3xl font-bold border-[3px] cursor-pointer transition-colors ${
                    isMatched 
                      ? 'bg-[#c8e6b5] text-[#307530] border-[#307530] opacity-40 scale-95 cursor-default shadow-none'
                      : isSelected
                        ? 'bg-[#ffe57f] text-[#ffc107] border-[#ffc107] shadow-[0_0_10px_#ffc107]'
                        : 'bg-[#ffad60] text-amber-900 border-[#b55a1a] shadow-[0_4px_0_#9b4f1a] hover:bg-[#ffbe80]'
                  }`}
                >
                  {num}
                </motion.div>
              );
            })}
          </div>

          {/* Smileys Column */}
          <div className="flex flex-col justify-between gap-3 w-[45%] z-30">
            {shuffledSmileys.map(num => {
              const isMatched = matches.includes(num);
              
              return (
                <motion.div
                  key={`smileys-${num}`}
                  ref={el => imgRefs.current[num] = el}
                  animate={wrongShake === num ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  whileHover={!isMatched ? { scale: 1.05 } : {}}
                  whileTap={!isMatched ? { scale: 0.95 } : {}}
                  onClick={() => handleSmileysClick(num)}
                  className={`min-h-[60px] md:min-h-[70px] rounded-2xl flex flex-wrap gap-1 items-center justify-center p-2 border-[3px] cursor-pointer transition-colors ${
                    isMatched 
                      ? 'bg-[#c8e6b5] border-[#307530] opacity-40 scale-95 cursor-default shadow-none'
                      : 'bg-[#c7e3c7] border-[#2f7d4d] shadow-[0_4px_0_#236b3a] hover:bg-[#d5ecd5]'
                  }`}
                >
                  {Array.from({ length: num }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="text-sm md:text-base leading-none"
                    >
                      😊
                    </motion.div>
                  ))}
                </motion.div>
              );
            })}
          </div>

        </div>

        <motion.div 
          key={message}
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-6 bg-[#fff4cf] text-[#633c1e] border-[3px] border-[#cb9a5b] px-6 py-3 rounded-xl font-bold text-center w-full shadow-sm"
        >
          {message}
        </motion.div>
      </div>

    </div>
  );
}