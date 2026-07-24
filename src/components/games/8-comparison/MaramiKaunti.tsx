import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight } from 'lucide-react';

const playSound = (type: 'correct' | 'wrong' | 'fanfare' | 'pop') => {
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
  } else if (type === 'pop') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);
  }
};

interface MaramiKauntiProps {
  onComplete?: () => void;
}

const flowerEmojis = ['🌸', '🌻', '🌷', '🌹', '🌼', '🌺'];

export function MaramiKaunti({ onComplete }: MaramiKauntiProps) {
  const MAX_SCORE = 10;
  
  const [score, setScore] = useState(0);
  const [isLookingForMore, setIsLookingForMore] = useState(true);
  const [leftFlowers, setLeftFlowers] = useState<{ emoji: string, id: number }[]>([]);
  const [rightFlowers, setRightFlowers] = useState<{ emoji: string, id: number }[]>([]);
  const [targetPatch, setTargetPatch] = useState<'left' | 'right'>('left');
  
  const [feedback, setFeedback] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [stars, setStars] = useState<{ id: number, x: number, y: number }[]>([]);

  const setupRound = () => {
    setFeedback("");
    const isMore = Math.random() > 0.5;
    setIsLookingForMore(isMore);
    
    const countA = Math.floor(Math.random() * 3) + 1; // 1 to 3
    const countB = Math.floor(Math.random() * 6) + 16; // 16 to 21
    const leftIsMore = Math.random() > 0.5;
    
    const leftCount = leftIsMore ? countB : countA;
    const rightCount = leftIsMore ? countA : countB;
    
    const randomFlower = flowerEmojis[Math.floor(Math.random() * flowerEmojis.length)];
    
    setLeftFlowers(Array.from({ length: leftCount }).map((_, i) => ({ emoji: randomFlower, id: i })));
    setRightFlowers(Array.from({ length: rightCount }).map((_, i) => ({ emoji: randomFlower, id: i })));
    
    setTargetPatch(isMore ? (leftIsMore ? 'left' : 'right') : (leftIsMore ? 'right' : 'left'));
  };

  useEffect(() => {
    setupRound();
  }, []);

  const triggerStarBurst = () => {
    const newStars = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400
    }));
    setStars(newStars);
    setTimeout(() => setStars([]), 1000);
  };

  const handlePatchClick = (side: 'left' | 'right') => {
    if (feedback === "Ang galing! ⭐") return;

    if (side === targetPatch) {
      playSound('correct');
      setFeedback("Ang galing! ⭐");
      triggerStarBurst();
      const newScore = score + 1;
      setScore(newScore);
      
      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 1000);
      } else {
        setTimeout(setupRound, 1200);
      }
    } else {
      playSound('wrong');
      setFeedback("Subukan muli! 💪");
    }
  };

  const resetGame = () => {
    setScore(0);
    setIsCompleted(false);
    setupRound();
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 rounded-[3rem] shadow-sm min-h-[650px] border-4 border-white relative font-display text-center select-none overflow-hidden bg-gradient-to-b from-[#87CEEB] to-[#E0F7FA]">
      
      {/* Scenery */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[3rem] z-0">
        <motion.div 
          animate={{ x: [ -100, 1000 ] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[-150px] w-[100px] h-[40px] bg-white/80 rounded-full blur-[2px]"
        />
        <motion.div 
          animate={{ x: [ -200, 1000 ] }} 
          transition={{ duration: 30, repeat: Infinity, ease: "linear", delay: 5 }}
          className="absolute top-[22%] left-[-200px] w-[150px] h-[60px] bg-white/80 rounded-full blur-[2px]"
        />
        <motion.div 
          animate={{ 
            x: [ -50, 800 ],
            y: [ 0, -20, 20, -10, 0 ],
            rotate: [ 0, 20, -10, 10, 0 ]
          }} 
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] text-2xl z-10"
        >
          🦋
        </motion.div>
        
        {/* Hill */}
        <div className="absolute bottom-[-100px] left-[-10%] w-[120%] h-[250px] bg-[#2ecc71] rounded-[50%_50%_0_0]" />
      </div>

      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#2c3e50] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-lg mt-4 flex flex-col items-center z-10 flex-grow">
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b5e20] mb-2 drop-shadow-md">Marami o Kaunti? 🌸</h1>
        
        <div className="w-full flex justify-between px-4 mb-4 text-xl font-bold text-[#2c3e50]">
          <div className="flex items-center gap-1 bg-white/60 px-4 py-1 rounded-full">Puntos: <span className="text-[#1b5e20]">{score}</span> / {MAX_SCORE}</div>
        </div>

        <div className="bg-white/90 border-2 border-[#2ecc71] px-8 py-4 rounded-[15px] shadow-[0_4px_8px_rgba(0,0,0,0.1)] mb-8 w-[90%] max-w-[500px]">
          <h2 className={`text-3xl md:text-4xl font-bold ${isLookingForMore ? 'text-[#d35400]' : 'text-[#2980b9]'}`}>
            {isLookingForMore ? "Hanapin ang MARAMI" : "Hanapin ang KAUNTI"}
          </h2>
        </div>

        {/* Garden Area */}
        <div className="flex justify-center gap-6 md:gap-10 mt-auto mb-12 w-full max-w-[500px]">
          
          <motion.div
            className="w-[145px] h-[195px] md:w-[170px] md:h-[220px] bg-[#795548] border-[6px] border-[#5d4037] shadow-[0_8px_0_#3e2723] rounded-2xl p-2 flex flex-wrap justify-center items-start content-start overflow-hidden cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePatchClick('left')}
          >
            <AnimatePresence>
              {leftFlowers.map((flower) => (
                <motion.div
                  key={`left-${flower.id}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-2xl md:text-3xl m-0.5"
                >
                  {flower.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="w-[145px] h-[195px] md:w-[170px] md:h-[220px] bg-[#795548] border-[6px] border-[#5d4037] shadow-[0_8px_0_#3e2723] rounded-2xl p-2 flex flex-wrap justify-center items-start content-start overflow-hidden cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePatchClick('right')}
          >
            <AnimatePresence>
              {rightFlowers.map((flower) => (
                <motion.div
                  key={`right-${flower.id}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-2xl md:text-3xl m-0.5"
                >
                  {flower.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

        </div>

        {/* Feedback Area */}
        <div className="h-[40px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div
                key={feedback}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`text-2xl md:text-3xl font-bold bg-white/80 px-6 py-2 rounded-full ${feedback === "Ang galing! ⭐" ? "text-[#27ae60]" : "text-[#c0392b]"}`}
              >
                {feedback}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Floating Stars */}
      <AnimatePresence>
        {stars.map(star => (
          <motion.div
            key={star.id}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ scale: 1.5, x: star.x, y: star.y, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 text-5xl pointer-events-none z-50 -ml-6 -mt-6"
          >
            ⭐
          </motion.div>
        ))}
      </AnimatePresence>

      {/* End Game Overlay */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#E0F7FA]/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              🎉
            </motion.div>
            <h1 className="text-[#1b5e20] text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-sm">NAPAKAHUSAY!</h1>
            <p className="text-2xl text-[#2c3e50] font-bold mb-8">Matagumpay mong natapos ang laro!</p>
            
            <div className="flex gap-4">
              <Button size="lg" onClick={resetGame} className="bg-[#27ae60] hover:bg-[#1e8449] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#1e8449] hover:shadow-[0_2px_0_#1e8449] hover:translate-y-1 transition-all">
                Maglaro Muli 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}