import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, ChevronRight } from 'lucide-react';

const playFactorySound = (type: 'stamp' | 'error' | 'fanfare') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;

  if (type === 'stamp') {
    [0, 0.08].forEach((timeOffset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25 + (i * 130), now + timeOffset);
      gain.gain.setValueAtTime(0.2, now + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + 0.15);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + timeOffset); osc.stop(now + timeOffset + 0.15);
    });
  } else if (type === 'error') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.18);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.18);
  } else if (type === 'fanfare') {
    const notes = [261.63, 329.63, 392.00, 523.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (idx * 0.06));
      gain.gain.setValueAtTime(0.15, now + (idx * 0.06));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.06) + 0.3);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + (idx * 0.06)); osc.stop(now + (idx * 0.06) + 0.3);
    });
  }
};

const toyTypes = ['🧸', '🚗', '🚂', '🦆', '⚽', '🎨', '🚀', '🤖', '🦄', '✈️'];
const milestonePrizes = ['🏰', '🛹', '🎸', '🎮', '🦕', '🧩', '🥁', '🚲', '🪁'];

interface ToyFactoryProps {
  onComplete?: () => void;
}

export function ToyFactory({ onComplete }: ToyFactoryProps) {
  const MAX_SCORE = 5;
  
  const [score, setScore] = useState(0);
  const [activeCount, setActiveCount] = useState(1);
  const [selectedToy, setSelectedToy] = useState('🧸');
  const [placements, setPlacements] = useState<number[]>([]);
  const [choices, setChoices] = useState<number[]>([]);
  const [wrongChoices, setWrongChoices] = useState<number[]>([]);
  const [isCorrectlyGuessed, setIsCorrectlyGuessed] = useState(false);
  const [crateKey, setCrateKey] = useState(0); // To trigger CSS animation reset on crate
  
  const [toyUnlocked, setToyUnlocked] = useState(false);
  const [wonToy, setWonToy] = useState('');
  const [shelfToys, setShelfToys] = useState<string[]>([]);

  const generateLevel = () => {
    const count = Math.floor(Math.random() * 9) + 1; // 1 to 9
    setActiveCount(count);
    setSelectedToy(toyTypes[Math.floor(Math.random() * toyTypes.length)]);
    setCrateKey(prev => prev + 1);

    // Layout styling based on quantity for neat patterns in 3x3 grid (indices 0-8)
    let newPlacements: number[] = [];
    if (count === 1) newPlacements = [4]; // Center
    else if (count === 2) newPlacements = [0, 8]; // Diagonals
    else if (count === 3) newPlacements = [0, 4, 8]; // Main diagonal
    else if (count === 4) newPlacements = [0, 2, 6, 8]; // Corners
    else if (count === 5) newPlacements = [0, 2, 4, 6, 8]; // X shape
    else {
      // For 6-9, randomly scatter across 9 spaces
      while(newPlacements.length < count) {
        let randPos = Math.floor(Math.random() * 9);
        if(!newPlacements.includes(randPos)) newPlacements.push(randPos);
      }
    }
    setPlacements(newPlacements);

    // Keypad choices
    const buttonValues = [count];
    while (buttonValues.length < 3) {
      let fake = Math.floor(Math.random() * 9) + 1;
      if (!buttonValues.includes(fake)) buttonValues.push(fake);
    }
    setChoices(buttonValues.sort(() => Math.random() - 0.5));
    setWrongChoices([]);
    setIsCorrectlyGuessed(false);
  };

  useEffect(() => {
    generateLevel();
  }, []);

  const handleGuess = (val: number) => {
    if (isCorrectlyGuessed || wrongChoices.includes(val) || toyUnlocked) return;

    if (val === activeCount) {
      playFactorySound('stamp');
      setIsCorrectlyGuessed(true);
      
      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          playFactorySound('fanfare');
          const reward = milestonePrizes[Math.floor(Math.random() * milestonePrizes.length)];
          setWonToy(reward);
          setShelfToys(prev => [...prev, reward]);
          setToyUnlocked(true);
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 700);
      } else {
        setTimeout(() => generateLevel(), 1000);
      }
    } else {
      playFactorySound('error');
      setWrongChoices(prev => [...prev, val]);
    }
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-[#fffbeb] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative overflow-hidden text-[#334155] font-display">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#3b82f6] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-md mt-auto mb-auto bg-white border-[6px] border-[#3b82f6] rounded-[32px] p-5 shadow-[0_20px_40px_rgba(59,130,246,0.2)] relative">
        
        {/* HUD */}
        <div className="flex justify-between text-xl font-bold text-[#3b82f6] mb-3">
          <div>Packed: <span className="text-[#f97316]">{score}</span></div>
          <div>Goal: <span className="text-[#f59e0b]">{MAX_SCORE}</span></div>
        </div>

        <p className="text-center font-bold text-[#64748b] mb-4 text-lg">How many toys are in the magic box?</p>

        {/* Conveyor Belt & Crate */}
        <div className="bg-gradient-to-b from-[#cbd5e1] to-[#94a3b8] border-4 border-[#64748b] rounded-3xl h-[200px] my-4 flex justify-center items-center relative shadow-[inset_0_6px_10px_rgba(0,0,0,0.15)] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key={crateKey} // Forces re-render animation when crateKey changes
              initial={{ x: -300, rotate: -10, opacity: 0 }}
              animate={{ x: 0, rotate: 0, opacity: 1 }}
              exit={{ x: 300, rotate: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className={`bg-[#ffedd5] border-4 border-dashed rounded-2xl w-[160px] h-[160px] grid grid-cols-3 grid-rows-3 gap-1 p-2 shadow-[0_6px_12px_rgba(0,0,0,0.1)] ${isCorrectlyGuessed ? 'border-green-500 bg-green-50' : 'border-[#f97316]'}`}
            >
              {Array.from({ length: 9 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-center text-3xl">
                  {placements.includes(idx) ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + (placements.indexOf(idx) * 0.05) }}
                    >
                      {selectedToy}
                    </motion.div>
                  ) : null}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {choices.map((val, idx) => {
            const isWrong = wrongChoices.includes(val);
            const isCorrect = isCorrectlyGuessed && val === activeCount;

            return (
              <motion.button
                key={idx}
                whileHover={!isWrong && !isCorrectlyGuessed ? { scale: 1.05 } : {}}
                whileTap={!isWrong && !isCorrectlyGuessed ? { scale: 0.95 } : {}}
                onClick={() => handleGuess(val)}
                disabled={isWrong || isCorrectlyGuessed}
                className={`h-20 rounded-[20px] text-4xl font-black text-white border-none shadow-[0_6px_0_#b45309] transition-colors ${
                  isCorrect 
                    ? 'bg-green-500 shadow-[0_6px_0_#16a34a]' 
                    : isWrong 
                      ? 'bg-[#94a3b8] shadow-[0_6px_0_#475569] opacity-70 translate-y-1 shadow-[0_2px_0_#475569]'
                      : 'bg-[#f59e0b]'
                }`}
              >
                {val}
              </motion.button>
            );
          })}
        </div>

        {/* Collection Shelf */}
        <div className="bg-[#f1f5f9] border-t-4 border-[#64748b] rounded-xl p-3 mt-6">
          <div className="text-xs text-[#94a3b8] font-bold uppercase mb-1 text-center">Your Unlocked Toy Collection</div>
          <div className="flex justify-center gap-2 text-3xl min-h-[40px] flex-wrap">
            <AnimatePresence>
              {shelfToys.map((toy, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="drop-shadow-md"
                >
                  {toy}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Unlocked Toy Overlay */}
        <AnimatePresence>
          {toyUnlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 rounded-[26px] flex flex-col justify-center items-center z-50 p-6 text-center"
            >
              <h2 className="text-[#f97316] text-4xl font-extrabold mb-2">🔑 Toy Unlocked! 🔑</h2>
              <p className="text-[#475569] text-xl font-bold mb-6">Your golden key built a special gift:</p>
              
              <motion.div 
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="text-8xl drop-shadow-xl mb-8"
              >
                {wonToy}
              </motion.div>
              
              {onComplete && (
                <Button size="lg" onClick={onComplete} className="bg-[#3b82f6] hover:bg-[#1d4ed8] text-white text-xl font-bold h-14 px-8 rounded-full shadow-[0_5px_0_#1d4ed8] hover:shadow-[0_2px_0_#1d4ed8] hover:translate-y-1 transition-all">
                  Keep Making Toys <Play className="ml-2 w-6 h-6 fill-current" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}